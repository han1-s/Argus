param([switch]$Force)
$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$platformRoot = Join-Path $root 'Platform'
$envPath = Join-Path $platformRoot '.env'
$examplePath = Join-Path $platformRoot '.env.example'
$setupScript = Join-Path $platformRoot 'database\setup-database.js'
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $nodeCommand) { $nodeCommand = Get-Command node -ErrorAction SilentlyContinue }
if (-not $nodeCommand) { throw 'Node.js não está disponível. Prepare primeiro as dependências do ARGUS.' }
if (-not (Test-Path (Join-Path $platformRoot 'node_modules\mysql2\promise.js'))) { throw 'Dependência MySQL ausente. Execute primeiro Instalar/atualizar o ARGUS.' }

function ConvertTo-PlainText([Security.SecureString]$SecureValue) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}

$envText = if (Test-Path $envPath) { Get-Content -LiteralPath $envPath -Raw } else { Get-Content -LiteralPath $examplePath -Raw }
function Read-EnvValue([string]$Name, [string]$Fallback) {
  $match = [regex]::Match($envText, "(?im)^\s*$Name\s*=\s*(.*)$")
  if (-not $match.Success) { return $Fallback }
  return $match.Groups[1].Value.Trim().Trim('"').Trim("'")
}

$currentPassword = Read-EnvValue 'MYSQL_PASSWORD' ''
$currentAdminPassword = Read-EnvValue 'ARGUS_ADMIN_PASSWORD' ''
$currentAdminPasswordB64 = Read-EnvValue 'ARGUS_ADMIN_PASSWORD_B64' ''
$adminConfigured = ($currentAdminPasswordB64 -and $currentAdminPasswordB64 -notin @('change-this-password', 'configure-during-install')) -or ($currentAdminPassword -and $currentAdminPassword -notin @('change-this-password', 'configure-during-install'))
$configured = $currentPassword -and $currentPassword -notin @('change-this-password', 'configure-during-install') -and $adminConfigured
if ($configured -and -not $Force) {
  Write-Host 'Platform/.env já contém uma senha MySQL configurada. Mantive as credenciais existentes.' -ForegroundColor Green
  Write-Host 'A inicialização da API aplica o schema compartilhado sem apagar os dados.'
  exit 0
}

Write-Host 'Configuração inicial do banco compartilhado ARGUS' -ForegroundColor Cyan
Write-Host 'Informe uma conta administradora do MySQL. A senha é usada somente durante esta configuração.'
Write-Host 'O ARGUS criará o banco, as tabelas Web + Platform e uma conta local de aplicação.'
Write-Host ''

$mysqlService = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^(MySQL|MariaDB)' -and $_.Status -ne 'Running' } | Select-Object -First 1
if ($mysqlService) {
  $startService = Read-Host "O serviço $($mysqlService.Name) está parado. Tentar iniciar agora? [S/n]"
  if ($startService -match '^(n|nao|não|no)$') { throw 'Inicie o MySQL e execute novamente Instalar ou atualizar no ARGUS.cmd.' }
  if (-not $startService -or $startService -match '^(s|sim|y|yes)$') {
    try { Start-Service -Name $mysqlService.Name; Start-Sleep -Seconds 2 }
    catch { Write-Host 'Não consegui iniciar o serviço. Inicie o MySQL pelo Windows e execute a configuração novamente.' -ForegroundColor Yellow; throw }
  }
}

$hostDefault = Read-EnvValue 'MYSQL_HOST' '127.0.0.1'
$portDefault = Read-EnvValue 'MYSQL_PORT' '3306'
$databaseDefault = Read-EnvValue 'MYSQL_DATABASE' 'argus'
$mysqlHost = Read-Host "Endereço do MySQL [$hostDefault]"
if (-not $mysqlHost) { $mysqlHost = $hostDefault }
$mysqlPort = Read-Host "Porta do MySQL [$portDefault]"
if (-not $mysqlPort) { $mysqlPort = $portDefault }
$database = Read-Host "Nome do banco compartilhado [$databaseDefault]"
if (-not $database) { $database = $databaseDefault }
$mysqlAdmin = Read-Host 'Usuário administrador do MySQL [root]'
if (-not $mysqlAdmin) { $mysqlAdmin = 'root' }
$mysqlAdminSecure = Read-Host 'Senha do administrador MySQL' -AsSecureString
$mysqlAdminPassword = ConvertTo-PlainText $mysqlAdminSecure

$adminEmailDefault = Read-EnvValue 'ARGUS_ADMIN_EMAIL' 'admin@argus.local'
$adminEmail = Read-Host "E-mail inicial do ARGUS [$adminEmailDefault]"
if (-not $adminEmail) { $adminEmail = $adminEmailDefault }
$adminPassword = $null
do {
  $adminSecure = Read-Host 'Senha inicial da conta ARGUS (mínimo 10 caracteres)' -AsSecureString
  $adminPassword = ConvertTo-PlainText $adminSecure
  $confirmSecure = Read-Host 'Confirme a senha inicial da conta ARGUS' -AsSecureString
  $adminConfirm = ConvertTo-PlainText $confirmSecure
  if ($adminPassword.Length -lt 10 -or $adminPassword -cne $adminConfirm) {
    Write-Host 'As senhas não coincidem ou têm menos de 10 caracteres. Tente novamente.' -ForegroundColor Yellow
    $adminPassword = $null
  }
} while (-not $adminPassword)

$payload = @{
  host = $mysqlHost
  port = $mysqlPort
  database = $database
  adminUser = $mysqlAdmin
  adminPassword = $mysqlAdminPassword
  adminEmail = $adminEmail
  argusAdminPassword = $adminPassword
} | ConvertTo-Json -Compress
$encodedPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload))
$setupOutput = $encodedPayload | & $nodeCommand.Source $setupScript 2>&1
$exitCode = $LASTEXITCODE
$mysqlAdminSecure.Dispose()
$adminSecure.Dispose()
$confirmSecure.Dispose()
$mysqlAdminPassword = $null
$adminPassword = $null
$adminConfirm = $null
$payload = $null
$encodedPayload = $null
if ($exitCode -ne 0) {
  if ($setupOutput) { Write-Host ($setupOutput -join [Environment]::NewLine) -ForegroundColor Yellow }
  throw 'Não consegui preparar o banco. Confira se o MySQL está ativo e se a conta informada pode criar banco e usuários.'
}

Write-Host ''
Write-Host 'Banco compartilhado e schema ARGUS prontos. As credenciais de aplicação foram gravadas em Platform/.env.' -ForegroundColor Green
Write-Host "Conta inicial do ARGUS: $adminEmail"
Write-Host 'A senha da conta ARGUS é a que você acabou de definir.'
