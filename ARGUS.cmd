@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if /i "%~1"=="/install" goto install
if /i "%~1"=="/start" goto startall
if /i "%~1"=="/platform" goto platform
if /i "%~1"=="/web" goto web
if /i "%~1"=="/agent" goto agent
if /i "%~1"=="/stop" goto stopall
if /i "%~1"=="/logs" goto logs

:menu
cls
echo ==========================================
echo                 ARGUS
echo ==========================================
echo.
echo  1. Instalar ou atualizar
echo  2. Iniciar Web + Platform
echo  3. Iniciar somente Web
echo  4. Abrir controles da Platform e agentes
echo  5. Parar servicos locais
echo  6. Abrir logs
echo  7. Abrir guia do ARGUS
echo  8. Sair
echo.
choice /c 12345678 /n /m "Escolha: "
if errorlevel 8 exit /b 0
if errorlevel 7 goto docs
if errorlevel 6 goto logs
if errorlevel 5 goto stopall
if errorlevel 4 goto platform
if errorlevel 3 goto web
if errorlevel 2 goto startall
if errorlevel 1 goto install

:install
call "%~dp0scripts\install-dependencies.cmd"
set "ARGUS_RESULT=%ERRORLEVEL%"
if not "%ARGUS_RESULT%"=="0" pause
if /i "%~1"=="/install" exit /b %ARGUS_RESULT%
goto menu

:startall
echo Iniciando a API Platform...
call "%~dp0Platform\ARGUS.cmd" /start-server-no-browser
if errorlevel 1 goto start_error
echo Iniciando Web...
call "%~dp0Web\ARGUS-Web.cmd" /start-no-browser
if errorlevel 1 goto start_error
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\open-edge.ps1" -Url "http://127.0.0.1:5173/login"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\open-edge.ps1" -Url "http://127.0.0.1:3000"
if /i "%~1"=="/start" exit /b 0
goto menu

:start_error
echo O ARGUS nao iniciou completamente. Abra os logs para ver os detalhes.
if /i "%~1"=="/start" exit /b 1
pause
goto menu

:platform
call "%~dp0Platform\ARGUS-Platform.cmd"
if /i "%~1"=="/platform" exit /b %ERRORLEVEL%
goto menu

:web
if /i "%~1"=="/web" goto web_start
call "%~dp0Web\ARGUS-Web.cmd"
goto menu

:web_start
call "%~dp0Web\ARGUS-Web.cmd" /start
exit /b %ERRORLEVEL%

:agent
set "ARGUS_AGENT_ONLY=1"
call "%~dp0Platform\ARGUS.cmd"
if /i "%~1"=="/agent" exit /b %ERRORLEVEL%
set "ARGUS_AGENT_ONLY="
goto menu

:stopall
echo Encerrando Web, API Platform e agente deste computador...
set "ARGUS_RESULT=0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-web.ps1"
if errorlevel 1 set "ARGUS_RESULT=1"
call "%~dp0Platform\ARGUS.cmd" /stop
if errorlevel 1 set "ARGUS_RESULT=1"
echo O servico MySQL permanece ativo.
if /i "%~1"=="/stop" exit /b %ARGUS_RESULT%
pause
goto menu

:logs
set "ARGUS_LOGS=%LOCALAPPDATA%\ARGUS\Logs"
if exist "%ARGUS_LOGS%" (start "ARGUS logs" explorer.exe "%ARGUS_LOGS%") else echo Ainda nao ha logs do ARGUS.
if /i "%~1"=="/logs" exit /b 0
goto menu

:docs
start "ARGUS guia" notepad.exe "%~dp0README.md"
goto menu
