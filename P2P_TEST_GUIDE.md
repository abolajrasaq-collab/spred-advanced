# P2P/Wi-Fi Direct Testing Guide

## Overview
This guide will help you test the P2P file sharing and Wi-Fi Direct implementation in the SPRED app.

## Prerequisites
- ✅ Two Android devices OR one device + one emulator
- ✅ Both devices on Android 4.0+ (API 14+)
- ✅ Wi-Fi enabled on both devices
- ✅ Location permissions granted (required for Wi-Fi Direct on Android 6+)

## Test Setup

### Option 1: Two Physical Devices (Recommended)
1. Install the app on both devices
2. Enable Wi-Fi on both
3. Keep devices close to each other (within 200 feet)

### Option 2: One Device + One Emulator
**Note:** Wi-Fi Direct does NOT work between emulator and physical device. This setup will test the UI and QR code pairing only.

## Testing Scenarios

### Test 1: QR Code Pairing ✅

#### On Sender Device:
1. Open a video in PlayVideos screen
2. Tap the SPRED share icon
3. Video should be auto-selected (green border)
4. Tap "Show QR" button
5. ✅ **Expected:** QR code modal appears with device info
6. Check console logs for: `🔍 Show QR button pressed` and `🔍 QR Code Data: {...}`

#### On Receiver Device:
1. Navigate to SPRED Share
2. Tap "Receive" tab
3. Tap "Scan QR Code" button
4. ✅ **Expected:** Camera opens and is ready to scan
5. Point camera at sender's QR code
6. ✅ **Expected:** QR code is scanned and devices attempt to connect
7. Check console logs for: `✅ QR code scanned successfully`

---

### Test 2: Device Discovery

#### On Sender Device:
1. Go to SPRED Share → Send tab
2. Select a video
3. ✅ **Expected:** Shows "Discoverable" badge in header
4. Check console logs for: `🔧 Initializing Sender P2P Service...`

#### On Receiver Device:
1. Go to SPRED Share → Receive tab
2. ✅ **Expected:** "Searching for nearby devices..." appears
3. Wait 5-10 seconds
4. ✅ **Expected:** Nearby devices appear in the list
5. Check console logs for: `📱 Receiver discovered devices: [...]`

**If devices don't appear:**
- Ensure both devices have Wi-Fi enabled
- Check location permissions are granted
- Try moving devices closer together
- Restart Wi-Fi on both devices

---

### Test 3: Manual Device Connection

#### On Receiver Device:
1. From discovered devices list, tap on sender device
2. ✅ **Expected:** Connection request sent
3. Check console logs for: `📡 Attempting to pair with device: {device_name}`

#### On Sender Device:
1. ✅ **Expected:** Connection notification appears
2. Connection should be established automatically
3. Check console logs for: `✅ Sender connected to receiver: {device_name}`

---

### Test 4: File Transfer - Send

#### On Sender Device (after connection):
1. Select a video from the list
2. Tap the video item to send
3. ✅ **Expected:** "Sending files..." section appears
4. ✅ **Expected:** Progress bar shows transfer progress (0-100%)
5. ✅ **Expected:** Transfer speed and file size displayed
6. Check console logs for:
   - `📤 Sender transfer started: {transfer_info}`
   - `📊 Sender transfer progress: {percentage}%`
   - `✅ Sender transfer completed: {transfer_info}`

---

### Test 5: File Transfer - Receive

#### On Receiver Device (during transfer):
1. ✅ **Expected:** "Receiving files..." section appears automatically
2. ✅ **Expected:** Progress bar shows transfer progress
3. ✅ **Expected:** Shows sender device info and file details
4. ✅ **Expected:** Transfer speed displayed
5. After completion:
   - File moves to "Received Files" section
   - Success notification appears
6. Check console logs for:
   - `📥 Receiver transfer started: {transfer_info}`
   - `📊 Receiver transfer progress: {percentage}%`
   - `✅ Receiver transfer completed: {transfer_info}`

---

### Test 6: Multiple File Transfers

1. Send another file while one is transferring
2. ✅ **Expected:** Queue system handles multiple transfers
3. ✅ **Expected:** Each transfer shows individual progress
4. Check console logs for queue management

---

### Test 7: Transfer Cancellation

#### On Sender:
1. Start a file transfer
2. Tap "Cancel" or close the screen
3. ✅ **Expected:** Transfer stops
4. Check console logs for: `❌ Transfer cancelled`

#### On Receiver:
1. During incoming transfer, try to cancel
2. ✅ **Expected:** Transfer stops, partial file discarded

---

### Test 8: Disconnect & Reconnect

1. Disconnect devices (tap "Disconnect All" on sender)
2. ✅ **Expected:** Both devices show disconnected state
3. Reconnect using QR code or device list
4. ✅ **Expected:** Connection re-established successfully
5. Try sending another file

---

## Console Logs to Monitor

### Sender Device Logs:
```
🔧 Initializing Sender P2P Service...
✅ Sender P2P Service initialized
📱 Sender discovered devices: [...]
✅ Sender connected to receiver: {device_name}
📤 Sender transfer started: {...}
📊 Sender transfer progress: {percentage}%
✅ Sender transfer completed: {...}
```

### Receiver Device Logs:
```
🔧 Initializing Receiver P2P Service...
✅ Receiver P2P Service initialized
📱 Receiver discovered devices: [...]
✅ Receiver connected to sender: {device_name}
📥 Receiver transfer started: {...}
📊 Receiver transfer progress: {percentage}%
✅ Receiver transfer completed: {...}
```

### QR Code Logs:
```
🔍 Show QR button pressed
🔍 QR Code Modal - showQRModal: true
🔍 QR Code Data: {"id":"...","name":"...","type":"Android","timestamp":...,"role":"sender"}
✅ QR code scanned successfully: {...}
```

---

## Known Limitations (Emulator Testing)

⚠️ **Emulator Limitations:**
1. Wi-Fi Direct does NOT work between emulator and physical device
2. Wi-Fi Direct does NOT work between two emulators
3. You can only test:
   - UI/UX flow
   - QR code generation and scanning simulation
   - State management
   - Error handling

**For real P2P testing, you MUST use two physical Android devices.**

---

## Troubleshooting

### Issue: Devices not discovering each other
**Solutions:**
1. Ensure Wi-Fi is enabled (not Wi-Fi Direct, just Wi-Fi)
2. Grant location permissions on Android 6+
3. Move devices closer (within 30 feet for initial connection)
4. Restart Wi-Fi on both devices
5. Check if Wi-Fi Direct is supported: Settings → Wi-Fi → Wi-Fi Direct

### Issue: Connection fails
**Solutions:**
1. Check console logs for error messages
2. Ensure only one device is sender, one is receiver
3. Try QR code pairing instead of manual discovery
4. Restart the app on both devices

### Issue: Transfer stuck at 0%
**Solutions:**
1. Check file permissions
2. Ensure video file exists and is accessible
3. Check available storage on receiver device
4. Review console logs for transfer errors

### Issue: QR code not scanning
**Solutions:**
1. Ensure camera permission is granted
2. Check adequate lighting
3. Hold camera steady, 6-12 inches from QR code
4. Check console logs for camera errors

---

## Success Criteria ✅

A successful P2P implementation should:
- ✅ Generate valid QR codes with device info
- ✅ Scan QR codes and parse device data
- ✅ Discover nearby devices automatically
- ✅ Establish connections between sender/receiver
- ✅ Transfer files with progress tracking
- ✅ Show accurate transfer speed and ETA
- ✅ Handle multiple simultaneous transfers
- ✅ Gracefully handle disconnections
- ✅ Support cancellation and retry
- ✅ Auto-select shared video from PlayVideos

---

## Automated Testing Commands

Run these commands to check for errors:

```bash
# Check for TypeScript errors
npm run tsc --noEmit

# Check for linting issues
npm run lint

# Run unit tests (if available)
npm test

# Check P2P service initialization
adb logcat | grep "P2P Service"

# Monitor transfer events
adb logcat | grep "transfer"
```

---

## Test Results Template

Use this template to document your test results:

```
## Test Session: [Date/Time]

### Test 1: QR Code Pairing
- Status: [ ] Pass [ ] Fail
- Notes: 

### Test 2: Device Discovery
- Status: [ ] Pass [ ] Fail
- Devices found: 
- Time to discover: 
- Notes:

### Test 3: Connection
- Status: [ ] Pass [ ] Fail
- Connection time: 
- Notes:

### Test 4: File Transfer
- Status: [ ] Pass [ ] Fail
- File size: 
- Transfer speed: 
- Transfer time: 
- Notes:

### Test 5: Multiple Transfers
- Status: [ ] Pass [ ] Fail
- Number of files: 
- Notes:

### Issues Found:
1. 
2. 
3. 

### Overall Result: [ ] All Tests Passed [ ] Some Tests Failed
```

---

## Next Steps After Testing

If tests pass:
- ✅ Document any performance metrics
- ✅ Test with larger files (500MB+)
- ✅ Test with different file types
- ✅ Test in different network conditions
- ✅ Prepare for production build

If tests fail:
- Review console logs for errors
- Check Wi-Fi Direct permissions
- Verify native module integration
- Test with physical devices if using emulator
- Report specific errors for debugging

