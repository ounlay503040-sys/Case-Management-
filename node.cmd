@echo off
setlocal
set ELECTRON_RUN_AS_NODE=1
set ELECTRON_NO_ASAR=1
"%~dp0node_modules\electron\dist\electron.exe" %*
