@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo              ARGUS - Inicial
echo ==========================================
echo.
echo  1. Iniciar ARGUS Web (frontend + backend)
echo  2. Abrir menu da Platform
echo  3. Instalar todas as dependencias
echo  4. Abrir README
echo  5. Sair
echo.
choice /c 12345 /n /m "Escolha: "
if errorlevel 5 exit /b 0
if errorlevel 4 goto docs
if errorlevel 3 goto dependencies
if errorlevel 2 goto platform
if errorlevel 1 goto web

:docs
start "ARGUS README" notepad.exe "%~dp0README.md"
goto menu
:dependencies
call "%~dp0scripts\install-dependencies.cmd"
pause
goto menu
:platform
start "ARGUS Platform" cmd /k call "%~dp0Platform\ARGUS-Platform.cmd"
goto menu
:web
start "ARGUS Web" cmd /k call "%~dp0Web\ARGUS-Web.cmd"
goto menu
