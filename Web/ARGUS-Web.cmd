@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"

if /i "%~1"=="/start" goto start_browser
if /i "%~1"=="/start-no-browser" goto start_silent
if /i "%~1"=="/stop" goto stop_web
if /i "%~1"=="/status" goto status
if /i "%~1"=="/logs" goto logs

:menu
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\test-web-running.ps1"
if errorlevel 1 goto stopped_menu
goto running_menu

:stopped_menu
cls
echo ==========================================
echo             ARGUS - Web
echo ==========================================
echo.
echo Web esta parado.
echo  1. Iniciar Web e abrir o navegador
echo  2. Abrir logs
echo  3. Voltar
echo.
choice /c 123 /n /m "Escolha: "
if errorlevel 3 exit /b 0
if errorlevel 2 goto logs
goto start_browser

:running_menu
cls
echo ==========================================
echo             ARGUS - Web
echo ==========================================
echo.
echo Web esta rodando em segundo plano.
echo  1. Parar Web
echo  2. Abrir logs
echo  3. Voltar mantendo Web ligado
echo.
choice /c 123 /n /m "Escolha: "
if errorlevel 3 exit /b 0
if errorlevel 2 goto logs
goto stop_web

:start_browser
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\start-web.ps1"
if errorlevel 2 exit /b 0
if errorlevel 1 (
  echo O Web nao iniciou. Use Instalar ou atualizar e confira os logs.
  pause
  exit /b 1
)
exit /b 0

:start_silent
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\start-web.ps1" -NoBrowser
if errorlevel 2 exit /b 0
if errorlevel 1 exit /b 1
exit /b 0

:stop_web
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\stop-web.ps1"
if /i "%~1"=="/stop" exit /b %ERRORLEVEL%
goto menu

:status
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\test-web-running.ps1"
exit /b %ERRORLEVEL%

:logs
set "ARGUS_LOGS=%LOCALAPPDATA%\ARGUS\Logs"
if exist "%ARGUS_LOGS%" (start "ARGUS logs" explorer.exe "%ARGUS_LOGS%") else echo Ainda nao ha logs do ARGUS.
if /i "%~1"=="/logs" exit /b 0
goto menu
