@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"
where node >nul 2>nul || (echo Node.js nao encontrado. Instale Node.js 20.19+ ou 22.12+ LTS e tente novamente.& exit /b 1)
where npm >nul 2>nul || (echo npm nao encontrado no PATH.& exit /b 1)
node -e "const [a,b]=process.versions.node.split('.').map(Number); if (!((a===20&&b>=19)||(a===22&&b>=12)||a>22)) process.exit(1)"
if errorlevel 1 (echo Versao incompativel: o frontend precisa de Node.js 20.19+ ou 22.12+ LTS.& exit /b 1)
echo Instalando dependencias da Platform...
call npm install --prefix "%ARGUS_ROOT%\Platform"
if errorlevel 1 goto platform_error
echo Instalando dependencias do Web Backend...
call npm install --prefix "%ARGUS_ROOT%\Web\Backend"
if errorlevel 1 goto backend_error
echo Instalando dependencias do Web Frontend...
call npm install --prefix "%ARGUS_ROOT%\Web\Frontend"
if errorlevel 1 goto frontend_error
echo.
echo Todas as dependencias foram instaladas.
echo Configure Platform\.env e inicie o MySQL antes de iniciar os servicos.
exit /b 0

:platform_error
echo Falha ao instalar as dependencias da Platform.
exit /b 1
:backend_error
echo Falha ao instalar as dependencias do Web Backend.
exit /b 1
:frontend_error
echo Falha ao instalar as dependencias do Web Frontend.
exit /b 1
