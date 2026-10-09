@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"
where node >nul 2>nul || (echo Node.js 18+ nao encontrado. Instale Node.js LTS e tente novamente.& exit /b 1)
where npm >nul 2>nul || (echo npm nao encontrado no PATH.& exit /b 1)
echo Instalando dependencias da Platform...
call npm install --prefix "%ARGUS_ROOT%\Platform"
if errorlevel 1 exit /b 1
echo Instalando dependencias do Web Backend...
call npm install --prefix "%ARGUS_ROOT%\Web\Backend"
if errorlevel 1 exit /b 1
echo Instalando dependencias do Web Frontend...
call npm install --prefix "%ARGUS_ROOT%\Web\Frontend"
if errorlevel 1 exit /b 1
echo.
echo Todas as dependencias foram instaladas.
echo Configure Platform\.env e inicie o MySQL antes de iniciar os servicos.
exit /b 0