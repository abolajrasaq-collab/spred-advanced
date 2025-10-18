@echo off
echo Fixing Android Emulator Display Issues...
echo.

echo Step 1: Stopping all Android emulators...
taskkill /f /im qemu-system-x86_64.exe 2>nul
taskkill /f /im emulator.exe 2>nul
taskkill /f /im emulator64.exe 2>nul

echo.
echo Step 2: Clearing emulator cache...
rmdir /s /q "%USERPROFILE%\.android\avd" 2>nul

echo.
echo Step 3: Starting emulator with hardware acceleration...
echo Please run this command manually in Android Studio AVD Manager:
echo.
echo 1. Open Android Studio
echo 2. Go to Tools ^> AVD Manager
echo 3. Click the pencil icon next to your emulator
echo 4. Click "Show Advanced Settings"
echo 5. Set Graphics to "Hardware - GLES 2.0"
echo 6. Set Multi-Core CPU to "4 cores"
echo 7. Set RAM to "4096 MB"
echo 8. Click "Finish"
echo 9. Start the emulator from AVD Manager
echo.

echo Step 4: Alternative - Try running with different graphics settings...
echo You can also try these commands:
echo npx react-native run-android --deviceId=emulator-5554
echo.
echo Or create a new emulator with these settings:
echo - API Level: 33 or 34
echo - Graphics: Hardware - GLES 2.0
echo - RAM: 4096 MB
echo - Multi-Core CPU: 4 cores
echo.

pause
