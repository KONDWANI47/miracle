@echo off
echo Starting MIRACLE ECD Website Server...
echo.
echo Website will be available at: http://localhost:8000
echo Admin panel: http://localhost:8000/admin.html
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 8000
pause 