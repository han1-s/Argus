@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"
pushd "%ARGUS_ROOT%"

where node >nul 2>nul || (echo Node.js nao encontrado no PATH.& goto failed)
where npm >nul 2>nul || (echo npm nao encontrado no PATH.& goto failed)

echo [1/7] Smoke test da Platform...
call npm --prefix "%ARGUS_ROOT%\Platform" test
if errorlevel 1 goto failed

echo.
echo [2/7] Testes do Web Backend...
call npm --prefix "%ARGUS_ROOT%\Web\Backend" test
if errorlevel 1 goto failed

echo.
echo [3/7] Lint do Web Frontend...
call npm --prefix "%ARGUS_ROOT%\Web\Frontend" run lint
if errorlevel 1 goto failed

echo.
echo [4/7] Build do Web Frontend...
call npm --prefix "%ARGUS_ROOT%\Web\Frontend" run build
if errorlevel 1 goto failed

echo.
echo [5/7] Audit de dependencias da Platform...
call npm audit --prefix "%ARGUS_ROOT%\Platform" --audit-level=high
if errorlevel 1 goto failed

echo.
echo [6/7] Audit de dependencias do Web Backend...
call npm audit --prefix "%ARGUS_ROOT%\Web\Backend" --audit-level=high
if errorlevel 1 goto failed

echo.
echo [7/7] Audit de dependencias do Web Frontend...
call npm audit --prefix "%ARGUS_ROOT%\Web\Frontend" --audit-level=high
if errorlevel 1 goto failed

popd
echo.
echo Todas as verificacoes passaram.
if not "%ARGUS_RUN_MYSQL_INTEGRATION_TESTS%"=="1" echo A integracao MySQL foi pulada. Defina ARGUS_RUN_MYSQL_INTEGRATION_TESTS=1 para inclui-la; a API Web e o MySQL precisam estar ativos.
exit /b 0

:failed
popd
echo.
echo Uma verificacao falhou. Leia a saida acima, corrija o problema e execute novamente.
exit /b 1
