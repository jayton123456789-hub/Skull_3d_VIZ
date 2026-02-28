@echo off
setlocal

set PORT=8080
set URL=http://localhost:%PORT%/examples/basic-webgl.html

echo -------------------------------------------
echo Dull Skull Avatar Demo
 echo Serving repo at http://localhost:%PORT%
echo Opening: %URL%
echo -------------------------------------------

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "%URL%"
  python -m http.server %PORT%
  goto :eof
)

echo Python was not found.
echo Install Python 3 and re-run this file.
pause
