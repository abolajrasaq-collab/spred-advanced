# Real File Share Testing Guide

## 🧪 How to Test the Implementation

### Phase 1: Development Testing (Current)

#### 1. **Build & Install Debug APK**
```bash
# Build debug version
npx react-native run-android

# Or build debug APK manually
cd android
./gradlew assembleDebug
```

#### 2. **Test on Real Android Device**
⚠️ **IMPORTANT: Must test on physical device, not emulator**
- Emulators don't support WiFi hotspot creation
- Need real WiFi hardware for testing

#### 3. **Basic Functionality Test**
1. **Launch App** → Go to Account → "Real File Share Test"
2. **Tap "Start Sharing"**
   - Should request permissions (location, WiFi)
   - Should create WiFi hotspot
   - Should generate QR code
   - Should show hotspot credentials

3. **Check Logs** (via `adb logcat` or React Native debugger)
   - Look for "🚀 Starting real file share"
   - Check for permission requests
   - Monitor hotspot creation attempts

### Phase 2: Single Device Testing

#### Test Hotspot Creation
```bash
# Check if hotspot is created
adb shell dumpsys wifi | grep -i hotspot

# Check WiFi state
adb shell dumpsys wifi | grep -i "Wi-Fi is"
```

#### Test HTTP Server
```bash
# Check if server is listening on port 8080
adb shell netstat -an | grep 8080

# Test server response (if hotspot active)
curl http://192.168.43.1:8080/status
```

### Phase 3: Two-Device Testing

#### Setup Required
- **Device A**: Android phone (sender)
- **Device B**: Any device with WiFi + QR scanner (receiver)

#### Testing Steps

**Device A (Sender):**
1. Install and run the app
2. Go to Account → Real File Share Test
3. Tap "Start Sharing"
4. Note the hotspot name and password
5. Show QR code to Device B

**Device B (Receiver):**
1. Scan QR code with any QR scanner app
2. Parse the JSON data to get:
   - `hotspotName`: WiFi network name
   - `hotspotPassword`: WiFi password
   - `downloadUrl`: File download URL
3. Connect to the WiFi hotspot manually
4. Open browser and go to the download URL
5. File should start downloading

### Phase 4: Error Testing

#### Test Permission Scenarios
1. **Deny Location Permission** → Should show error message
2. **Deny WiFi Permission** → Should handle gracefully
3. **No WiFi Hardware** → Should detect and inform user

#### Test Network Scenarios
1. **Airplane Mode** → Should detect and handle
2. **WiFi Already Connected** → Should switch to hotspot mode
3. **Hotspot Already Active** → Should stop existing and create new

#### Test File Scenarios
1. **Missing File** → Should show "File not found" error
2. **Large File** → Should stream without memory issues
3. **Multiple Requests** → Should handle concurrent downloads

### Phase 5: Performance Testing

#### Memory Usage
```bash
# Monitor memory usage during file sharing
adb shell dumpsys meminfo com.spred

# Check for memory leaks
adb shell dumpsys meminfo com.spred | grep -i "TOTAL"
```

#### Network Performance
```bash
# Monitor network traffic
adb shell cat /proc/net/dev

# Check transfer speeds
# Use browser developer tools on receiving device
```

## 🔍 What to Look For

### ✅ Success Indicators
- **Permissions granted** without crashes
- **Hotspot created** with correct credentials
- **QR code generated** with valid JSON data
- **HTTP server running** on port 8080
- **File downloads** successfully on second device
- **No memory leaks** during operation
- **Clean shutdown** when stopping sharing

### ❌ Failure Indicators
- **App crashes** on "Start Sharing"
- **Permission denied** errors
- **Hotspot creation fails**
- **QR code shows "undefined" data
- **HTTP server not accessible**
- **File download fails** or corrupts
- **Memory usage grows** continuously
- **Services don't stop** properly

## 🛠️ Debugging Tools

### React Native Debugger
```bash
# Enable debugging
npx react-native start --reset-cache

# View logs
npx react-native log-android
```

### ADB Commands
```bash
# View app logs
adb logcat | grep -i spred

# Check permissions
adb shell dumpsys package com.spred | grep permission

# Monitor network
adb shell dumpsys connectivity
```

### Network Testing
```bash
# Test HTTP server from computer (if on same network)
curl -I http://[DEVICE_IP]:8080/status

# Test file download
wget http://192.168.43.1:8080/video -O test_download.mp4
```

## 📱 Test Scenarios

### Scenario 1: Happy Path
1. Start sharing → Success
2. Generate QR → Valid data
3. Second device connects → Downloads file
4. Stop sharing → Clean shutdown

### Scenario 2: Permission Issues
1. Start sharing → Permission request
2. Deny location → Graceful error
3. Grant permissions → Retry succeeds

### Scenario 3: Network Issues
1. No WiFi available → Error message
2. Hotspot creation fails → Fallback or error
3. Server start fails → Clear error message

### Scenario 4: File Issues
1. File doesn't exist → "File not found"
2. File too large → Streams properly
3. File in use → Handles gracefully

## 🎯 Testing Checklist

### Pre-Testing
- [ ] Physical Android device available
- [ ] Debug APK built and installed
- [ ] Second device for receiving available
- [ ] QR scanner app installed on second device

### Basic Functionality
- [ ] App launches without crashes
- [ ] Real File Share Test screen accessible
- [ ] "Start Sharing" button works
- [ ] Permissions requested appropriately
- [ ] QR code displays properly

### Core Features
- [ ] WiFi hotspot created successfully
- [ ] HTTP server starts on port 8080
- [ ] QR code contains valid JSON data
- [ ] Second device can connect to hotspot
- [ ] File downloads successfully
- [ ] Transfer completes without errors

### Error Handling
- [ ] Permission denials handled gracefully
- [ ] Network errors show clear messages
- [ ] File errors handled properly
- [ ] Service cleanup works correctly

### Performance
- [ ] No memory leaks during operation
- [ ] File streaming works for large files
- [ ] Multiple downloads handled properly
- [ ] Clean resource cleanup on stop

## 🚨 Known Limitations

1. **Android Only** - Hotspot creation only works on Android
2. **Physical Device Required** - Emulators don't support hotspot
3. **Permissions Required** - Location and WiFi permissions needed
4. **One-to-One** - Currently supports single receiver
5. **Manual Connection** - Receiver must manually connect to hotspot

## 📋 Test Results Template

```
Test Date: ___________
Device: ___________
Android Version: ___________

✅ Basic Functionality
- App launch: PASS/FAIL
- Navigation: PASS/FAIL
- UI display: PASS/FAIL

✅ Core Features
- Hotspot creation: PASS/FAIL
- HTTP server: PASS/FAIL
- QR generation: PASS/FAIL
- File download: PASS/FAIL

✅ Error Handling
- Permission errors: PASS/FAIL
- Network errors: PASS/FAIL
- File errors: PASS/FAIL

Notes: ___________
```

This testing approach will validate that the Real File Share implementation works correctly before building the production APK!