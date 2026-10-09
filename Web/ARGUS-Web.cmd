@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"
if /i "%~1"=="/manage" goto menu

where node >nul 2>nul || (echo Node.js nao encontrado. Instale Node.js 20.19+ ou 22.12+ LTS e tente novamente.& pause & exit /b 1)
where npm >nul 2>nul || (echo npm nao encontrado no PATH.& pause & exit /b 1)
node -e "const [a,b]=process.versions.node.split('.').map(Number); if (!((a===20&&b>=19)||(a===22&&b>=12)||a>22)) process.exit(1)"
if errorlevel 1 (
  echo Versao incompativel: o frontend precisa de Node.js 20.19+ ou 22.12+ LTS.
  pause
  exit /b 1
)
if not exist "%ARGUS_ROOT%\Web\Backend\node_modules\express\package.json" (
  echo Dependencias do Web nao encontradas. Execute a opcao de instalar dependencias no ARGUS.cmd.
  pause
  exit /b 1
)
if not exist "%ARGUS_ROOT%\Web\Frontend\node_modules\vite\package.json" (
  echo Dependencias do Web nao encontradas. Execute a opcao de instalar dependencias no ARGUS.cmd.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\start-web.ps1"
if errorlevel 2 goto alreadyrunning
if errorlevel 1 (
  pause
  exit /b 1
)
exit /b 0

:menu
echo.
echo Gerenciar ARGUS Web (os servicos ficam em segundo plano).
echo 1. Parar Web
echo 2. Abrir logs
echo 3. Voltar ao menu principal (mantendo Web ligado)
choice /c 123 /n /m "Escolha: "
if errorlevel 3 exit /b 0
if errorlevel 2 goto logs
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%ARGUS_ROOT%\scripts\stop-web.ps1"
pause
exit /b 0

:alreadyrunning
echo ARGUS Web ja esta rodando. Use a opcao 3 do menu principal para gerencia-lo.
exit /b 0

:logs
set "ARGUS_LOGS=%LOCALAPPDATA%\ARGUS\Logs"
for %%L in (web-Web-Backend.out.log web-Web-Backend.err.log web-Web-Frontend.out.log web-Web-Frontend.err.log) do if exist "%ARGUS_LOGS%\%%L" start "ARGUS logs - %%L" notepad.exe "%ARGUS_LOGS%\%%L"
goto menu
