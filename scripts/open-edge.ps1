param([Parameter(Mandatory = $true)][string]$Url)

$candidates = @(
  (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
  (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
  (Join-Path $env:LOCALAPPDATA 'Microsoft\Edge\Application\msedge.exe')
) | Where-Object { $_ -and (Test-Path $_) }
$edge = Get-Command msedge.exe -ErrorAction SilentlyContinue
$edgePath = if ($edge) { $edge.Source } else { $candidates | Select-Object -First 1 }

try {
  if ($edgePath) {
    Start-Process -FilePath $edgePath -ArgumentList @($Url) -ErrorAction Stop | Out-Null
  } else {
    Write-Warning 'Microsoft Edge não encontrado; abrindo o navegador padrão.'
    Start-Process $Url -ErrorAction Stop | Out-Null
  }
} catch {
  Write-Warning "Não foi possível abrir o navegador automaticamente: $($_.Exception.Message)"
}
