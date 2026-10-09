@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"
where node >nul 2>nul
if errorlevel 1 goto install_node
goto check_node

:install_node
where winget >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado e o winget nao esta disponivel.
  echo Instale Node.js LTS em https://nodejs.org/ e abra o ARGUS.cmd novamente.
  exit /b 1
)
echo Node.js nao encontrado. Vou instalar a versao LTS usando o winget do Windows.
call winget install --id OpenJS.NodeJS.LTS --exact --silent --accept-package-agreements --accept-source-agreements
if errorlevel 1 (
  echo Nao foi possivel instalar Node.js pelo winget.
  echo Instale Node.js LTS em https://nodejs.org/ e tente novamente.
  exit /b 1
)
set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%PATH%"
where node >nul 2>nul || (echo Node.js foi instalado, mas nao foi encontrado. Feche e reabra ARGUS.cmd.& exit /b 1)

:check_node
where npm >nul 2>nul
if errorlevel 1 (
  echo npm nao encontrado. Reinstale Node.js LTS em https://nodejs.org/ e tente novamente.
  exit /b 1
)
node -e "const [a,b]=process.versions.node.split('.').map(Number); if (!((a===20&&b>=19)||(a===22&&b>=12)||a>22)) process.exit(1)"
if errorlevel 1 (
  echo Versao incompativel: use Node.js 20.19+ ou 22.12+ LTS.
  echo Baixe em https://nodejs.org/ e abra um novo ARGUS.cmd depois da instalacao.
  exit /b 1
)
echo Instalando dependencias da Platform...
call npm install --prefix "%ARGUS_ROOT%\Platform"
if errorlevel 1 goto platform_error
echo Instalando dependencias do Web Backend...
call npm install --prefix "%ARGUS_ROOT%\Web\Backend"
if errorlevel 1 goto backend_error
echo Instalando dependencias do Web Frontend...
call npm install --prefix "%ARGUS_ROOT%\Web\Frontend"
if errorlevel 1 goto frontend_error
set "ARGUS_ENV=%ARGUS_ROOT%\Platform\.env"
if not exist "%ARGUS_ENV%" (
  copy "%ARGUS_ROOT%\Platform\.env.example" "%ARGUS_ENV%" >nul
  if errorlevel 1 (echo Nao foi possivel criar Platform\.env.& exit /b 1)
  echo.
  echo Criei Platform\.env usando o modelo do projeto.
)
findstr /r /c:"^[ ]*MYSQL_PASSWORD=change-this-password$" "%ARGUS_ENV%" >nul
if not errorlevel 1 (
  echo Informe o usuario e a senha MySQL. Crie antes a base argus e o usuario argus_app conforme o README.
  start /wait "ARGUS - Configurar MySQL" notepad.exe "%ARGUS_ENV%"
) else (
  echo Platform\.env ja esta configurado; mantive suas credenciais locais.
)
echo.
echo Todas as dependencias foram instaladas.
echo Antes de iniciar o ARGUS, confira Platform\.env e inicie o servico MySQL.
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
