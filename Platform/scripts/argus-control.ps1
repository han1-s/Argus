param([switch]$StopAll, [string]$ServerUrl = $env:ARGUS_SERVER_URL, [string]$PairingCode = $env:ARGUS_PAIR_CODE)
$ErrorActionPreference = 'Stop'
$ParentRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ProjectRoot = if (Test-Path (Join-Path $ParentRoot 'backend\server.js')) { $ParentRoot } else { $PSScriptRoot }
$ControlDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Control'
New-Item -ItemType Directory -Force -Path $ControlDir | Out-Null
$ServerPidFile = Join-Path $ControlDir 'server.pid'
$AgentDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Agent'
$AgentScript = Join-Path $AgentDir 'agent.js'
$AgentStartup = Join-Path ([Environment]::GetFolderPath('Startup')) 'ARGUS Agent.lnk'

function Pause-Menu { Read-Host 'Pressione Enter para voltar ao menu' | Out-Null }
function Show-MoreInfo {
  param([switch]$AgentOnly)
  Clear-Host
  if ($AgentOnly) {
    Write-Host 'SAIBA MAIS - CONTROLE DO AGENTE' -ForegroundColor Magenta
    Write-Host ''
    Write-Host '1 - Instalar/conectar: baixa o agente, grava o servidor e o codigo temporario, pareia este computador e inicia o agente.'
    Write-Host '    O codigo e de uso unico e expira; gere outro no painel se estiver vencido.'
    Write-Host '2 - Iniciar: inicia o agente ja configurado e habilita seu inicio ao entrar no Windows.'
    Write-Host '3 - Parar: encerra o agente deste computador e remove o inicio automatico.'
    Write-Host '4 - Sair: fecha este menu sem alterar o agente.'
  } else {
    Write-Host 'SAIBA MAIS - CENTRAL ARGUS' -ForegroundColor Magenta
    Write-Host ''
    Write-Host '1 - Preparar servidor: instala Node.js se faltar, baixa dependencias e cria/abre .env para configurar o MySQL.'
    Write-Host '    Inicie o MySQL antes de continuar. Esta opcao nao inicia o painel.'
    Write-Host '2 - Iniciar servidor: executa a API em segundo plano e abre o painel no navegador.'
    Write-Host '3 - Instalar/conectar agente: pareia este computador usando o codigo temporario do painel e inicia o agente.'
    Write-Host '4 - Iniciar agente: inicia o agente ja configurado neste computador.'
    Write-Host '5 - Parar locais: encerra o servidor e o agente deste computador e remove a inicializacao automatica do agente.'
    Write-Host '    Agentes em outros computadores devem ser parados em cada endpoint.'
    Write-Host '6 - Sair: fecha o menu sem alterar os processos.'
  }
  Write-Host ''
  Pause-Menu
}
function Find-Node {
  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) { return $node.Source }
  $standard = Join-Path $env:ProgramFiles 'nodejs\node.exe'
  if (Test-Path $standard) { return $standard }
  return $null
}
function Get-AgentProcesses {
  $agentPort = 43172
  $configPath = Join-Path $AgentDir 'config.json'
  if (-not (Test-Path $configPath)) { $configPath = Join-Path $ProjectRoot 'agent\config.json' }
  if (Test-Path $configPath) { try { $configuredPort = [int](Get-Content -Raw $configPath | ConvertFrom-Json).bridgePort; if ($configuredPort -gt 0) { $agentPort = $configuredPort } } catch {} }
  $listenerIds = @()
  if (Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue) { $listenerIds = @(Get-NetTCPConnection -LocalPort $agentPort -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique) }
  $projectAgent = Join-Path $ProjectRoot 'agent\agent.js'
  return @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -and ($_.CommandLine.Contains($AgentScript) -or $_.CommandLine.Contains($projectAgent) -or ($_.CommandLine -match 'agent\.js' -and $listenerIds -contains $_.ProcessId)) })
}
function Install-Node {
  if (Find-Node) { return $true }
  $winget = Get-Command winget -ErrorAction SilentlyContinue
  if (-not $winget) { Write-Host 'Não encontrei Node.js nem winget. Instale Node.js LTS e tente novamente.' -ForegroundColor Yellow; return $false }
  Write-Host 'Instalando Node.js LTS usando winget...'
  & $winget.Source install --id OpenJS.NodeJS.LTS --exact --silent --accept-package-agreements --accept-source-agreements
  if (Find-Node) { return $true }
  Write-Host 'A instalação pode ter atualizado o PATH. Feche e abra o ARGUS.cmd novamente.' -ForegroundColor Yellow
  return $false
}
function Prepare-Server {
  if (-not (Install-Node)) { return }
  if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules\express\package.json'))) {
    Write-Host 'Instalando dependências do servidor...'
    Push-Location $ProjectRoot
    try { npm install; if ($LASTEXITCODE -ne 0) { throw 'npm install não terminou com sucesso.' } }
    finally { Pop-Location }
  }
  $envFile = Join-Path $ProjectRoot '.env'
  if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $ProjectRoot '.env.example') $envFile
    Write-Host 'Criei .env a partir do exemplo. Confira as credenciais MySQL no editor que será aberto.' -ForegroundColor Yellow
    Start-Process notepad.exe -ArgumentList "`"$envFile`"" -Wait
  } else { Write-Host 'Dependências e .env encontrados.' -ForegroundColor Green }
  Write-Host 'Confira também se o serviço MySQL está iniciado.'
}
function Install-Agent {
  param([string]$RequestedServerUrl, [string]$RequestedPairingCode)
  if (-not $RequestedServerUrl) { $RequestedServerUrl = $ServerUrl }
  if (-not $RequestedPairingCode) { $RequestedPairingCode = $PairingCode }
  if (-not $RequestedServerUrl) { $RequestedServerUrl = Read-Host 'Endereço do servidor ARGUS (ex.: http://192.168.0.10:3000)' }
  try { $serverUri = [Uri]$RequestedServerUrl.Trim().TrimEnd('/') } catch { throw 'Endereço do servidor inválido.' }
  if ($serverUri.Scheme -notin @('http','https') -or -not $serverUri.IsAbsoluteUri) { throw 'Use um endereço começando com http:// ou https://.' }
  $RequestedServerUrl = $serverUri.GetLeftPart([UriPartial]::Authority)
  if (-not $RequestedPairingCode) { $RequestedPairingCode = Read-Host 'Código temporário mostrado em Adicionar computador' }
  $RequestedPairingCode = $RequestedPairingCode.Trim().ToUpper()
  if ($RequestedPairingCode -notmatch '^ARG-[A-F0-9]{4}-[A-F0-9]{4}$') { throw 'Código de pareamento inválido ou expirado.' }
  if (-not (Install-Node)) { return $false }
  New-Item -ItemType Directory -Force -Path $AgentDir | Out-Null
  Write-Host 'Baixando o agente do servidor ARGUS...'
  Invoke-WebRequest -Uri "$RequestedServerUrl/downloads/argus-agent.js" -OutFile (Join-Path $AgentDir 'agent.js')
  $agentConfig = [ordered]@{ serverUrl = $RequestedServerUrl; connectionCode = $RequestedPairingCode; heartbeatSeconds = 10; bridgePort = 43172 }
  $agentConfig | ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $AgentDir 'config.json')
  Write-Host "Agente configurado em $AgentDir." -ForegroundColor Green
  return $true
}
function Start-Server {
  $node = Find-Node
  if (-not $node) { Write-Host 'Node.js não encontrado. Escolha Preparar servidor primeiro.' -ForegroundColor Yellow; return }
  if (-not (Test-Path (Join-Path $ProjectRoot '.env'))) { Write-Host 'Arquivo .env ausente. Escolha Preparar servidor primeiro.' -ForegroundColor Yellow; return }
  if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules\express\package.json'))) { Write-Host 'Dependências ausentes. Escolha Preparar servidor primeiro.' -ForegroundColor Yellow; return }
  $entry = Join-Path $ProjectRoot 'backend\server.js'
  $running = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($entry) } | Select-Object -First 1
  if ($running) { Set-Content -Path $ServerPidFile -Value $running.ProcessId; Write-Host "Servidor ARGUS já está ativo (PID $($running.ProcessId))." -ForegroundColor Green; return }
  $logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $outLog = Join-Path $logDir 'server.out.log'; $errLog = Join-Path $logDir 'server.err.log'
  $process = Start-Process -FilePath $node -ArgumentList "`"$entry`"" -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
  Set-Content -Path $ServerPidFile -Value $process.Id
  Start-Sleep -Seconds 2
  if ($process.HasExited) { Write-Host 'O servidor encerrou durante a inicialização. Confira o log de erro:' -ForegroundColor Red; Write-Host $errLog; Get-Content $errLog -Tail 12; return }
  $port = 3000; $envFile = Join-Path $ProjectRoot '.env'
  $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=\s*\d+' } | Select-Object -First 1
  if ($portLine -match '^\s*PORT\s*=\s*(\d+)') { $port = [int]$Matches[1] }
  $address = "http://localhost:$port"
  Write-Host "Servidor ARGUS iniciado (PID $($process.Id)). Abrindo o painel em $address." -ForegroundColor Green
  Start-Process $address
}
function Stop-Server {
  $entry = Join-Path $ProjectRoot 'backend\server.js'
  $targets = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($entry) })
  foreach ($target in $targets) { Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue }
  Remove-Item $ServerPidFile -Force -ErrorAction SilentlyContinue
  if ($targets.Count) { Write-Host 'Servidor ARGUS parado.' -ForegroundColor Green } else { Write-Host 'Servidor ARGUS não estava em execução.' }
}
function Start-Agent {
  if (-not (Test-Path $AgentScript) -or -not (Test-Path (Join-Path $AgentDir 'config.json'))) {
    if (-not (Install-Agent)) { return }
  }
  $node = Find-Node
  if (-not $node) { Write-Host 'Node.js não encontrado. Reinstale o agente pelo instalador guiado.' -ForegroundColor Yellow; return }
  $processes = @(Get-AgentProcesses)
  if (-not $processes.Count) {
    $logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'; New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    Start-Process -FilePath $node -ArgumentList "`"$AgentScript`"" -WorkingDirectory $AgentDir -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'agent.out.log') -RedirectStandardError (Join-Path $logDir 'agent.err.log') | Out-Null
  }
  $hiddenLauncher = Join-Path $AgentDir 'iniciar-agente-oculto.vbs'
  $hiddenCommand = 'Set shell = CreateObject("WScript.Shell")' + "`r`n" + 'shell.CurrentDirectory = "' + $AgentDir + '"' + "`r`n" + 'shell.Run """' + $node + '"" ""' + $AgentScript + '""", 0, False'
  Set-Content -Encoding ascii -Path $hiddenLauncher -Value $hiddenCommand
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($AgentStartup)
  $shortcut.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'; $shortcut.Arguments = "`"$hiddenLauncher`""; $shortcut.WorkingDirectory = $AgentDir; $shortcut.Description = 'Agente ARGUS iniciado ao entrar no Windows'; $shortcut.Save()
  Write-Host 'Agente local iniciado e configurado para iniciar com o Windows.' -ForegroundColor Green
}
function Stop-Agent {
  $targets = @(Get-AgentProcesses)
  foreach ($target in $targets) { Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue }
  Remove-Item $AgentStartup -Force -ErrorAction SilentlyContinue
  if ($targets.Count) { Write-Host 'Agente ARGUS deste computador parado; inicialização automática removida.' -ForegroundColor Green } else { Write-Host 'Agente ARGUS não estava em execução; inicialização automática removida.' }
}

if ($StopAll) { Stop-Server; Stop-Agent; exit 0 }

if ($env:ARGUS_AGENT_ONLY -eq '1') {
  do {
    Clear-Host
    Write-Host 'ARGUS — Controle do agente' -ForegroundColor Magenta
    Write-Host ''
    Write-Host '  1. Instalar/conectar este computador'
    Write-Host '  2. Iniciar agente instalado'
    Write-Host '  3. Parar agente neste computador'
    Write-Host '  4. Sair'
    Write-Host '  5. Saiba mais'
    Write-Host ''
    $choice = Read-Host 'Escolha uma opção'
    try {
      switch ($choice) {
        '1' { Stop-Agent; if (Install-Agent) { Start-Agent }; Pause-Menu }
        '2' { Start-Agent; Pause-Menu }
        '3' { Stop-Agent; Pause-Menu }
        '4' { break }
        '5' { Show-MoreInfo -AgentOnly }
        default { Write-Host 'Opção inválida.'; Pause-Menu }
      }
    } catch { Write-Host "Falha: $($_.Exception.Message)" -ForegroundColor Red; Pause-Menu }
  } while ($choice -ne '4')
} else {
  do {
    Clear-Host
    Write-Host 'ARGUS — Central de instalação e execução' -ForegroundColor Magenta
    Write-Host ''
    Write-Host '  1. Preparar servidor (Node.js, dependências e .env)'
    Write-Host '  2. Iniciar servidor e abrir o painel'
    Write-Host '  3. Instalar/conectar o agente neste computador'
    Write-Host '  4. Iniciar agente instalado neste computador'
    Write-Host '  5. Parar servidor e agente deste computador'
    Write-Host '  6. Sair'
    Write-Host '  7. Saiba mais'
    Write-Host ''
    $choice = Read-Host 'Escolha uma opção'
    try {
      switch ($choice) {
        '1' { Prepare-Server; Pause-Menu }
        '2' { Start-Server; Pause-Menu }
        '3' { Stop-Agent; if (Install-Agent) { Start-Agent }; Pause-Menu }
        '4' { Start-Agent; Pause-Menu }
        '5' { Stop-Server; Stop-Agent; Pause-Menu }
        '6' { break }
        '7' { Show-MoreInfo }
        default { Write-Host 'Opção inválida.'; Pause-Menu }
      }
    } catch { Write-Host "Falha: $($_.Exception.Message)" -ForegroundColor Red; Pause-Menu }
  } while ($choice -ne '6')
}
