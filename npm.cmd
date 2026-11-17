@echo off
if "%1"=="--version" (
    echo 10.0.0
    exit /b 0
)
if "%1"=="list" (
    echo {}
    exit /b 0
)
exit /b 0
