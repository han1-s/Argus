@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo              ARGUS - Inicial
echo ==========================================
echo.
echo  1. Iniciar ARGUS Web (volta a este menu ao iniciar)
echo  2. Abrir menu da Platform
echo  3. Gerenciar ou parar o Web
echo  4. Instalar todas as dependencias
echo  5. Executar testes e auditoria
echo  6. Abrir README
echo  7. Encerrar ARGUS nesta maquina (Web, Platform e agente local)
echo  8. Sair
echo.
choice /c 12345678 /n /m "Escolha: "
if errorlevel 8 exit /b 0
if errorlevel 7 goto shutdown
if errorlevel 6 goto docs
if errorlevel 5 goto tests
if errorlevel 4 goto dependencies
if errorlevel 3 goto manageweb
if errorlevel 2 goto platform
if errorlevel 1 goto web

:docs
start "ARGUS README" notepad.exe "%~dp0README.md"
goto menu
:dependencies
call "%~dp0scripts\install-dependencies.cmd"
pause
goto menu
:tests
call "%~dp0scripts\test-all.cmd"
pause
goto menu
:platform
call "%~dp0Platform\ARGUS-Platform.cmd"
goto menu
:web
call "%~dp0Web\ARGUS-Web.cmd"
goto menu
:manageweb
call "%~dp0Web\ARGUS-Web.cmd" /manage
goto menu
:shutdown
echo.
echo Encerrando servicos locais do ARGUS...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-web.ps1"
call "%~dp0Platform\ARGUS.cmd" /stop
echo.
echo ARGUS encerrado nesta maquina. O servico MySQL permanece ativo.
pause
goto menu
