@echo off
echo ========================================
echo SPRED P2P Permission Fix Tool
echo ========================================
echo.

echo Enabling WiFi Direct at system level...
adb shell "settings put global wifi_direct_on 1"
echo.

echo Enabling location services...
adb shell "settings put secure location_providers_allowed gps,network"
echo.

echo Opening app permissions (manual step required)...
echo Please manually grant these permissions in the settings that will open:
echo - Location (REQUIRED for WiFi Direct discovery)
echo - Nearby devices (REQUIRED for Android 12+)
echo - Storage (for file transfers)
echo - Camera (for QR scanning)
echo.
pause
adb shell "am start -a android.settings.APPLICATION_DETAILS_SETTINGS -d package:com.spred"
echo.

echo Restarting WiFi service...
adb shell "svc wifi disable"
timeout /t 2 /nobreak >nul
adb shell "svc wifi enable"
echo.

echo Restarting the app...
adb shell "am force-stop com.spred"
timeout /t 2 /nobreak >nul
adb shell "monkey -p com.spred -c android.intent.category.LAUNCHER 1"
echo.

echo Fix complete! Check the app now.
pause