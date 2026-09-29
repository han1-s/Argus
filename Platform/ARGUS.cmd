@echo off
setlocal
cd /d "%~dp0"
set "ARGUS_CONTROL="
if exist "%~dp0scripts\argus-control.ps1" set "ARGUS_CONTROL=%~dp0scripts\argus-control.ps1"
if not defined ARGUS_CONTROL if exist "%~dp0argus-control.ps1" set "ARGUS_CONTROL=%~dp0argus-control.ps1"
if not defined ARGUS_CONTROL (
  echo Nao encontrei argus-control.ps1. Deixe o arquivo na mesma pasta deste CMD.
  pause
  exit /b 1
)
if /i "%~1"=="/stop" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%" -StopAll
  exit /b
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_CONTROL%"
if errorlevel 1 (
  echo O controlador do ARGUS terminou com erro.
  pause
)
