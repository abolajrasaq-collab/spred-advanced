@echo off
echo 🚀 Building SPRED Test APK for Real Device Testing...
echo.

echo 📱 Cleaning previous builds...
cd android
call gradlew clean
cd ..

echo 🔨 Building debug APK...
call npx react-native run-android --variant=debug

echo.
echo ✅ APK built successfully!
echo 📁 Location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 📋 Next steps:
echo 1. Copy APK to second device
echo 2. Install: adb install android\app\build\outputs\apk\debug\app-debug.apk
echo 3. Grant all permissions on both devices
echo 4. Connect to same WiFi network
echo 5. Run Test 7 (Device Discovery) on both devices
echo.
pause