# 🧪 Quick Test Guide - Device Persistence Fix

## ✅ **APK Ready for Testing**

**Updated APK**: `android/app/build/outputs/apk/release/app-release.apk`  
**Size**: 32.25 MB  
**Build Time**: Just completed with device persistence fixes

---

## 🚀 **Installation & Testing**

### **Step 1: Install Updated APK**

**Method 1: Manual Transfer**
1. Copy `android/app/build/outputs/apk/release/app-release.apk` to both devices
2. Install on each device (enable "Install from Unknown Sources")

**Method 2: Cloud Transfer**
1. Upload APK to Google Drive/Dropbox
2. Download and install on both devices

### **Step 2: Test Device Persistence**

#### **Device 1 (Sender)**
1. Open SPRED app
2. Navigate to any video
3. Tap SPRED share icon (top right)
4. Video should auto-select with green border
5. **Watch for**: "Discoverable" status indicator

#### **Device 2 (Receiver)**
1. Open SPRED app  
2. Navigate to SPRED Share → Receive
3. Should show "Searching for nearby devices..."
4. **Watch for**: Device 1 should appear in list

### **Step 3: Verify Persistence**

**Expected Behavior (FIXED)**:
- ✅ Device 1 appears in Device 2's list within 5-15 seconds
- ✅ Device 1 stays visible for 30+ seconds (no disappearing!)
- ✅ Device refreshes every 5 seconds but stays in list
- ✅ Multiple devices can be discovered simultaneously
- ✅ Stable connection attempts

**Old Behavior (BROKEN)**:
- ❌ Device appears for 1-2 seconds then disappears
- ❌ Device keeps flickering in and out of list
- ❌ Unstable connection attempts

---

## 📊 **What to Monitor**

### **Console Logs (If Available)**
Look for these improved log messages:
```
📱 Peers update received: 1 devices
📱 Merged device list: 1 total devices
🔄 P2PService: Refreshing peer list...
🔄 P2PService: Found 1 peers during refresh
💓 P2PService: Keeping 1 devices alive
```

### **UI Indicators**
- **Green dot**: Device available and ready
- **Device name**: Should stay visible consistently
- **Status text**: "Available" should persist
- **No flickering**: List should be stable

---

## 🔧 **Testing Scenarios**

### **Scenario 1: Basic Discovery**
1. Start both apps
2. Wait 15 seconds
3. **Result**: Devices should discover and stay visible

### **Scenario 2: Connection Test**
1. After devices are discovered
2. Tap on discovered device to connect
3. **Result**: Connection should be more stable

### **Scenario 3: QR Code Backup**
If discovery is still unstable:
1. Device 1: Tap "Show QR" button
2. Device 2: Tap "Scan QR" button
3. Scan the QR code
4. **Result**: Direct connection bypassing discovery

---

## ✅ **Success Criteria**

The fix is working if:
- [x] Devices appear in discovery list
- [x] Devices stay visible for 30+ seconds
- [x] No constant disappearing/reappearing
- [x] Connection attempts are stable
- [x] Multiple devices can be seen at once

---

## 🐛 **If Issues Persist**

### **Troubleshooting Steps**:

1. **Check Permissions** (Both Devices):
   - Settings → Apps → SPRED → Permissions
   - Enable: Location, Camera, Storage, Nearby devices

2. **Verify System Settings** (Both Devices):
   - WiFi: ON
   - Location: ON (High accuracy)
   - WiFi Hotspot: OFF

3. **Distance & Environment**:
   - Keep devices within 30 feet
   - Avoid areas with heavy WiFi interference
   - Try different locations

4. **App Restart**:
   - Force close SPRED app on both devices
   - Restart and try again

### **Alternative Solutions**:

If discovery is still problematic:
- **Use QR Code Pairing**: More reliable than discovery
- **Check Device Compatibility**: Some older devices have WiFi Direct issues
- **Try Different Devices**: Test with known working Android devices

---

## 📞 **Report Results**

After testing, please report:

### **Working Scenario**:
- ✅ Devices discovered successfully
- ✅ Devices stayed visible for 30+ seconds
- ✅ Connection established
- ✅ File transfer completed

### **Issues Found**:
- ❌ Specific error messages
- ❌ Device models and Android versions
- ❌ Steps that failed
- ❌ Console logs (if available)

---

## 🎯 **Expected Outcome**

With the device persistence fix applied, you should now have:
- **Stable device discovery** - No more disappearing devices
- **Better user experience** - Consistent device list
- **Reliable connections** - More successful pairing
- **Improved performance** - Faster refresh cycles

The device discovery should now work much more reliably! 🎉

---

## 📝 **Next Steps After Testing**

1. **If successful**: Proceed with file transfer testing
2. **If issues remain**: Try QR code pairing as backup
3. **Document results**: Note any remaining issues
4. **Production ready**: If stable, ready for wider testing

Good luck with testing! The device persistence should be much improved now.