@echo off
echo.
echo ================================================
echo          SPRED Production APK Builder
echo ================================================
echo.

REM Change to the project directory
cd /d "E:\AI\VERSIONS\Spredbolarv1\spred-android1"

echo Building SPRED Production APK...
echo.

REM Clean previous builds
echo Cleaning previous builds...
call gradlew clean
if %ERRORLEVEL% neq 0 (
    echo Error during clean. Exiting...
    pause
    exit /b 1
)

echo.
echo Generating production APK...
echo.

REM Generate the release APK
call gradlew assembleRelease
if %ERRORLEVEL% neq 0 (
    echo Error during APK build. Exiting...
    pause
    exit /b 1
)

echo.
echo ================================================
echo           BUILD COMPLETED SUCCESSFULLY
echo ================================================
echo.

REM Locate the generated APK
echo Generated APK location:
for /r "android\app\build\outputs\apk\release" %%f in (*.apk) do (
    echo %%f
    set "apk_path=%%f"
)

echo.
echo The production APK has been generated successfully!
echo You can find it in the android/app/build/outputs/apk/release/ folder.
echo.

REM Optional: Copy APK to project root for easy access
if defined apk_path (
    echo Copying APK to project root...
    copy "%apk_path%" .
    echo.
    echo APK also copied to project root directory.
)

echo.
echo To install on your device:
echo 1. Enable Developer Options and USB Debugging on your Android device
echo 2. Connect your device via USB
echo 3. Run: adb install -r "app-release.apk" (if adb is in your PATH)
echo    Or install the APK manually on your device
echo.

pause