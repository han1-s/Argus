$ErrorActionPreference = 'Stop'
$titles = @('ARGUS Web Backend', 'ARGUS Web Frontend')
$stopped = 0
$controlDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Control'
$tracked = @(
  @{ File = 'web-Web-Backend.pid'; Pattern = '(?i)src[\\/]server\.js' },
  @{ File = 'web-Web-Frontend.pid'; Pattern = '(?i)vite[\\/]bin[\\/]vite\.js' }
)

# Prefer the recorded PIDs, but confirm that each process is Node and runs the expected entry point.
foreach ($item in $tracked) {
  $pidFile = Join-Path $controlDir $item.File
  if (-not (Test-Path $pidFile)) { continue }
  $id = 0
  if ([int]::TryParse((Get-Content -Raw $pidFile).Trim(), [ref]$id)) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $id" -ErrorAction SilentlyContinue
    if ($process -and $process.Name -eq 'node.exe' -and $process.CommandLine -match $item.Pattern) {
      Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
      $stopped++
    }
  }
  Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Close only the two consoles created by ARGUS-Web.cmd, including npm and Node children.
foreach ($window in @(Get-Process -Name cmd -ErrorAction SilentlyContinue | Where-Object { $titles -contains $_.MainWindowTitle })) {
  & taskkill.exe /PID $window.Id /T /F 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { $stopped++ }
}

# Also stop a Web service if its original CMD window was already closed.
$listeningPorts = @{}
try {
  foreach ($connection in @(Get-NetTCPConnection -State Listen -LocalPort 3001,5173 -ErrorAction Stop)) {
    $listeningPorts[[int]$connection.OwningProcess] = [int]$connection.LocalPort
  }
} catch { }
foreach ($process in @(Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue)) {
  if (-not $process.CommandLine) { continue }
  $port = $listeningPorts[[int]$process.ProcessId]
  $isBackend = $port -eq 3001 -and $process.CommandLine -match '(?i)(?:^|\s)src[\\/]server\.js(?:\s|$)'
  $isFrontend = $port -eq 5173 -and $process.CommandLine -match '(?i)vite[\\/]bin[\\/]vite\.js'
  if ($isBackend -or $isFrontend) {
    Stop-Process -Id $process.ProcessId -Force -ErrorAction SilentlyContinue
    $stopped++
  }
}

if ($stopped) {
  Write-Host 'Servidores Web do ARGUS encerrados.' -ForegroundColor Green
} else {
  Write-Host 'O Web do ARGUS nao estava em execucao.'
}
