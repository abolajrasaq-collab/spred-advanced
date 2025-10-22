@echo off
echo ========================================
echo SPRED P2P Diagnostic Tool
echo ========================================
echo.

echo Checking ADB connection...
adb devices
echo.

echo Checking app permissions...
adb shell "dumpsys package com.spred | findstr -i 'permission.*location'"
adb shell "dumpsys package com.spred | findstr -i 'permission.*nearby'"
adb shell "dumpsys package com.spred | findstr -i 'permission.*wifi'"
echo.

echo Checking WiFi Direct status...
adb shell "settings get global wifi_direct_on"
adb shell "dumpsys wifi | findstr -i 'p2p.*enabled\|direct.*enabled'"
echo.

echo Checking location services...
adb shell "settings get secure location_providers_allowed"
echo.

echo Monitoring P2P logs (press Ctrl+C to stop)...
adb logcat -s ReactNativeJS | findstr "P2P\|discovery\|initialized\|WiFi"