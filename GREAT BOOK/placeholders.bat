@echo off
REM ===========================================================================
REM  GREAT BOOK - generate placeholder illustrations
REM ---------------------------------------------------------------------------
REM  Double-click to create a 4:5 placeholder for any story whose illustration
REM  file does not exist yet. Real artwork is never overwritten.
REM
REM  You only need this while waiting on the illustrators. Once every real
REM  image is in assets\img\ this script has nothing left to do.
REM ===========================================================================

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\make-placeholders.ps1" %*

echo.
pause
