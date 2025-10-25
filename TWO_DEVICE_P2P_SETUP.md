# 📱 Two Device P2P Setup Guide

## 🎯 **Yes, You Need the Same APK on Both Devices**

For proper P2P testing, both devices need the same version of Spred with the permission bypass enabled.

## 📦 **APK Transfer Options**

### **Option 1: ADB Transfer (Recommended)**
```bash
# Copy APK to a shared location
adb -s R3CR20MEYZD push android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/spred-v1.2.5.apk

# Then transfer via USB, Bluetooth, or cloud storage to second device
```

### **Option 2: Cloud Storage**
1. **Upload APK** to Google Drive, Dropbox, or similar
2. **Download on second device**
3. **Install from Downloads folder**

### **Option 3: Direct File Transfer**
1. **Connect both devices** to same WiFi
2. **Use file sharing app** (ShareIt, Files by Google, etc.)
3. **Transfer APK** from device to device

## 🔧 **Installation Steps for Second Device**

### **Device B (Bolaji's Note10) Setup:**

1. **Enable Developer Options**:
   - Go to Settings > About phone
   - Tap "Build number" 7 times
   - Enable "Install unknown apps" for your file manager

2. **Install APK**:
   - Open file manager
   - Navigate to Downloads folder
   - Tap `spred-v1.2.5.apk`
   - Allow installation from unknown sources
   - Install the app

3. **Grant Permissions** (if prompted):
   - Allow all permissions during first launch
   - Or use ADB if available: `adb shell pm grant com.spred android.permission.ACCESS_FINE_LOCATION`

## 🚀 **Testing Procedure**

### **Step 1: Setup Receiver (Device B)**
1. **Open Spred app** on Bolaji's Note10
2. **Navigate to "Receive" screen**
3. **Put device in receiver/discovery mode**
4. **Should show "Waiting for connection..." or similar**

### **Step 2: Setup Sender (Device A)**
1. **Open Spred app** on your S21 Ultra
2. **Navigate to "Big George Foreman" video**
3. **Tap share button**
4. **Should now detect Device B**

### **Step 3: Expected Success**
```
Device A logs:
Connected clients: 1
Is group owner: true
Target address: 192.168.49.1
SEND FILE PROGRESS: 25%
SEND FILE PROGRESS: 50%
SEND FILE PROGRESS: 100%

Device B logs:
Receiving file from: Device A
RECEIVE PROGRESS: 25%
RECEIVE PROGRESS: 50%
File received successfully!
```

## 📋 **Quick APK Preparation**

Let me prepare the APK for easy transfer: