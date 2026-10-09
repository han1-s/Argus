@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo            ARGUS - Platform
echo ==========================================
echo.
echo  1. Abrir painel de controle (servidor e agentes)
echo  2. Iniciar somente a API Platform
echo  3. Fechar este menu
echo.
choice /c 123 /n /m "Escolha: "
if errorlevel 3 exit /b 0
if errorlevel 2 goto api
if errorlevel 1 goto control

:api
where node >nul 2>nul || (echo Node.js 18+ nao encontrado. Instale o Node.js LTS e tente novamente.& pause & goto menu)
where npm >nul 2>nul || (echo npm nao encontrado no PATH.& pause & goto menu)
if not exist "%~dp0node_modules\express\package.json" (
  echo Dependencias da Platform nao encontradas. Execute a instalacao pelo ARGUS.cmd.
  pause
  goto menu
)
start "ARGUS Platform API" /D "%~dp0" cmd /k "npm start"
goto menu
:control
call "%~dp0ARGUS.cmd"
goto menu
