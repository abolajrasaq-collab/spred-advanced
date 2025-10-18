#!/bin/bash

echo ""
echo "==============================================="
echo "          SPRED Production APK Builder"
echo "==============================================="
echo ""

# Change to the project directory
cd "$(dirname "$0")"

echo "Building SPRED Production APK..."
echo ""

# Clean previous builds
echo "Cleaning previous builds..."
./gradlew clean
if [ $? -ne 0 ]; then
    echo "Error during clean. Exiting..."
    exit 1
fi

echo ""
echo "Generating production APK..."
echo ""

# Generate the release APK
./gradlew assembleRelease
if [ $? -ne 0 ]; then
    echo "Error during APK build. Exiting..."
    exit 1
fi

echo ""
echo "==============================================="
echo "           BUILD COMPLETED SUCCESSFULLY"
echo "==============================================="
echo ""

# Locate the generated APK
echo "Generated APK location:"
find android/app/build/outputs/apk/release/ -name "*.apk" -type f

echo ""
echo "The production APK has been generated successfully!"
echo "You can find it in the android/app/build/outputs/apk/release/ folder."
echo ""

# Optional: Copy APK to project root for easy access
APK_PATH=$(find android/app/build/outputs/apk/release/ -name "*.apk" -type f | head -n 1)
if [ -f "$APK_PATH" ]; then
    echo "Copying APK to project root..."
    cp "$APK_PATH" .
    echo ""
    echo "APK also copied to project root directory."
fi

echo ""
echo "To install on your device:"
echo "1. Enable Developer Options and USB Debugging on your Android device"
echo "2. Connect your device via USB"
echo "3. Run: adb install -r app-release.apk (if adb is in your PATH)"
echo "   Or install the APK manually on your device"
echo ""