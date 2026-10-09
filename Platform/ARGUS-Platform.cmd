@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo          ARGUS - Menu Platform
echo ==========================================
echo.
echo  1. Abrir menu existente de servidor/agente
echo  2. Iniciar API Platform em uma nova janela
echo  3. Preparar dependencias e configuracao
echo  4. Voltar
echo.
choice /c 1234 /n /m "Escolha uma opcao: "
if errorlevel 4 exit /b 0
if errorlevel 3 goto dependencies
if errorlevel 2 goto server
if errorlevel 1 goto control

:dependencies
call npm install
pause
goto menu
:server
start "ARGUS Platform API" /D "%~dp0" cmd /k "npm start"
goto menu
:control
call "%~dp0ARGUS.cmd"
goto menu