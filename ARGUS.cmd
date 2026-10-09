@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo          ARGUS - Central do projeto
echo ==========================================
echo.
echo  1. Instalar dependencias de Web e Platform
echo  2. Abrir menu Web
echo  3. Abrir menu Platform
echo  4. Abrir documentacao de instalacao
echo  5. Sair
echo.
choice /c 12345 /n /m "Escolha uma opcao: "
if errorlevel 5 exit /b 0
if errorlevel 4 goto docs
if errorlevel 3 goto platform
if errorlevel 2 goto web
if errorlevel 1 goto dependencies

:docs
start "ARGUS README" notepad.exe "%~dp0README.md"
goto menu
:platform
start "ARGUS Platform" cmd /k call "%~dp0Platform\ARGUS-Platform.cmd"
goto menu
:web
start "ARGUS Web" cmd /k call "%~dp0Web\ARGUS-Web.cmd"
goto menu
:dependencies
call "%~dp0scripts\install-dependencies.cmd"
pause
goto menu