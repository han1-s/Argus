param([switch]$StopAll, [switch]$StopServerOnly, [switch]$StartServerOnly, [switch]$NoBrowser, [string]$ServerUrl = $env:ARGUS_SERVER_URL)
$ErrorActionPreference = 'Stop'
$ParentRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ProjectRoot = if (Test-Path (Join-Path $ParentRoot 'backend\server.js')) { $ParentRoot } else { $PSScriptRoot }
$ControlDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Control'
$EdgeLauncher = Join-Path $ParentRoot '..\scripts\open-edge.ps1'
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
    Write-Host '1 - Instalar/configurar: baixa o agente e abre o assistente local no navegador.'
    Write-Host '    No assistente, informe o servidor LAN, nome do PC e autentique sua conta ARGUS.'
    Write-Host '    Este computador nao precisa instalar MySQL: os dados ficam numa fila local ate o servidor voltar.'
    Write-Host '2 - Iniciar: inicia o agente ja configurado e habilita seu inicio ao entrar no Windows.'
    Write-Host '3 - Parar: encerra o agente deste computador e remove o inicio automatico.'
    Write-Host '4 - Sair: fecha este menu sem alterar o agente.'
  } else {
    Write-Host 'SAIBA MAIS - CENTRAL ARGUS' -ForegroundColor Magenta
    Write-Host ''
    Write-Host '1 - Instalar/atualizar: instala dependencias e configura o banco compartilhado Web + Platform.'
    Write-Host '    O assistente solicita uma conta administradora local do MySQL e cria uma conta de aplicacao restrita.'
    Write-Host '2 - Iniciar servidor: inicia a API Platform em segundo plano e abre o painel no navegador.'
    Write-Host '3 - Instalar/configurar agente: abre o assistente local para informar servidor, nome e conta ARGUS.'
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
function Get-ForegroundWatcherProcesses {
  $watcherScript = Join-Path $AgentDir 'foreground-watcher.ps1'
  return @(Get-CimInstance Win32_Process | Where-Object { $_.Name -in @('powershell.exe','pwsh.exe') -and $_.CommandLine -and $_.CommandLine.Contains($watcherScript) })
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
  $installScript = Join-Path $ParentRoot '..\scripts\install-dependencies.cmd'
  if (-not (Test-Path $installScript)) { throw 'Instalador principal ausente. Execute ARGUS.cmd na pasta do projeto.' }
  $process = Start-Process -FilePath $env:ComSpec -ArgumentList @('/d', '/c', ('"{0}"' -f $installScript)) -Wait -PassThru -NoNewWindow
  if ($process.ExitCode -ne 0) { throw 'A instalacao/configuracao nao terminou. Corrija a mensagem exibida e tente novamente.' }
  Write-Host 'Dependencias e banco compartilhado estao prontos.' -ForegroundColor Green
}
function Install-Agent {
  param([string]$RequestedServerUrl)
  if (-not $RequestedServerUrl) { $RequestedServerUrl = $ServerUrl }
  if (-not $RequestedServerUrl) { $RequestedServerUrl = Read-Host 'Endereço do painel ARGUS para baixar os componentes (ex.: http://192.168.0.10:3000)' }
  try { $serverUri = [Uri]$RequestedServerUrl.Trim().TrimEnd('/') } catch { throw 'Endereço do servidor inválido.' }
  if ($serverUri.Scheme -notin @('http','https') -or -not $serverUri.IsAbsoluteUri) { throw 'Use um endereço começando com http:// ou https://.' }
  $RequestedServerUrl = $serverUri.GetLeftPart([UriPartial]::Authority)
  if (-not (Install-Node)) { return $false }
  New-Item -ItemType Directory -Force -Path $AgentDir | Out-Null
  Write-Host 'Baixando o agente e o assistente local do ARGUS...'
  Invoke-WebRequest -Uri "$RequestedServerUrl/downloads/argus-agent.js" -OutFile (Join-Path $AgentDir 'agent.js')
  Invoke-WebRequest -Uri "$RequestedServerUrl/downloads/argus-setup.js" -OutFile (Join-Path $AgentDir 'setup.js')
  Invoke-WebRequest -Uri "$RequestedServerUrl/downloads/argus-foreground-watcher.ps1" -OutFile (Join-Path $AgentDir 'foreground-watcher.ps1')
  Remove-Item (Join-Path $AgentDir 'setup-complete') -Force -ErrorAction SilentlyContinue
  $logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $setupScript = Join-Path $AgentDir 'setup.js'
  $setupProcess = Start-Process -FilePath (Find-Node) -ArgumentList "`"$setupScript`"" -WorkingDirectory $AgentDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'setup.out.log') -RedirectStandardError (Join-Path $logDir 'setup.err.log')
  Start-Sleep -Milliseconds 500
  $setupProcess.Refresh()
  if ($setupProcess.HasExited) { throw 'O assistente local não iniciou. Confira %LOCALAPPDATA%\ARGUS\Logs\setup.err.log.' }
  $setupAddress = 'http://127.0.0.1:43173'
  Write-Host 'Abrindo o assistente ARGUS no navegador. Informe nome, servidor LAN e conta para concluir a conexão.' -ForegroundColor Green
  Start-Process $setupAddress
  $completionFile = Join-Path $AgentDir 'setup-complete'
  $setupTimeout = [Diagnostics.Stopwatch]::StartNew()
  while (-not (Test-Path $completionFile)) {
    $setupProcess.Refresh()
    if ($setupProcess.HasExited) { Write-Host 'O assistente foi fechado antes de concluir a configuração.' -ForegroundColor Yellow; return $false }
    if ($setupTimeout.Elapsed.TotalMinutes -ge 15) {
      Stop-Process -Id $setupProcess.Id -Force -ErrorAction SilentlyContinue
      throw 'Tempo limite do assistente excedido. Execute novamente o ARGUS.cmd para continuar.'
    }
    Start-Sleep -Seconds 1
  }
  Remove-Item $completionFile -Force -ErrorAction SilentlyContinue
  return $true
}
function Test-ServerReady([string]$Address) {
  try {
    $response = Invoke-WebRequest -Uri "$Address/api/health" -TimeoutSec 2 -UseBasicParsing
    $payload = $response.Content | ConvertFrom-Json
    return $response.StatusCode -eq 200 -and $payload.ok -eq $true -and $payload.database -eq $true
  } catch { return $false }
}
function Start-Server {
  $node = Find-Node
  if (-not $node) { Write-Host 'Node.js nao encontrado. Escolha Instalar/atualizar primeiro.' -ForegroundColor Yellow; return $false }
  if (-not (Test-Path (Join-Path $ProjectRoot '.env'))) { Write-Host 'Platform\.env ausente. Escolha Instalar/atualizar primeiro.' -ForegroundColor Yellow; return $false }
  if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules\express\package.json'))) { Write-Host 'Dependencias ausentes. Escolha Instalar/atualizar primeiro.' -ForegroundColor Yellow; return $false }
  $entry = Join-Path $ProjectRoot 'backend\server.js'
  $port = 3000; $envFile = Join-Path $ProjectRoot '.env'
  $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=\s*\d+' } | Select-Object -First 1
  if ($portLine -match '^\s*PORT\s*=\s*(\d+)') { $port = [int]$Matches[1] }
  $address = "http://127.0.0.1:$port"
  $mysqlPasswordLine = Get-Content $envFile | Where-Object { $_ -match '^\s*MYSQL_PASSWORD\s*=' } | Select-Object -First 1
  $mysqlPassword = if ($mysqlPasswordLine) { ($mysqlPasswordLine -replace '^\s*MYSQL_PASSWORD\s*=\s*', '').Trim().Trim('"').Trim("'") } else { '' }
  if ($mysqlPassword -in @('change-this-password', 'configure-during-install', '')) { Write-Host 'Configure o banco compartilhado pela opcao Instalar/atualizar.' -ForegroundColor Yellow; return $false }
  $running = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($entry) } | Select-Object -First 1
  $process = $null
  if ($running) { Set-Content -Path $ServerPidFile -Value $running.ProcessId }
  $logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $errLog = Join-Path $logDir 'server.err.log'
  if (-not $running) {
    $outLog = Join-Path $logDir 'server.out.log'
    $process = Start-Process -FilePath $node -ArgumentList "`"$entry`"" -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
    Set-Content -Path $ServerPidFile -Value $process.Id
  }
  $ready = $false
  for ($attempt = 0; $attempt -lt 40; $attempt++) {
    if ($process) { $process.Refresh(); if ($process.HasExited) { break } }
    if (Test-ServerReady $address) { $ready = $true; break }
    Start-Sleep -Milliseconds 500
  }
  if (-not $ready) {
    if ($process -and -not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue; Remove-Item $ServerPidFile -Force -ErrorAction SilentlyContinue }
    Write-Host 'A Platform nao ficou pronta. Confira o banco MySQL e o log:' -ForegroundColor Red
    Write-Host $errLog
    if (Test-Path $errLog) { Get-Content $errLog -Tail 12 }
    return $false
  }
  $serverPid = if ($running) { $running.ProcessId } else { $process.Id }
  Write-Host "API Platform pronta (PID $serverPid): $address" -ForegroundColor Green
  if (-not $NoBrowser) { & $EdgeLauncher -Url $address }
  return $true
}
function Stop-Server {
  $entry = Join-Path $ProjectRoot 'backend\server.js'
  $port = 3000
  $envFile = Join-Path $ProjectRoot '.env'
  if (Test-Path $envFile) {
    $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=\s*\d+' } | Select-Object -First 1
    if ($portLine -match '^\s*PORT\s*=\s*(\d+)') { $port = [int]$Matches[1] }
  }
  $listenerIds = @()
  try { $listenerIds = @(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique) } catch { }
  $targets = @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -and ($_.CommandLine.Contains($entry) -or ($listenerIds -contains $_.ProcessId -and $_.CommandLine -match '(?i)(?:^|\s)backend[\\/]server\.js(?:\s|$)')) })
  foreach ($target in $targets) { Stop-Process -Id $target.ProcessId -Force -ErrorAction SilentlyContinue }
  $apiWindows = @(Get-Process -Name cmd -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq 'ARGUS Platform API' })
  foreach ($window in $apiWindows) { & taskkill.exe /PID $window.Id /T /F 2>$null | Out-Null }
  Remove-Item $ServerPidFile -Force -ErrorAction SilentlyContinue
  if ($targets.Count -or $apiWindows.Count) { Write-Host 'Servidor ARGUS parado.' -ForegroundColor Green } else { Write-Host 'Servidor ARGUS não estava em execução.' }
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
  $watchers = @(Get-ForegroundWatcherProcesses)
  foreach ($watcher in $watchers) { Stop-Process -Id $watcher.ProcessId -Force -ErrorAction SilentlyContinue }
  Remove-Item $AgentStartup -Force -ErrorAction SilentlyContinue
  if ($targets.Count -or $watchers.Count) { Write-Host 'Agente ARGUS e watcher foreground deste computador parados; inicialização automática removida.' -ForegroundColor Green } else { Write-Host 'Agente ARGUS não estava em execução; inicialização automática removida.' }
}

if ($StopAll) { Stop-Server; Stop-Agent; exit 0 }
if ($StopServerOnly) { Stop-Server; exit 0 }
if ($StartServerOnly) { if (Start-Server) { exit 0 } else { exit 1 } }

if ($env:ARGUS_AGENT_ONLY -eq '1' -and $env:ARGUS_INSTALL_ONLY -eq '1') {
  Clear-Host
  Write-Host 'ARGUS — Instalar e configurar este computador' -ForegroundColor Magenta
  Write-Host ''
  Write-Host "Computador: $env:COMPUTERNAME"
  Write-Host 'O assistente no navegador solicitará o nome, o endereço LAN do servidor e a autenticação ARGUS.' -ForegroundColor Yellow
  try { if (Install-Agent) { Stop-Agent; Start-Agent } }
  catch { Write-Host "Falha: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
  exit 0
} elseif ($env:ARGUS_AGENT_ONLY -eq '1') {
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
        '1' { if (Install-Agent) { Stop-Agent; Start-Agent }; Pause-Menu }
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
    Write-Host '  1. Instalar/atualizar dependencias e configurar o banco compartilhado'
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
        '3' { if (Install-Agent) { Stop-Agent; Start-Agent }; Pause-Menu }
        '4' { Start-Agent; Pause-Menu }
        '5' { Stop-Server; Stop-Agent; Pause-Menu }
        '6' { break }
        '7' { Show-MoreInfo }
        default { Write-Host 'Opção inválida.'; Pause-Menu }
      }
    } catch { Write-Host "Falha: $($_.Exception.Message)" -ForegroundColor Red; Pause-Menu }
  } while ($choice -ne '6')
}
