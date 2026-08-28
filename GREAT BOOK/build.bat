@echo off
REM ===========================================================================
REM  GREAT BOOK - rebuild the story pages
REM ---------------------------------------------------------------------------
REM  Double-click this file after editing stories.js.
REM
REM  It regenerates story-01.html ... story-NN.html from stories.js plus
REM  tools\templates\story.html, and stamps the shared footer into every page.
REM
REM  -ExecutionPolicy Bypass applies to THIS invocation only. It does not
REM  change any system setting, and nothing is installed.
REM ===========================================================================

cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools\build-pages.ps1" %*

echo.
pause
