@echo off
setlocal
for %%I in ("%~dp0..") do set "ARGUS_ROOT=%%~fI"

:menu
cls
echo ==========================================
echo             ARGUS - Menu Web
echo ==========================================
echo.
echo  1. Iniciar Web Backend
echo  2. Iniciar Web Frontend
echo  3. Iniciar Backend e Frontend
echo  4. Abrir pagina de login
echo  5. Voltar
echo.
choice /c 12345 /n /m "Escolha uma opcao: "
if errorlevel 5 exit /b 0
if errorlevel 4 goto browser
if errorlevel 3 goto both
if errorlevel 2 goto frontend
if errorlevel 1 goto backend

:browser
start "ARGUS Web" http://127.0.0.1:5173/login
goto menu
:both
call :start-backend
call :start-frontend
goto menu
:frontend
call :start-frontend
goto menu
:backend
call :start-backend
goto menu

:start-backend
start "ARGUS Web Backend" /D "%ARGUS_ROOT%\Web\Backend" cmd /k "npm start"
exit /b

:start-frontend
start "ARGUS Web Frontend" /D "%ARGUS_ROOT%\Web\Frontend" cmd /k "npm run dev -- --host 127.0.0.1"
exit /b