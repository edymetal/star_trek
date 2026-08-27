@echo off
setlocal EnableExtensions

title Comando Estelar - Servidor local
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERRO: Node.js nao foi encontrado.
  echo Instale o Node.js 22.12 ou superior e tente novamente.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERRO: npm nao foi encontrado.
  echo Reinstale o Node.js com o npm e tente novamente.
  echo.
  pause
  exit /b 1
)

for /f "usebackq delims=" %%V in (`node -p "process.versions.node"`) do set "NODE_VERSION=%%V"
node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1)"
if errorlevel 1 (
  echo.
  echo ERRO: Node.js %NODE_VERSION% nao e compativel.
  echo Instale o Node.js 22.12 ou superior e tente novamente.
  echo.
  pause
  exit /b 1
)

if not exist "package-lock.json" (
  echo.
  echo ERRO: package-lock.json nao foi encontrado.
  echo Restaure os arquivos do jogo antes de tentar novamente.
  echo.
  pause
  exit /b 1
)

set "LOCK_HASH="
for /f "delims=" %%H in ('node -e "const fs=require('node:fs');const crypto=require('node:crypto');process.stdout.write(crypto.createHash('sha256').update(fs.readFileSync('package-lock.json')).digest('hex'))"') do set "LOCK_HASH=%%H"
if not defined LOCK_HASH (
  echo.
  echo ERRO: nao foi possivel validar o package-lock.json.
  echo.
  pause
  exit /b 1
)

set "DEPENDENCIES_CURRENT=0"
set "INSTALLED_LOCK_HASH="
if exist "node_modules\vite\bin\vite.js" if exist "node_modules\.package-lock.sha256" set /p "INSTALLED_LOCK_HASH=" < "node_modules\.package-lock.sha256"
if /I "%INSTALLED_LOCK_HASH%"=="%LOCK_HASH%" set "DEPENDENCIES_CURRENT=1"

if "%DEPENDENCIES_CURRENT%"=="1" goto dependencies_ready

echo.
echo Sincronizando as dependencias verificadas do jogo...
call npm ci
if not errorlevel 1 goto dependencies_synced

echo.
echo ERRO: nao foi possivel instalar as dependencias.
echo Verifique a conexao com a internet e as mensagens acima.
echo.
pause
exit /b 1

:dependencies_synced
for /f "delims=" %%S in ('node -e "const fs=require('node:fs');const crypto=require('node:crypto');process.stdout.write(crypto.createHash('sha256').update(fs.readFileSync('package-lock.json')).digest('hex'))"') do >"node_modules\.package-lock.sha256" echo %%S

:dependencies_ready

echo.
echo Iniciando o Comando Estelar...
echo O navegador sera aberto automaticamente.
echo Para encerrar o jogo, volte a esta janela e pressione Ctrl+C.
echo.

call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort --open

if errorlevel 1 (
  echo.
  echo ERRO: o servidor nao conseguiu iniciar.
  echo Talvez a porta 5173 ja esteja sendo usada por outro programa.
  echo.
  pause
  exit /b 1
)

endlocal
