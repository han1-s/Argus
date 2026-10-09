param([switch]$StopAll, [switch]$StopServerOnly, [switch]$StartServerOnly, [string]$ServerUrl = $env:ARGUS_SERVER_URL)
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
function Start-Server {
  $node = Find-Node
  if (-not $node) { Write-Host 'Node.js não encontrado. Escolha Preparar servidor primeiro.' -ForegroundColor Yellow; return }
  if (-not (Test-Path (Join-Path $ProjectRoot '.env'))) { Write-Host 'Arquivo .env ausente. Escolha Preparar servidor primeiro.' -ForegroundColor Yellow; return }
  if (-not (Test-Path (Join-Path $ProjectRoot 'node_modules\express\package.json'))) { Write-Host 'Dependências ausentes. Escolha Preparar servidor primeiro.' -ForegroundColor Yellow; return }
  $entry = Join-Path $ProjectRoot 'backend\server.js'
  $port = 3000; $envFile = Join-Path $ProjectRoot '.env'
  $portLine = Get-Content $envFile | Where-Object { $_ -match '^\s*PORT\s*=\s*\d+' } | Select-Object -First 1
  if ($portLine -match '^\s*PORT\s*=\s*(\d+)') { $port = [int]$Matches[1] }
  $address = "http://localhost:$port"
  $running = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -and $_.CommandLine.Contains($entry) } | Select-Object -First 1
  if ($running) { Set-Content -Path $ServerPidFile -Value $running.ProcessId; Write-Host "Servidor ARGUS já está ativo (PID $($running.ProcessId))." -ForegroundColor Green; & $EdgeLauncher -Url $address; return }
  $logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
  New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  $outLog = Join-Path $logDir 'server.out.log'; $errLog = Join-Path $logDir 'server.err.log'
  $process = Start-Process -FilePath $node -ArgumentList "`"$entry`"" -WorkingDirectory $ProjectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $outLog -RedirectStandardError $errLog
  Set-Content -Path $ServerPidFile -Value $process.Id
  Start-Sleep -Seconds 2
  if ($process.HasExited) { Write-Host 'O servidor encerrou durante a inicialização. Confira o log de erro:' -ForegroundColor Red; Write-Host $errLog; Get-Content $errLog -Tail 12; return }
  Write-Host "Servidor ARGUS iniciado (PID $($process.Id)). Abrindo o painel no Microsoft Edge em $address." -ForegroundColor Green
  & $EdgeLauncher -Url $address
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
if ($StartServerOnly) { Start-Server; exit 0 }

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
  try { Start-Agent }
  catch { Write-Host "Falha: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
} else {
  try { Start-Server }
  catch { Write-Host "Falha: $($_.Exception.Message)" -ForegroundColor Red; exit 1 }
}
