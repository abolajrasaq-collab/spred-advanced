#!/bin/bash

# P2P Monitor Script
# This script monitors P2P-related logs in real-time

echo "🔍 Starting P2P Monitor..."
echo "📱 Monitoring device: $(adb devices | grep -v "List" | awk '{print $1}')"
echo "================================"
echo ""

# Clear the logcat buffer first
adb logcat -c

# Monitor P2P-related logs with colors
adb logcat | grep --line-buffered -iE "p2p|wifi.*direct|qr.*code|transfer|sender|receiver|unified.*service|spred.*share" | while read line
do
    # Color code different log types
    if echo "$line" | grep -iq "error\|❌\|failed"; then
        echo -e "\033[0;31m$line\033[0m"  # Red for errors
    elif echo "$line" | grep -iq "warning\|⚠️"; then
        echo -e "\033[0;33m$line\033[0m"  # Yellow for warnings
    elif echo "$line" | grep -iq "success\|✅\|completed"; then
        echo -e "\033[0;32m$line\033[0m"  # Green for success
    elif echo "$line" | grep -iq "transfer\|progress\|📊\|📤\|📥"; then
        echo -e "\033[0;36m$line\033[0m"  # Cyan for transfer
    elif echo "$line" | grep -iq "qr.*code\|🔍"; then
        echo -e "\033[0;35m$line\033[0m"  # Magenta for QR code
    else
        echo "$line"  # Normal for everything else
    fi
done

