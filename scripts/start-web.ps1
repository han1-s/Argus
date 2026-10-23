param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$platformRoot = Join-Path $root 'Platform'
$backendRoot = Join-Path $root 'Web\Backend'
$frontendRoot = Join-Path $root 'Web\Frontend'
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) { throw 'Node.js nao encontrado. Escolha Instalar ou atualizar no ARGUS.cmd.' }
$node = $nodeCommand.Source
$controlDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Control'
$logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
$envFile = Join-Path $platformRoot '.env'
New-Item -ItemType Directory -Force -Path $controlDir, $logDir | Out-Null

if (-not (Test-Path $envFile)) {
  throw 'Platform\.env ausente. Escolha Instalar ou atualizar no ARGUS.cmd antes de iniciar o Web.'
}

$envText = Get-Content -LiteralPath $envFile -Raw
if ($envText -match '(?im)^\s*MYSQL_PASSWORD\s*=\s*(change-this-password|configure-during-install)\s*$') {
  throw 'Configure o banco compartilhado pela opcao Instalar ou atualizar no ARGUS.cmd.'
}
if (-not (Test-Path (Join-Path $backendRoot 'node_modules\express\package.json')) -or -not (Test-Path (Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'))) {
  throw 'Dependencias do Web ausentes. Escolha Instalar ou atualizar no menu principal do ARGUS.'
}

$services = @(
  @{ Name = 'Web Backend'; Entry = (Join-Path $backendRoot 'src\server.js'); Working = $backendRoot; Args = @('src/server.js'); Port = 3001; Pattern = '(?i)(?:^|\s)src[\\/]server\.js(?:\s|$)'; ReadyUrl = 'http://127.0.0.1:3001/api/health' },
  @{ Name = 'Web Frontend'; Entry = (Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'); Working = $frontendRoot; Args = @((Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'), '--host', '127.0.0.1', '--strictPort'); Port = 5173; Pattern = '(?i)vite[\\/]bin[\\/]vite\.js'; ReadyUrl = 'http://127.0.0.1:5173/login' }
)
$started = @()

function Get-ListenerProcess([int]$Port) {
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $listener) { return $null }
  return Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)" -ErrorAction SilentlyContinue
}

function Test-ServiceReady($Service) {
  try {
    $response = Invoke-WebRequest -Uri $Service.ReadyUrl -TimeoutSec 2 -UseBasicParsing
    if ($Service.Name -eq 'Web Backend') {
      $payload = $response.Content | ConvertFrom-Json
      return $response.StatusCode -eq 200 -and $payload.ok -eq $true -and $payload.database -eq $true
    }
    return $response.StatusCode -eq 200
  } catch { return $false }
}

try {
  foreach ($service in $services) {
    if (-not (Test-Path $service.Entry)) { throw "Dependencia de inicializacao ausente: $($service.Entry). Escolha Instalar ou atualizar no menu principal do ARGUS." }
    $existing = Get-ListenerProcess $service.Port
    if ($existing) {
      if ($existing.Name -ne 'node.exe' -or $existing.CommandLine -notmatch $service.Pattern) {
        throw "A porta $($service.Port) do $($service.Name) esta ocupada por outro processo. Feche-o ou escolha outra porta."
      }
      continue
    }

    $slug = $service.Name -replace ' ', '-'
    $previousEnvFile = $env:ARGUS_ENV_FILE
    $env:ARGUS_ENV_FILE = $envFile
    try {
      $process = Start-Process -FilePath $node -ArgumentList $service.Args -WorkingDirectory $service.Working -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir "web-$slug.out.log") -RedirectStandardError (Join-Path $logDir "web-$slug.err.log")
    } finally {
      if ($null -eq $previousEnvFile) { Remove-Item Env:ARGUS_ENV_FILE -ErrorAction SilentlyContinue }
      else { $env:ARGUS_ENV_FILE = $previousEnvFile }
    }
    Set-Content -Path (Join-Path $controlDir "web-$slug.pid") -Value $process.Id -Encoding ascii
    $started += [pscustomobject]@{ Name = $service.Name; Process = $process; PidFile = (Join-Path $controlDir "web-$slug.pid") }

    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
      $process.Refresh()
      if ($process.HasExited) { break }
      if (Test-ServiceReady $service) { $ready = $true; break }
      Start-Sleep -Milliseconds 500
    }
    if (-not $ready) {
      $errorLog = Join-Path $logDir "web-$slug.err.log"
      $details = if (Test-Path $errorLog) { (Get-Content $errorLog -Tail 12) -join [Environment]::NewLine } else { '' }
      throw "$($service.Name) nao iniciou ou nao ficou pronto. Verifique Platform\.env e o MySQL. Log: $errorLog`n$details"
    }
  }

  foreach ($service in $services) {
    if (-not (Test-ServiceReady $service)) { throw "$($service.Name) nao respondeu corretamente em $($service.ReadyUrl)." }
  }
  Write-Host 'Web pronto: API e frontend ativos; a API confirmou conexao com o MySQL.' -ForegroundColor Green
  Write-Host 'Frontend: http://127.0.0.1:5173/login'
  Write-Host "Logs: $logDir"
  if (-not $NoBrowser) { & (Join-Path $PSScriptRoot 'open-edge.ps1') -Url 'http://127.0.0.1:5173/login' }
  if (-not $started.Count) { exit 2 }
} catch {
  foreach ($item in $started) {
    Stop-Process -Id $item.Process.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $item.PidFile -Force -ErrorAction SilentlyContinue
  }
  Write-Error $_
  exit 1
}
