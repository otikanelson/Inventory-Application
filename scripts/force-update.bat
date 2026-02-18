@echo off
echo Clearing all caches...

REM Clear Metro bundler cache
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .expo rmdir /s /q .expo

REM Clear npm cache
call npm cache clean --force

echo.
echo Verifying environment variables...
call node scripts\verify-build-url.js

echo.
echo Publishing update to preview branch...
call eas update --branch preview --clear-cache

echo.
echo Done! Open your app and pull down to refresh.
