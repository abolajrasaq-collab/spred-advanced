@echo off
REM P2P Monitor Script for Windows
REM This script monitors P2P-related logs in real-time

echo 🔍 Starting P2P Monitor...
echo 📱 Monitoring connected device...
echo ================================
echo.

REM Clear the logcat buffer first
adb logcat -c

REM Monitor P2P-related logs
adb logcat | findstr /I "p2p wifi.*direct qr.*code transfer sender receiver unified.*service spred.*share"

