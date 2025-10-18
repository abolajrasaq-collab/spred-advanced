@echo off
REM Git Helper Scripts for Spred Android App (Windows Batch)

setlocal enabledelayedexpansion

REM Function to start new feature
:start_feature
if "%~2"=="" (
    echo [ERROR] Please provide feature name: git-helpers.bat start-feature feature-name
    exit /b 1
)

set FEATURE_NAME=feature/%~2
echo [INFO] Starting new feature: %FEATURE_NAME%

REM Switch to develop and pull latest
git checkout develop
git pull origin develop

REM Create and switch to new feature branch
git checkout -b %FEATURE_NAME%
echo [SUCCESS] Created and switched to %FEATURE_NAME%
goto :eof

REM Function to finish feature
:finish_feature
for /f %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i

echo %CURRENT_BRANCH% | findstr /r "^feature/" >nul
if errorlevel 1 (
    echo [ERROR] You must be on a feature branch to finish it
    exit /b 1
)

echo [INFO] Finishing feature: %CURRENT_BRANCH%

REM Switch to develop
git checkout develop
git pull origin develop

REM Merge feature branch
git merge %CURRENT_BRANCH%

REM Push to develop
git push origin develop

REM Delete feature branch
git branch -d %CURRENT_BRANCH%
git push origin --delete %CURRENT_BRANCH%

echo [SUCCESS] Feature %CURRENT_BRANCH% merged and deleted
goto :eof

REM Function to sync with remote
:sync_branches
echo [INFO] Syncing all branches with remote...

git fetch origin

REM Update main
git checkout main
git pull origin main

REM Update develop
git checkout develop
git pull origin develop

echo [SUCCESS] All branches synced
goto :eof

REM Function to show branch status
:show_status
echo [INFO] Current Git Status:
echo.

for /f %%i in ('git branch --show-current') do echo Current branch: %%i
echo.

echo Branch status:
git status --short
echo.

echo Recent commits:
git log --oneline -5
echo.

echo All branches:
git branch -a
goto :eof

REM Main script logic
if "%1"=="start-feature" goto start_feature
if "%1"=="finish-feature" goto finish_feature
if "%1"=="sync" goto sync_branches
if "%1"=="status" goto show_status

REM Default help
echo Git Helper Script for Spred Android App
echo.
echo Usage: %0 {command} [argument]
echo.
echo Commands:
echo   start-feature ^<name^>    - Start a new feature branch
echo   finish-feature           - Finish current feature branch
echo   sync                     - Sync all branches with remote
echo   status                   - Show current Git status
echo.
echo Examples:
echo   %0 start-feature user-authentication
echo   %0 status
goto :eof
