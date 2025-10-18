@echo off
echo ========================================
echo    WiFi Direct Permissions Fix Script
echo ========================================
echo.

echo [INFO] Granting critical permissions for WiFi Direct functionality...
echo.

echo [1/4] Granting LOCATION permission...
adb shell pm grant com.spred android.permission.ACCESS_FINE_LOCATION
adb shell pm grant com.spred android.permission.ACCESS_COARSE_LOCATION

echo [2/4] Granting NEARBY_WIFI_DEVICES permission...
adb shell pm grant com.spred android.permission.NEARBY_WIFI_DEVICES

echo [3/4] Granting storage permissions...
adb shell pm grant com.spred android.permission.READ_EXTERNAL_STORAGE
adb shell pm grant com.spred android.permission.WRITE_EXTERNAL_STORAGE
adb shell pm grant com.spred android.permission.READ_MEDIA_IMAGES
adb shell pm grant com.spred android.permission.READ_MEDIA_VIDEO

echo [4/4] Granting camera permission...
adb shell pm grant com.spred android.permission.CAMERA

echo.
echo [SUCCESS] All permissions granted!
echo.
echo [INFO] Now please:
echo 1. Enable WiFi Direct in device settings
echo 2. Make device discoverable
echo 3. Test P2P discovery in the app
echo.
echo [INFO] Monitoring logs for P2P events...
echo Press Ctrl+C to stop monitoring
echo.

:monitor_loop
adb logcat -s ReactNativeJS | findstr /i "p2p discovery initialized"
timeout /t 2 /nobreak > nul
goto monitor_loop
