@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo            ARGUS - Platform
echo ==========================================
echo.
echo  1. Iniciar somente a API Platform
echo  2. Parar o servidor da Platform
echo  3. Abrir logs do servidor
echo  4. Voltar ao menu principal
echo.
choice /c 1234 /n /m "Escolha: "
if errorlevel 4 exit /b 0
if errorlevel 3 goto logs
if errorlevel 2 goto stopserver
if errorlevel 1 goto api

:api
where node >nul 2>nul || (echo Node.js nao encontrado. Use Ferramentas no menu principal para preparar a instalacao.& pause & goto menu)
if not exist "%~dp0node_modules\express\package.json" (
  echo Dependencias da Platform nao encontradas. Use Ferramentas no menu principal para preparar a instalacao.
  pause
  goto menu
)
call "%~dp0ARGUS.cmd" /start-server
pause
goto menu

:stopserver
call "%~dp0ARGUS.cmd" /stop-server
pause
goto menu

:logs
set "ARGUS_LOGS=%LOCALAPPDATA%\ARGUS\Logs"
if exist "%ARGUS_LOGS%" (start "ARGUS logs" explorer.exe "%ARGUS_LOGS%") else echo Nenhum log da Platform foi criado ainda.
goto menu
