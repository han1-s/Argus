@echo off
setlocal
cd /d "%~dp0"

:menu
cls
echo ==========================================
echo              ARGUS - Inicial
echo ==========================================
echo.
echo  1. Iniciar / controlar o Web
echo  2. Abrir o menu da Platform
echo  3. Ferramentas (dependencias, testes e README)
echo  4. Encerrar ARGUS nesta maquina
echo  5. Sair
echo.
choice /c 12345 /n /m "Escolha: "
if errorlevel 5 exit /b 0
if errorlevel 4 goto shutdown
if errorlevel 3 goto tools
if errorlevel 2 goto platform
if errorlevel 1 goto web

:web
call "%~dp0Web\ARGUS-Web.cmd"
goto menu

:platform
call "%~dp0Platform\ARGUS-Platform.cmd"
goto menu

:tools
cls
echo ==========================================
echo             ARGUS - Ferramentas
echo ==========================================
echo.
echo  1. Instalar dependencias
echo  2. Executar verificacoes e testes
echo  3. Abrir README
echo  4. Voltar
echo.
choice /c 1234 /n /m "Escolha: "
if errorlevel 4 goto menu
if errorlevel 3 goto docs
if errorlevel 2 goto tests
if errorlevel 1 goto dependencies

:dependencies
call "%~dp0scripts\install-dependencies.cmd"
pause
goto tools

:tests
call "%~dp0scripts\test-all.cmd"
pause
goto tools

:docs
start "ARGUS README" notepad.exe "%~dp0README.md"
goto tools

:shutdown
echo.
echo Encerrando os servicos locais do ARGUS...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop-web.ps1"
call "%~dp0Platform\ARGUS.cmd" /stop
echo O MySQL permanece ativo.
pause
goto menu
