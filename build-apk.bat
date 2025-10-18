@echo off
REM Build Release APK Script for Windows

echo.
echo ========================================
echo    SPRED APK Builder
echo ========================================
echo.

REM Check if Android directory exists
if not exist "android" (
    echo ERROR: android directory not found!
    echo Please run this script from the project root.
    pause
    exit /b 1
)

echo [1/4] Cleaning previous builds...
cd android
call gradlew clean
echo.

echo [2/4] Building Release APK...
call gradlew assembleRelease --console=plain
echo.

REM Check if build was successful
if exist "app\build\outputs\apk\release\app-release.apk" (
    echo [3/4] Build successful!
    echo.
    
    REM Get APK size
    for %%A in (app\build\outputs\apk\release\app-release.apk) do (
        set size=%%~zA
        set /a sizeMB=!size!/1048576
    )
    
    echo APK Location: android\app\build\outputs\apk\release\app-release.apk
    echo APK Size: !sizeMB! MB
    echo.
    
    echo [4/4] Installation Options:
    echo.
    echo   Option 1: Install via ADB (Device connected)
    echo   -------------------------------------------
    echo   adb install android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo   Option 2: Transfer to device
    echo   -------------------------------------------
    echo   adb push android\app\build\outputs\apk\release\app-release.apk /sdcard/Download/spred.apk
    echo.
    echo   Option 3: Manual Install
    echo   -------------------------------------------
    echo   Copy APK from: android\app\build\outputs\apk\release\app-release.apk
    echo   Transfer to device and install manually
    echo.
    
    REM Check if device is connected
    adb devices | findstr "device" >nul
    if %errorlevel% equ 0 (
        echo.
        echo Connected Device Detected!
        echo.
        choice /C YN /M "Do you want to install the APK now?"
        if errorlevel 2 goto end
        if errorlevel 1 goto install
    )
    
    :install
    echo.
    echo Installing APK...
    adb install -r android\app\build\outputs\apk\release\app-release.apk
    
    if %errorlevel% equ 0 (
        echo.
        echo ✅ APK installed successfully!
        echo.
        choice /C YN /M "Do you want to launch the app?"
        if errorlevel 2 goto end
        if errorlevel 1 (
            echo.
            echo Launching SPRED app...
            adb shell am start -n com.spred/.MainActivity
        )
    ) else (
        echo.
        echo ❌ Installation failed! Please check the error message above.
    )
    
) else (
    echo.
    echo ❌ Build failed! APK not found.
    echo Please check the error messages above.
    echo.
    pause
    exit /b 1
)

:end
cd ..
echo.
echo ========================================
echo    Build Process Complete!
echo ========================================
echo.
pause

