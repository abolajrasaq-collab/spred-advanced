#!/bin/bash

# Build Release APK Script for Mac/Linux

echo ""
echo "========================================"
echo "   SPRED APK Builder"
echo "========================================"
echo ""

# Check if Android directory exists
if [ ! -d "android" ]; then
    echo "❌ ERROR: android directory not found!"
    echo "Please run this script from the project root."
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[1/4] Cleaning previous builds...${NC}"
cd android
./gradlew clean
echo ""

echo -e "${BLUE}[2/4] Building Release APK...${NC}"
./gradlew assembleRelease --console=plain
echo ""

# Check if build was successful
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}[3/4] Build successful!${NC}"
    echo ""
    
    # Get APK size
    size=$(ls -lh "$APK_PATH" | awk '{print $5}')
    
    echo "APK Location: android/$APK_PATH"
    echo "APK Size: $size"
    echo ""
    
    echo -e "${BLUE}[4/4] Installation Options:${NC}"
    echo ""
    echo "  Option 1: Install via ADB (Device connected)"
    echo "  -------------------------------------------"
    echo "  adb install android/$APK_PATH"
    echo ""
    echo "  Option 2: Transfer to device"
    echo "  -------------------------------------------"
    echo "  adb push android/$APK_PATH /sdcard/Download/spred.apk"
    echo ""
    echo "  Option 3: Manual Install"
    echo "  -------------------------------------------"
    echo "  Copy APK from: android/$APK_PATH"
    echo "  Transfer to device and install manually"
    echo ""
    
    # Check if device is connected
    if adb devices | grep -q "device$"; then
        echo ""
        echo -e "${YELLOW}Connected Device Detected!${NC}"
        echo ""
        read -p "Do you want to install the APK now? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            echo "Installing APK..."
            adb install -r "android/$APK_PATH"
            
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✅ APK installed successfully!${NC}"
                echo ""
                read -p "Do you want to launch the app? (y/n): " -n 1 -r
                echo ""
                
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    echo ""
                    echo "Launching SPRED app..."
                    adb shell am start -n com.spred/.MainActivity
                fi
            else
                echo ""
                echo -e "${RED}❌ Installation failed! Please check the error message above.${NC}"
            fi
        fi
    fi
    
else
    echo ""
    echo -e "${RED}❌ Build failed! APK not found.${NC}"
    echo "Please check the error messages above."
    echo ""
    exit 1
fi

cd ..
echo ""
echo "========================================"
echo "   Build Process Complete!"
echo "========================================"
echo ""

