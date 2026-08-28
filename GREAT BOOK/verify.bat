@echo off
REM ===========================================================================
REM  GREAT BOOK - pre-submission check
REM ---------------------------------------------------------------------------
REM  Double-click before you zip and submit.
REM
REM  Proves the mechanical things: no file:// hazards, no broken paths, no
REM  missing credits, no unreplaced placeholders, and reports payload size.
REM
REM  It cannot prove the site FEELS right. Still open index.html by hand from
REM  an extracted copy of the actual zip.
REM ===========================================================================

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\verify.ps1" %*

echo.
pause
