@echo off
title ABC Company Invoice Management System
color 0A
echo ============================================
echo   ABC Company Invoice Management System
echo ============================================
echo.
echo Starting Backend Server...
start "ABC Invoice Backend" cmd /k "cd /d C:\Users\MR\Desktop\invoice\backend && node server.js"
echo.
echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul
echo.
echo Starting Frontend Server...
start "ABC Invoice Frontend" cmd /k "cd /d C:\Users\MR\Desktop\invoice\frontend && npm run dev"
echo.
echo ============================================
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo ============================================
timeout /t 8 /nobreak > nul
start http://localhost:5173
pause
