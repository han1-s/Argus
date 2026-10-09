$listeners = @(Get-NetTCPConnection -State Listen -LocalPort 3001,5173 -ErrorAction SilentlyContinue)
$api = $listeners | Where-Object LocalPort -eq 3001 | Select-Object -First 1
$vite = $listeners | Where-Object LocalPort -eq 5173 | Select-Object -First 1
if (-not $api -or -not $vite) { exit 1 }

$apiProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($api.OwningProcess)" -ErrorAction SilentlyContinue
$viteProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($vite.OwningProcess)" -ErrorAction SilentlyContinue
if ($apiProcess.CommandLine -match '(?i)(?:^|\s)src[\\/]server\.js(?:\s|$)' -and $viteProcess.CommandLine -match '(?i)vite[\\/]bin[\\/]vite\.js') {
  exit 0
}
exit 1
