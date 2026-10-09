$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = Join-Path $root 'Web\Backend'
$frontendRoot = Join-Path $root 'Web\Frontend'
$node = (Get-Command node.exe -ErrorAction Stop).Source
$controlDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Control'
$logDir = Join-Path $env:LOCALAPPDATA 'ARGUS\Logs'
New-Item -ItemType Directory -Force -Path $controlDir, $logDir | Out-Null

foreach ($port in @(3001, 5173)) {
  $client = [Net.Sockets.TcpClient]::new()
  try { $client.Connect('127.0.0.1', $port); throw "A porta $port já está ocupada. Encerre a instância anterior do ARGUS Web primeiro." }
  catch [System.Net.Sockets.SocketException] { }
  finally { $client.Dispose() }
}

$services = @(
  @{ Name = 'Web Backend'; Entry = (Join-Path $backendRoot 'src\server.js'); Working = $backendRoot; Args = @('src/server.js'); Port = 3001 },
  @{ Name = 'Web Frontend'; Entry = (Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'); Working = $frontendRoot; Args = @((Join-Path $frontendRoot 'node_modules\vite\bin\vite.js'), '--host', '127.0.0.1', '--strictPort'); Port = 5173 }
)
$started = @()
try {
  foreach ($service in $services) {
    if (-not (Test-Path $service.Entry)) { throw "Arquivo de inicialização ausente: $($service.Entry). Instale as dependências do ARGUS primeiro." }
    $slug = $service.Name -replace ' ', '-'
    $process = Start-Process -FilePath $node -ArgumentList $service.Args -WorkingDirectory $service.Working -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir "web-$slug.out.log") -RedirectStandardError (Join-Path $logDir "web-$slug.err.log")
    Set-Content -Path (Join-Path $controlDir "web-$slug.pid") -Value $process.Id -Encoding ascii
    $started += $service
  }

  foreach ($service in $services) {
    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
      $client = [Net.Sockets.TcpClient]::new()
      try { $client.Connect('127.0.0.1', $service.Port); $ready = $true; break }
      catch [System.Net.Sockets.SocketException] { Start-Sleep -Milliseconds 500 }
      finally { $client.Dispose() }
    }
    if (-not $ready) { throw "$($service.Name) não abriu a porta $($service.Port). Consulte os logs em $logDir." }
  }
  Write-Host 'Web iniciado em segundo plano.' -ForegroundColor Green
  Write-Host 'Frontend: http://127.0.0.1:5173/login'
  Write-Host "Logs: $logDir"
  Start-Process 'http://127.0.0.1:5173/login'
} catch {
  & (Join-Path $PSScriptRoot 'stop-web.ps1') | Out-Null
  Write-Error $_
  exit 1
}
