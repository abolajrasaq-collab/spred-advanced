# P2P Manual Testing Checklist

## 🚀 Quick Start - Testing P2P Right Now

Since the app is already running on your emulator, you can start testing immediately!

---

## ✅ Test 1: QR Code Generation (3 minutes)

### Steps:
1. **In the emulator:**
   - Open any video in the PlayVideos screen
   - Tap the SPRED share icon (top right)
   
2. **Verify auto-selection:**
   - ✅ Video should have a green border (auto-selected)
   - ✅ Video title should match "The Bond"
   
3. **Test QR Code:**
   - Tap "Show QR" button in the Quick Pair section
   - ✅ Modal should appear with a QR code
   - ✅ Check Metro/React Native console for logs:
     ```
     🔍 Show QR button pressed
     🔍 QR Code Modal - showQRModal: true
     🔍 QR Code Data: {"id":"...","name":"...","type":"Android",...}
     ```

4. **Verify QR Code Data:**
   - Copy the QR code data from console
   - Verify it contains: `id`, `name`, `type`, `timestamp`, `role`
   - Close modal by tapping X or outside

**Result:** [ ] PASS [ ] FAIL  
**Notes:** _______________

---

## ✅ Test 2: Receiver UI & QR Scanner (3 minutes)

### Steps:
1. **Navigate to Receiver:**
   - From SPRED Share screen, you should see "Sender" at top
   - (Receiver mode is on a different screen - SpredShareReceiverUI)

2. **Access Receiver (if available in navigation):**
   - Look for "Receive" tab or button
   - Navigate to receiver screen

3. **Test QR Scanner:**
   - Tap "Scan QR Code" button
   - ✅ Camera permission prompt should appear (if first time)
   - ✅ Camera preview should open
   - ✅ Check console for: `📸 Opening camera for QR scan...`

4. **Test Scanner Functionality:**
   - Point camera at sender's QR code (from Test 1)
   - OR use a QR code generator online with the data from Test 1
   - ✅ Check console for: `✅ QR code scanned successfully`

**Result:** [ ] PASS [ ] FAIL  
**Notes:** _______________

---

## ✅ Test 3: Service Initialization (2 minutes)

### Steps:
1. **Check Sender Logs:**
   - Look in Metro console for:
   ```
   🔧 Initializing Sender P2P Service...
   ✅ Sender P2P Service initialized
   🔍 Sender discovery started
   ```

2. **Check Receiver Logs:**
   - Navigate to receiver screen
   - Look for:
   ```
   🔧 Initializing Receiver P2P Service...
   ✅ Receiver P2P Service initialized
   🔍 Receiver discovery started
   ```

3. **Verify Service Status:**
   - Sender screen should show "Discoverable" badge
   - Receiver screen should show "Searching for nearby devices..."

**Result:** [ ] PASS [ ] FAIL  
**Notes:** _______________

---

## ✅ Test 4: UI State Management (5 minutes)

### Test Video Selection:
1. Go to Sender screen
2. Tap on "The Bond" video (should already be selected)
3. ✅ Green border should appear
4. ✅ Video metadata should display correctly

### Test Transfer UI (Mock):
1. Look for "Active Transfers" section
2. ✅ Should be empty initially
3. ✅ Should show "No active transfers" message

### Test Device List UI:
1. Check "Discovered Devices" section (sender)
2. ✅ Should show "No devices found" if none discovered
3. Check "Nearby Devices" section (receiver)
4. ✅ Should show searching animation

**Result:** [ ] PASS [ ] FAIL  
**Notes:** _______________

---

## ✅ Test 5: Error Handling (3 minutes)

### Test Invalid QR Code:
1. On receiver, scan an invalid QR code (any random QR)
2. ✅ Should show error message
3. ✅ Check console for error log

### Test Permissions:
1. Deny camera permission
2. Tap "Scan QR Code"
3. ✅ Should show permission error
4. ✅ Should provide instructions to enable

**Result:** [ ] PASS [ ] FAIL  
**Notes:** _______________

---

## 🔍 Console Logs to Verify

### Expected Sender Logs:
```bash
🔧 Initializing Sender P2P Service...
📊 Sender P2P Service initialized
🔍 Sender discovery started: sender
🔍 Show QR button pressed
🔍 QR Code Modal - showQRModal: true
🔍 QR Code Data: {...}
```

### Expected Receiver Logs:
```bash
🔧 Initializing Receiver P2P Service...
📊 Receiver P2P Service initialized  
🔍 Receiver discovery started: receiver
📸 Opening camera for QR scan...
✅ QR code scanned successfully: {...}
📡 Attempting to pair with device: {...}
```

---

## 📱 Physical Device Testing (REQUIRED for Real P2P)

**⚠️ IMPORTANT:** Wi-Fi Direct does NOT work on emulators!

To test actual file transfer, you need:

### Setup:
1. **Two Android devices** (both Android 4.0+)
2. **Install app on both** using:
   ```bash
   npx react-native run-android --device
   ```
3. **Enable Wi-Fi** on both devices
4. **Grant permissions:** Location, Camera, Storage

### Test Real Transfer:
1. **Device 1 (Sender):**
   - Open video in PlayVideos
   - Tap SPRED icon
   - Tap "Show QR"

2. **Device 2 (Receiver):**
   - Go to Receive screen
   - Tap "Scan QR Code"
   - Scan Device 1's QR code

3. **Expected Flow:**
   - ✅ Devices connect automatically
   - ✅ Sender shows "Connected to [Device 2]"
   - ✅ Receiver shows "Connected to [Device 1]"
   - ✅ Tap video to send on Device 1
   - ✅ Progress bar appears on both devices
   - ✅ Transfer completes successfully
   - ✅ File appears in "Received Files" on Device 2

**Result:** [ ] PASS [ ] FAIL [ ] NOT TESTED (No physical devices)  
**Notes:** _______________

---

## 🐛 Common Issues & Solutions

### Issue 1: QR Code Not Showing
**Solution:**
- Check console for errors
- Verify QR code data is being generated
- Try closing and reopening modal

### Issue 2: Camera Not Opening
**Solution:**
- Grant camera permission
- Check Android version (6.0+ needs runtime permissions)
- Verify RNCamera is installed: `npm list react-native-camera`

### Issue 3: Devices Not Connecting
**Solution:**
- Use physical devices (not emulators)
- Enable Wi-Fi on both
- Grant location permission
- Keep devices close (within 30 feet)

### Issue 4: No Console Logs
**Solution:**
- Open Metro bundler console
- OR use: `adb logcat | grep P2P`
- Check React Native debugger

---

## 📊 Test Summary Template

```
Test Session: [Date/Time]
App Version: [Version]
Device/Emulator: [Details]

=== RESULTS ===
Test 1 (QR Generation):     [ ] PASS [ ] FAIL
Test 2 (QR Scanner):        [ ] PASS [ ] FAIL  
Test 3 (Service Init):      [ ] PASS [ ] FAIL
Test 4 (UI State):          [ ] PASS [ ] FAIL
Test 5 (Error Handling):    [ ] PASS [ ] FAIL
Physical Device Test:       [ ] PASS [ ] FAIL [ ] SKIPPED

=== ISSUES FOUND ===
1. 
2. 
3. 

=== OVERALL STATUS ===
[ ] ALL TESTS PASSED
[ ] SOME TESTS FAILED
[ ] READY FOR PRODUCTION
[ ] NEEDS FIXES

Notes:
_________________________________
_________________________________
```

---

## 🎯 Quick Validation Commands

Run these in your terminal to verify the implementation:

```bash
# Check TypeScript errors
npm run tsc --noEmit

# Check for P2P logs in real-time
adb logcat | grep -i "p2p\|wifi\|qr code\|transfer"

# Check camera permissions
adb shell dumpsys package com.spred | grep -i camera

# Monitor app performance
adb shell top | grep spred

# Check file transfers (on device)
adb shell ls -la /sdcard/Android/data/com.spred/files/
```

---

## ✅ Success Criteria

Your P2P implementation is working if:

1. **QR Code Generation:**
   - ✅ Generates valid JSON data
   - ✅ Contains device info (id, name, type, timestamp, role)
   - ✅ Displays as scannable QR code

2. **QR Code Scanning:**
   - ✅ Opens camera successfully
   - ✅ Scans and parses QR data
   - ✅ Handles invalid QR codes

3. **Service Management:**
   - ✅ Initializes sender/receiver correctly
   - ✅ Starts discovery
   - ✅ Cleans up on unmount

4. **UI/UX:**
   - ✅ Auto-selects shared video
   - ✅ Shows correct status badges
   - ✅ Displays progress accurately
   - ✅ Handles errors gracefully

5. **Physical Device (Real P2P):**
   - ✅ Discovers nearby devices
   - ✅ Establishes Wi-Fi Direct connection
   - ✅ Transfers files successfully
   - ✅ Shows accurate progress and speed

---

## 📝 Next Steps

After completing these tests:

1. **If all tests pass on emulator:**
   - Document results
   - Test on physical devices
   - Optimize performance

2. **If tests fail:**
   - Note specific failures
   - Check console logs
   - Review implementation
   - Fix issues and retest

3. **For production:**
   - Test with various file sizes
   - Test in different network conditions
   - Add error recovery mechanisms
   - Implement retry logic
   - Add transfer history

---

## 🚀 Start Testing Now!

Begin with **Test 1** (QR Code Generation) since your app is already running on the emulator!

