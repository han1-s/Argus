@echo off
setlocal EnableExtensions
cd /d "%~dp0"
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"

if /i "%~1"=="/start" goto start_server
if /i "%~1"=="/stop" goto stop_server
if /i "%~1"=="/agent" goto agent
if /i "%~1"=="/logs" goto logs

:menu
cls
echo ==========================================
echo              ARGUS - Platform
echo ==========================================
echo.
echo  1. Iniciar API Platform e painel
echo  2. Parar API Platform
echo  3. Controlar agente deste computador
echo  4. Abrir logs
echo  5. Instalacao e controles avancados
echo  6. Voltar ao menu principal
echo.
choice /c 123456 /n /m "Escolha: "
if errorlevel 6 exit /b 0
if errorlevel 5 goto advanced
if errorlevel 4 goto logs
if errorlevel 3 goto agent
if errorlevel 2 goto stop_server
if errorlevel 1 goto start_server

:start_server
call "%~dp0ARGUS.cmd" /start-server
if /i "%~1"=="/start" exit /b %ERRORLEVEL%
pause
goto menu

:stop_server
call "%~dp0ARGUS.cmd" /stop-server
if /i "%~1"=="/stop" exit /b %ERRORLEVEL%
pause
goto menu

:agent
set "ARGUS_AGENT_ONLY=1"
call "%~dp0ARGUS.cmd"
if /i "%~1"=="/agent" exit /b %ERRORLEVEL%
set "ARGUS_AGENT_ONLY="
goto menu

:advanced
call "%~dp0ARGUS.cmd"
goto menu

:logs
set "ARGUS_LOGS=%LOCALAPPDATA%\ARGUS\Logs"
if exist "%ARGUS_LOGS%" (start "ARGUS logs" explorer.exe "%ARGUS_LOGS%") else echo Ainda nao ha logs da Platform.
if /i "%~1"=="/logs" exit /b 0
goto menu
