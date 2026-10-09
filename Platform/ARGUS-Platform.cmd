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
echo  3. Parar o servidor da Platform
echo  4. Abrir logs do servidor
echo  5. Voltar ao menu principal
echo.
choice /c 12345 /n /m "Escolha: "
if errorlevel 5 exit /b 0
if errorlevel 4 goto logs
if errorlevel 3 goto stopserver
if errorlevel 2 goto api
if errorlevel 1 goto control

:api
where node >nul 2>nul || (echo Node.js nao encontrado. Execute a preparacao pelo painel de controle.& pause & goto menu)
if not exist "%~dp0node_modules\express\package.json" (
  echo Dependencias da Platform nao encontradas. Escolha Preparar servidor no painel de controle.
  pause
  goto menu
)
call "%~dp0ARGUS.cmd" /start-server
pause
goto menu

:control
call "%~dp0ARGUS.cmd"
goto menu

:stopserver
call "%~dp0ARGUS.cmd" /stop-server
pause
goto menu

:logs
set "ARGUS_LOGS=%LOCALAPPDATA%\ARGUS\Logs"
if exist "%ARGUS_LOGS%" (start "ARGUS logs" explorer.exe "%ARGUS_LOGS%") else echo Nenhum log da Platform foi criado ainda.
goto menu
