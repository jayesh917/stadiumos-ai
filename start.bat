@echo off
title StadiumOS AI Startup Manager
echo ====================================================
echo             STADIUMOS AI COMMAND CENTER
echo ====================================================
echo.

:: Detect if database exists, auto-seed if empty
if not exist "backend\stadiumos.db" (
    echo [System] Database not detected. Initializing database schema...
    cd backend
    python seed_db.py
    cd ..
    echo.
)

echo [System] Launching FastAPI backend telemetry on port 8000...
start cmd /k "title StadiumOS Backend && cd backend && python -m uvicorn app.main:app --reload --port 8000"

echo [System] Launching Vite React client on port 5173...
start cmd /k "title StadiumOS Frontend && cd frontend && npm run dev"

echo.
echo ====================================================
echo [Success] StadiumOS AI processes initialized!
echo - Backend API: http://127.0.0.1:8000
echo - Command Center UI: http://localhost:5173
echo ====================================================
pause
