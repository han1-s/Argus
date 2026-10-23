@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"
cd /d "%ARGUS_ROOT%"

echo ==========================================
echo       Instalar ou atualizar o ARGUS
echo ==========================================
echo.

where node.exe >nul 2>nul
if errorlevel 1 goto install_node
goto check_node

:install_node
where winget.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale Node.js LTS em https://nodejs.org/ e abra ARGUS.cmd novamente.
  exit /b 1
)
echo Instalando Node.js LTS...
call winget install --id OpenJS.NodeJS.LTS --exact --silent --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo Nao foi possivel instalar Node.js usando winget.
  exit /b 1
)
set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
where node.exe >nul 2>nul || (echo Node.js instalado; reabra ARGUS.cmd para atualizar o PATH.& exit /b 1)

:check_node
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm nao foi encontrado. Reinstale Node.js LTS e tente novamente.
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number); if (!((a===20&&b>=19)||(a===22&&b>=12)||a>22)) process.exit(1)"
if errorlevel 1 (
  echo Use Node.js 20.19+ ou 22.12+ LTS.
  exit /b 1
)

echo Parando somente as APIs locais antes da atualizacao...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\stop-web.ps1" >nul 2>nul
call "%ARGUS_ROOT%\Platform\ARGUS.cmd" /stop-server >nul 2>nul

echo Instalando Platform...
call npm ci --prefix "%ARGUS_ROOT%\Platform"
if errorlevel 1 goto install_error
echo Instalando Web Backend...
call npm ci --prefix "%ARGUS_ROOT%\Web\Backend"
if errorlevel 1 goto install_error
echo Instalando Web Frontend...
call npm ci --prefix "%ARGUS_ROOT%\Web\Frontend"
if errorlevel 1 goto install_error

echo.
echo Preparando o banco compartilhado e a conta inicial do ARGUS...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\setup-database.ps1"
if errorlevel 1 goto database_error

echo.
echo ARGUS pronto. Inicie Web + Platform pelo menu principal.
exit /b 0

:install_error
echo A instalacao de dependencias falhou. Verifique a conexao e tente novamente.
exit /b 1

:database_error
echo A configuracao do banco nao terminou. O arquivo local Platform\.env foi preservado.
exit /b 1
