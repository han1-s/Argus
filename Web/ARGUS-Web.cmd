@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"

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
powershell.exe -NoProfile -Command "$busy=@(); foreach($port in @(3001,5173)){$client=[Net.Sockets.TcpClient]::new();try{$client.Connect('127.0.0.1',$port);$busy+=$port}catch{}finally{$client.Dispose()}}; if($busy.Count){Write-Output ('Portas ja ocupadas: '+($busy -join ', '));exit 1}"
if errorlevel 1 (
  echo Feche as janelas de servico ARGUS ja abertas e tente novamente.
  pause
  exit /b 1
)

echo Iniciando o backend e o frontend do Web...
start "ARGUS Web Backend" /D "%ARGUS_ROOT%\Web\Backend" cmd /k "npm start"
start "ARGUS Web Frontend" /D "%ARGUS_ROOT%\Web\Frontend" cmd /k "npm run dev -- --host 127.0.0.1 --strictPort"
timeout /t 5 /nobreak >nul
start "ARGUS Web" http://127.0.0.1:5173/login
echo.
echo Web iniciado. Esta janela pode ser fechada; mantenha as duas janelas de servico abertas.
echo Para parar o Web, feche as janelas ARGUS Web Backend e ARGUS Web Frontend.
pause
