# 🔍 Device Discovery Troubleshooting Guide

## Issue: Devices Not Discovering Each Other

If your devices aren't finding each other during P2P testing, follow this step-by-step troubleshooting guide.

---

## ✅ **Step 1: Check Device Requirements**

### Both Devices Must Have:
- [ ] **Android 5.0+** (API 21+)
- [ ] **WiFi Direct support** (most modern Android devices)
- [ ] **WiFi enabled** (not WiFi Direct, just regular WiFi)
- [ ] **Location services enabled**
- [ ] **SPRED app installed** with same version

### Verify WiFi Direct Support:
1. Go to **Settings → WiFi**
2. Look for **WiFi Direct** option in menu
3. If not available, device doesn't support WiFi Direct

---

## 🔐 **Step 2: Grant Required Permissions**

### Critical Permissions (Both Devices):

#### On Each Device:
1. **Settings → Apps → SPRED → Permissions**
2. Enable these permissions:
   - ✅ **Location** (CRITICAL - required for device discovery)
   - ✅ **Camera** (for QR code scanning)
   - ✅ **Storage** (for file access)
   - ✅ **Nearby devices** (Android 12+, if available)

#### Enable Location Services:
1. **Settings → Location**
2. **Turn ON** location services
3. Set accuracy to **"High accuracy"**
4. Make sure **WiFi scanning** is enabled

---

## 📡 **Step 3: WiFi Configuration**

### On Both Devices:
1. **Enable WiFi** (Settings → WiFi → ON)
2. **Disable WiFi Hotspot** (if active)
3. **Disconnect from WiFi networks** (optional, but helps)
4. **Clear WiFi Direct connections**:
   - Settings → WiFi → WiFi Direct
   - Disconnect any existing connections

---

## 🔄 **Step 4: Restart Services**

### On Both Devices:
1. **Turn WiFi OFF and ON**
2. **Turn Location OFF and ON**
3. **Restart the SPRED app**
4. **Clear app cache** (Settings → Apps → SPRED → Storage → Clear Cache)

---

## 🧪 **Step 5: Test Discovery Process**

### Device 1 (Sender):
1. Open SPRED app
2. Navigate to any video
3. Tap SPRED share icon
4. Video should auto-select (green border)
5. **Check logs**: Should see "P2P service initialized"

### Device 2 (Receiver):
1. Open SPRED app
2. Navigate to SPRED Share → Receive
3. Should see "Searching for nearby devices..."
4. **Check logs**: Should see "Discovery started"

### Expected Timeline:
- **0-5 seconds**: Services initialize
- **5-15 seconds**: Devices should appear in discovery list
- **15+ seconds**: If no devices found, there's an issue

---

## 🔍 **Step 6: Advanced Diagnostics**

### Check App Logs:
Look for these log messages in your development console:

#### Successful Discovery:
```
🔧 P2P service initialized
🔍 Starting device discovery
✅ Discovery started successfully
📱 Peers update received: 1 devices
```

#### Failed Discovery:
```
❌ Discovery failed: [error message]
❌ Permission request error
❌ WiFi is not enabled
❌ Location is not enabled
```

### Common Error Messages:

#### "Permissions not granted"
- **Fix**: Grant Location and Nearby devices permissions
- **Action**: Settings → Apps → SPRED → Permissions

#### "WiFi is not enabled"
- **Fix**: Enable WiFi on both devices
- **Action**: Settings → WiFi → ON

#### "Location is not enabled"
- **Fix**: Enable location services
- **Action**: Settings → Location → ON

#### "Discovery timeout"
- **Fix**: Devices too far apart or interference
- **Action**: Move devices closer, restart WiFi

---

## 🛠️ **Step 7: Alternative Solutions**

### If Discovery Still Fails:

#### Option 1: QR Code Pairing
1. **Device 1**: Generate QR code (Show QR button)
2. **Device 2**: Scan QR code (Scan QR button)
3. This bypasses device discovery

#### Option 2: Manual Connection
1. **Device 1**: Go to Settings → WiFi → WiFi Direct
2. **Device 2**: Go to Settings → WiFi → WiFi Direct
3. Connect devices manually through Android settings
4. Return to SPRED app

#### Option 3: Reset Network Settings
1. **Settings → System → Reset → Reset Network Settings**
2. **Warning**: This will clear all WiFi passwords
3. Reconfigure WiFi and try again

---

## 🔧 **Step 8: Code-Level Fixes**

### If you're still having issues, the problem might be in the implementation:

#### Check Native Module:
The app uses `p2p-file-transfer` module. Verify:
- Module is properly linked
- Native Android code is compiled
- Permissions are declared in AndroidManifest.xml

#### Rebuild App:
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx react-native run-android
```

---

## 📊 **Step 9: Test Results**

### Document Your Findings:

#### Device Information:
- **Device 1**: [Brand/Model/Android Version]
- **Device 2**: [Brand/Model/Android Version]
- **Distance**: [How far apart]
- **Environment**: [Indoor/Outdoor/Interference]

#### Test Results:
- [ ] Permissions granted on both devices
- [ ] WiFi enabled on both devices
- [ ] Location enabled on both devices
- [ ] App initializes without errors
- [ ] Discovery starts successfully
- [ ] Devices appear in discovery list
- [ ] Connection successful
- [ ] File transfer works

#### If Still Failing:
- **Error messages**: [Copy exact error messages]
- **Log output**: [Copy relevant log entries]
- **Steps tried**: [List what you've attempted]

---

## 🎯 **Quick Checklist**

Before testing, verify:
- [ ] 2 physical Android devices (not emulators)
- [ ] Both devices within 30 feet
- [ ] WiFi ON, Hotspot OFF on both
- [ ] Location services ON on both
- [ ] All permissions granted in SPRED app
- [ ] No other WiFi Direct connections active
- [ ] Same SPRED app version on both devices

---

## 🆘 **Still Not Working?**

### Last Resort Options:

#### 1. Test with Different Devices
- Try with different Android devices
- Some older devices have WiFi Direct issues
- Samsung and Google Pixel devices usually work well

#### 2. Test in Different Environment
- Move to area with less WiFi interference
- Try outdoors away from routers
- Turn off other devices' WiFi/Bluetooth

#### 3. Use Alternative Method
- Share files via QR code + cloud storage
- Use Bluetooth file transfer as backup
- Test with other WiFi Direct apps to verify hardware

---

## 📞 **Getting Help**

If you've tried everything and it's still not working:

1. **Collect Information**:
   - Device models and Android versions
   - Exact error messages from logs
   - Screenshots of permission screens
   - List of steps you've tried

2. **Check Hardware Compatibility**:
   - Verify both devices support WiFi Direct
   - Check if devices work with other WiFi Direct apps
   - Test with known working device combinations

3. **Report Issue**:
   - Include all collected information
   - Specify which step in this guide failed
   - Mention if QR code pairing works as alternative

---

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ Both devices show "P2P service initialized" in logs
- ✅ Discovery shows "Searching for nearby devices"
- ✅ Devices appear in each other's discovery lists
- ✅ Connection establishes within 10-15 seconds
- ✅ File transfer progress bars appear
- ✅ Files transfer successfully

Good luck! WiFi Direct can be tricky, but following this guide should resolve most issues.