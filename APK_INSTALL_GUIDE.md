# APK Installation & Testing Guide

## 📦 APK Build Information

### Build Command
```bash
cd android && ./gradlew assembleRelease
```

### APK Location
After build completes, your APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Installation Methods

### Method 1: Install via ADB (Recommended)

#### Single Device:
```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

#### Multiple Devices (Install on all):
```bash
adb -s <DEVICE_ID> install android/app/build/outputs/apk/release/app-release.apk
```

#### Force Reinstall (if app already exists):
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

### Method 2: Direct Device Transfer

1. **Copy APK to Device:**
   ```bash
   adb push android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/spred.apk
   ```

2. **On Device:**
   - Open File Manager
   - Navigate to Downloads
   - Tap `spred.apk`
   - Allow "Install from Unknown Sources" if prompted
   - Tap "Install"

---

### Method 3: Share via Cloud/Email

1. **Upload APK to cloud storage** (Google Drive, Dropbox, etc.)
2. **Share link** to test devices
3. **Download on device** and install
4. **Enable "Install Unknown Apps"** for your browser/file manager

---

## 🔧 Pre-Installation Checklist

Before installing the APK:

- [ ] Uninstall previous version (if upgrading)
- [ ] Enable "Install from Unknown Sources" in device settings
- [ ] Ensure device has Android 5.0+ (API 21+)
- [ ] Check available storage (at least 100MB free)
- [ ] Backup important data (if testing on primary device)

---

## 🚀 Post-Installation Setup

After installing the APK:

### 1. Grant Permissions
The app requires these permissions:
- ✅ **Camera** - For QR code scanning
- ✅ **Storage** - For reading/saving videos
- ✅ **Location** - For Wi-Fi Direct (Android 6+)
- ✅ **Wi-Fi** - For P2P connections

### 2. Enable Wi-Fi Direct
1. Go to Settings → Wi-Fi
2. Tap on Wi-Fi Direct (or Advanced → Wi-Fi Direct)
3. Ensure Wi-Fi Direct is supported and enabled

### 3. Verify Installation
```bash
# Check if app is installed
adb shell pm list packages | grep com.spred

# Check app info
adb shell dumpsys package com.spred | grep -A 3 "versionName"

# Launch app
adb shell am start -n com.spred/.MainActivity
```

---

## 🧪 P2P Testing with Physical Devices

### Setup (2 Devices Required)

#### Device 1 (Sender):
1. Install APK
2. Grant all permissions
3. Enable Wi-Fi
4. Open app → Navigate to a video
5. Tap SPRED icon → Show QR Code

#### Device 2 (Receiver):
1. Install APK
2. Grant all permissions
3. Enable Wi-Fi
4. Open app → Navigate to SPRED Share
5. Tap Receive → Scan QR Code
6. Scan Device 1's QR code

### Expected Behavior:
- ✅ Devices connect via Wi-Fi Direct
- ✅ Sender shows connected status
- ✅ Receiver shows connected status
- ✅ Video transfers with progress bar
- ✅ Transfer completes successfully
- ✅ File appears in receiver's storage

---

## 📊 Testing Checklist

### Basic Functionality
- [ ] App launches successfully
- [ ] Navigation works (all tabs)
- [ ] Videos play correctly
- [ ] Settings accessible

### P2P Features
- [ ] QR code generates correctly
- [ ] Camera opens for scanning
- [ ] QR code scans successfully
- [ ] Device discovery works
- [ ] Devices connect via QR pairing
- [ ] File transfer initiates
- [ ] Progress tracking works
- [ ] Transfer completes successfully
- [ ] Files saved to correct location

### Performance
- [ ] App launches in < 3 seconds
- [ ] Navigation is smooth (60fps)
- [ ] Video playback is smooth
- [ ] P2P discovery < 10 seconds
- [ ] File transfer speed > 10MB/s (depends on devices)

### Error Handling
- [ ] Permission denial handled gracefully
- [ ] Network errors shown clearly
- [ ] Transfer failures have retry option
- [ ] App doesn't crash on errors

---

## 🐛 Troubleshooting

### Issue: APK Won't Install

**Error: "App not installed"**
```bash
# Uninstall old version first
adb uninstall com.spred

# Clear cache
adb shell pm clear com.spred

# Reinstall
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Error: "Signature mismatch"**
```bash
# Uninstall completely
adb uninstall com.spred

# Install fresh
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

### Issue: App Crashes on Launch

**Check crash logs:**
```bash
# View crash logs
adb logcat | grep -i "AndroidRuntime\|FATAL\|crash"

# Filter SPRED app logs only
adb logcat | grep com.spred

# Save logs to file
adb logcat > app_crash.log
```

**Common fixes:**
1. Clear app data: `adb shell pm clear com.spred`
2. Reinstall APK
3. Check Android version compatibility
4. Verify all permissions granted

---

### Issue: Wi-Fi Direct Not Working

**Checklist:**
- [ ] Wi-Fi is enabled (not Wi-Fi Direct, just Wi-Fi)
- [ ] Location services enabled (Android 6+)
- [ ] Location permission granted to app
- [ ] Both devices support Wi-Fi Direct
- [ ] Devices are within 100 feet
- [ ] No other Wi-Fi Direct connections active

**Test Wi-Fi Direct support:**
```bash
# Check if Wi-Fi Direct is supported
adb shell dumpsys wifip2p

# Check Wi-Fi state
adb shell dumpsys wifi | grep "Wi-Fi"
```

---

### Issue: QR Code Not Scanning

**Fixes:**
1. Ensure camera permission granted
2. Check adequate lighting
3. Hold phone 6-12 inches from QR code
4. Clean camera lens
5. Try regenerating QR code

**Test camera:**
```bash
# Check camera permissions
adb shell dumpsys package com.spred | grep -A 5 android.permission.CAMERA

# Test camera access
adb shell am start -n com.spred/.MainActivity -e test_camera true
```

---

## 📈 Performance Monitoring

### Monitor App Performance:
```bash
# CPU usage
adb shell top | grep spred

# Memory usage
adb shell dumpsys meminfo com.spred

# Battery usage
adb shell dumpsys batterystats | grep com.spred

# Network usage
adb shell dumpsys netstats | grep com.spred
```

### Monitor P2P Transfer:
```bash
# Real-time transfer logs
adb logcat | grep -i "transfer\|p2p\|wifi"

# File system activity
adb shell ls -la /sdcard/Android/data/com.spred/files/

# Network interface stats
adb shell netstat | grep p2p
```

---

## 🔐 Security Considerations

### Before Distribution:
- ✅ Use release keystore (not debug)
- ✅ Enable ProGuard/R8 for code obfuscation
- ✅ Remove all debug logs
- ✅ Verify no hardcoded API keys
- ✅ Test on clean devices (factory reset)

### Current Build Type:
- **Type:** Release
- **Keystore:** `android/app/release.keystore`
- **ProGuard:** Enabled (check `android/app/build.gradle`)
- **Minify:** Enabled

---

## 📤 Distribution Options

### Option 1: Direct APK Sharing
- Share `app-release.apk` via email/cloud
- Users must enable "Unknown Sources"
- Good for internal testing

### Option 2: Google Play Internal Testing
```bash
# Build app bundle (AAB) for Play Store
cd android && ./gradlew bundleRelease

# AAB location:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Option 3: Firebase App Distribution
1. Upload APK to Firebase
2. Share invite link
3. Testers download via Firebase app
4. Automatic updates available

---

## 📝 Test Report Template

After testing, document results:

```
=== SPRED APK Test Report ===

Date: [DATE]
APK Version: [VERSION]
Build: Release
Devices Tested: [LIST DEVICES]

=== Installation ===
Status: [ ] Success [ ] Failed
Time to Install: [TIME]
Issues: [NOTES]

=== Basic Functionality ===
Launch: [ ] Pass [ ] Fail
Navigation: [ ] Pass [ ] Fail
Video Playback: [ ] Pass [ ] Fail

=== P2P Testing ===
QR Generation: [ ] Pass [ ] Fail
QR Scanning: [ ] Pass [ ] Fail
Device Discovery: [ ] Pass [ ] Fail
Connection: [ ] Pass [ ] Fail
File Transfer: [ ] Pass [ ] Fail

Transfer Speed: [SPEED] MB/s
Transfer Success Rate: [X/Y successful]

=== Issues Found ===
1. 
2. 
3. 

=== Performance ===
Launch Time: [TIME]
Memory Usage: [MB]
Battery Impact: [LOW/MEDIUM/HIGH]

=== Overall Assessment ===
Status: [ ] Ready for Release [ ] Needs Fixes [ ] Major Issues

Recommendations:
_________________________________
```

---

## 🎯 Quick Start Commands

```bash
# Build APK
cd android && ./gradlew assembleRelease

# Install on device
adb install android/app/build/outputs/apk/release/app-release.apk

# Launch app
adb shell am start -n com.spred/.MainActivity

# Monitor logs
adb logcat | grep com.spred

# Test P2P (on 2 devices)
# Device 1: Open video → SPRED icon → Show QR
# Device 2: Receive → Scan QR → Transfer

# Uninstall
adb uninstall com.spred
```

---

## ✅ Success Indicators

Your APK is ready for production if:
- ✅ Installs on all test devices
- ✅ All permissions work correctly
- ✅ No crashes during normal use
- ✅ P2P transfers complete successfully
- ✅ UI is responsive (60fps)
- ✅ Battery usage is acceptable
- ✅ Works on Android 5.0 - 14+
- ✅ File transfers are reliable
- ✅ QR code pairing works consistently

---

## 🚀 Next Steps

1. **Wait for build to complete** (check terminal)
2. **Verify APK exists** at `android/app/build/outputs/apk/release/app-release.apk`
3. **Install on 2 physical devices**
4. **Test P2P functionality** using the P2P test guide
5. **Document results** using the test report template
6. **Fix any issues** found during testing
7. **Rebuild and retest** until stable
8. **Prepare for distribution**

Good luck with testing! 🎉

