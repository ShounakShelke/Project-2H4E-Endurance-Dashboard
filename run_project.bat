@echo off
setlocal

set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend"
set "BACKEND=%ROOT%backend"

echo.
echo ============================================================
echo  Project 2H4E Endurance Dashboard
echo  Starting backend and frontend
echo ============================================================
echo.

if not exist "%FRONTEND%\package.json" (
  echo [ERROR] frontend\package.json was not found.
  echo Expected frontend app at: %FRONTEND%
  pause
  exit /b 1
)

if not exist "%BACKEND%\main.py" (
  echo [ERROR] backend\main.py was not found.
  echo Expected backend app at: %BACKEND%
  pause
  exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
  echo [WARN] frontend\node_modules is missing.
  echo Run this once:
  echo   cd frontend
  echo   npm install
  echo.
)

python -c "import fastapi, uvicorn, websockets" >nul 2>nul
if errorlevel 1 (
  echo [WARN] Python backend packages may be missing.
  echo Run this once:
  echo   cd backend
  echo   pip install -r requirements.txt
  echo.
)

echo [1/3] Starting FastAPI backend at http://127.0.0.1:8000
start "Project 2H4E Backend" cmd /k "cd /d ""%BACKEND%"" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting React frontend at http://127.0.0.1:5173
start "Project 2H4E Frontend" cmd /k "cd /d ""%FRONTEND%"" && npm run dev -- --host 127.0.0.1"

echo [3/3] Opening browser shortly...
timeout /t 6 /nobreak >nul
start "" "http://127.0.0.1:5173/"

echo.
echo Project 2H4E is launching.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:5173
echo.
endlocal
