$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$platformRoot = Join-Path $root 'Platform'
$backendRoot = Join-Path $root 'Web\Backend'
$frontendRoot = Join-Path $root 'Web\Frontend'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$controlDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Control'
$logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
$envFile = Join-Path $platformRoot '.env'
$exampleFile = Join-Path $platformRoot '.env.example'
New-Item -ItemType Directory -Force -Path $controlDir, $logDir | Out-Null

if (-not (Test-Path $envFile)) {
  if (-not (Test-Path $exampleFile)) { throw "Arquivo de configuracao ausente: $exampleFile" }
  Copy-Item -LiteralPath $exampleFile -Destination $envFile
  Write-Host 'Criei Platform\.env a partir do modelo. Preencha as credenciais do MySQL; o Web ainda nao foi iniciado.' -ForegroundColor Yellow
  Start-Process -FilePath 'notepad.exe' -ArgumentList @("`"$envFile`"") -Wait
}

$envText = Get-Content -LiteralPath $envFile -Raw
if ($envText -match '(?im)^\s*MYSQL_PASSWORD\s*=\s*change-this-password\s*$') {
  throw 'Configure MYSQL_PASSWORD em Platform\.env e execute Iniciar Web novamente.'
}
if (-not (Test-Path (Join-Path $backendRoot 'node_modules\express\package.json')) -or -not (Test-Path (Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'))) {
  throw 'Dependencias do Web ausentes. Use ARGUS.cmd > Ferramentas > Instalar dependencias e tente novamente.'
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
    if (-not (Test-Path $service.Entry)) { throw "Dependencia de inicializacao ausente: $($service.Entry). Use Ferramentas > Instalar dependencias." }
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
  & (Join-Path $PSScriptRoot 'open-edge.ps1') -Url 'http://127.0.0.1:5173/login'
  if (-not $started.Count) { exit 2 }
} catch {
  foreach ($item in $started) {
    Stop-Process -Id $item.Process.Id -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $item.PidFile -Force -ErrorAction SilentlyContinue
  }
  Write-Error $_
  exit 1
}
