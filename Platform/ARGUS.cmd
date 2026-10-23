@echo off
setlocal EnableExtensions
cd /d "%~dp0"
set "ARGUS_CONTROL=%~dp0scripts\argus-control.ps1"
if not exist "%ARGUS_CONTROL%" (
  echo Controlador ARGUS ausente: %ARGUS_CONTROL%
  exit /b 1
)

if /i "%~1"=="/stop" goto stop_all
if /i "%~1"=="/stop-server" goto stop_server
if /i "%~1"=="/start-server" goto start_server
if /i "%~1"=="/start-server-no-browser" goto start_server_silent

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%"
exit /b %ERRORLEVEL%

:stop_all
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%" -StopAll
exit /b %ERRORLEVEL%

:stop_server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%" -StopServerOnly
exit /b %ERRORLEVEL%

:start_server
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%" -StartServerOnly
exit /b %ERRORLEVEL%

:start_server_silent
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%" -StartServerOnly -NoBrowser
exit /b %ERRORLEVEL%
