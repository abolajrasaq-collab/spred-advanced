# 🧪 Mock Implementation Testing Instructions

## 🚀 **How to Test the New Nearby API Implementation**

I've created a comprehensive test screen that demonstrates all the new sharing functionality with mock data.

### **📱 Access the Test Screen**

#### **Option 1: Direct Navigation (Recommended)**
Add this code to any screen where you want to test:

```typescript
import { useNavigation } from '@react-navigation/native';

const navigation = useNavigation();

// Add a test button
<TouchableOpacity 
  onPress={() => navigation.navigate('TestNearbySharing')}
  style={{ backgroundColor: '#F45303', padding: 12, borderRadius: 8 }}
>
  <Text style={{ color: 'white', fontWeight: 'bold' }}>Test Nearby API</Text>
</TouchableOpacity>
```

#### **Option 2: Add to Settings Screen**
Add this button to your Settings screen:

```typescript
// In Settings.tsx, add this button
<TouchableOpacity 
  style={styles.settingItem}
  onPress={() => navigation.navigate('TestNearbySharing')}
>
  <MaterialIcons name="science" size={24} color="#F45303" />
  <Text style={styles.settingText}>Test Nearby API</Text>
  <MaterialIcons name="chevron-right" size={24} color="#8B8B8B" />
</TouchableOpacity>
```

#### **Option 3: Temporary Homepage Button**
Add this to your Homepage for quick access:

```typescript
// In Homepage.tsx, add this floating button
<TouchableOpacity 
  style={{
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: '#F45303',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  }}
  onPress={() => navigation.navigate('TestNearbySharing')}
>
  <MaterialIcons name="science" size={24} color="white" />
</TouchableOpacity>
```

---

## 🧪 **Available Tests**

The test screen includes 5 comprehensive tests:

### **Test 1: UI Sharing Flow** 
- Opens the UniversalSharingModal
- Shows complete sharing experience
- Simulates device discovery → connection → transfer
- **Expected**: Modal shows discovery, then mock devices, then transfer progress

### **Test 2: Direct Service Call**
- Calls the sharing service directly (no UI)
- Tests the core API functionality
- **Expected**: Console logs show discovery → connection → transfer completion

### **Test 3: Receiver Mode**
- Starts/stops receiver mode
- Tests background listening functionality
- **Expected**: Service starts advertising and listening for connections

### **Test 4: QR Code Processing**
- Tests QR code fallback functionality
- Processes mock QR data
- **Expected**: Successfully processes QR and simulates download

### **Test 5: Service Cleanup**
- Tests proper resource cleanup
- Stops all services and clears state
- **Expected**: All services stop, state resets

---

## 📊 **What You'll See**

### **Real-Time State Display**
The test screen shows live updates of:
- Is Sharing: Yes/No
- Is Receiving: Yes/No  
- Current Method: nearby/qr_fallback
- Status: Current operation status
- Devices Found: Number of discovered devices
- Errors: Any error messages

### **Mock Behavior Timeline**

#### **Test 1 (UI Flow)**:
```
0s: "Looking for nearby devices..."
2s: "Connecting to John's iPhone..."
4s: "Sending video... 0%"
4.5s: "Sending video... 10%"
5s: "Sending video... 20%"
...
9s: "Sending video... 100%"
9.5s: "Video sent successfully!"
```

#### **Test 2 (Service Only)**:
```
Console Output:
🚀 Starting cross-platform video sharing
📡 Attempting Nearby API sharing
🔗 Attempting to connect to: John's iPhone
📤 Sending file to device: John's iPhone
📊 Transfer progress: 10%
📊 Transfer progress: 20%
...
✅ File sent successfully
```

---

## 🔍 **Console Monitoring**

### **Key Log Messages to Watch For**:

#### **Service Initialization**:
```
🚀 Initializing Nearby API service...
✅ Nearby API service initialized successfully
```

#### **Device Discovery**:
```
🔍 Starting device discovery...
📱 Mock devices discovered: 2
```

#### **Connection Process**:
```
🔗 Connecting to device: John's iPhone
✅ Connected to device successfully: John's iPhone
```

#### **File Transfer**:
```
📤 Sending file to device: John's iPhone /mock/path/test-video.mp4
📊 Transfer progress: 45%
✅ File sent successfully
```

#### **State Updates**:
```
🔄 NearbyService state updated: { isDiscovering: true }
🔄 CrossPlatformSharing state updated: { currentMethod: 'nearby' }
```

---

## ✅ **Expected Results**

### **Successful Test Indicators**:

1. **Test 1**: Modal opens → Shows discovery → Shows mock devices → Shows progress → Shows success
2. **Test 2**: Console shows complete flow → Alert shows success with method/duration
3. **Test 3**: Receiver mode starts → State shows "isReceiving: true"
4. **Test 4**: QR processing succeeds → Shows mock download simulation
5. **Test 5**: All services stop → State resets to initial values

### **Mock Data Used**:
- **Mock Devices**: "John's iPhone", "Sarah's Android"
- **Mock Video**: "/mock/path/test-video.mp4" (50MB)
- **Mock Transfer Speed**: 2 MB/s
- **Mock Duration**: ~10 seconds total

---

## 🎯 **Testing Scenarios**

### **Scenario 1: Happy Path (Nearby Success)**
1. Run Test 1
2. Watch modal progress through all states
3. Should complete with "nearby" method

### **Scenario 2: QR Fallback**
The current mock always succeeds with Nearby API. To test QR fallback, you can modify the mock in `NearbyService.ts`:

```typescript
// In simulateDeviceDiscovery(), comment out the mock devices:
private simulateDeviceDiscovery() {
  // const mockDevices: NearbyDevice[] = []; // Empty array = no devices found
  // This will trigger QR fallback
}
```

### **Scenario 3: Error Handling**
Modify the mock to simulate errors and test error states.

---

## 🔧 **Customizing the Tests**

### **Change Mock Timing**:
In `NearbyService.ts`, adjust timeouts:
```typescript
// Faster discovery (1 second instead of 2)
setTimeout(() => {
  this.simulateDeviceDiscovery();
}, 1000);

// Faster transfer (100ms intervals instead of 500ms)
await new Promise(resolve => setTimeout(resolve, 100));
```

### **Add More Mock Devices**:
```typescript
const mockDevices: NearbyDevice[] = [
  { id: 'device_1', name: 'John\'s iPhone', distance: 5, status: 'discovered' },
  { id: 'device_2', name: 'Sarah\'s Android', distance: 8, status: 'discovered' },
  { id: 'device_3', name: 'Mike\'s iPad', distance: 12, status: 'discovered' },
];
```

---

## 🎉 **Success Criteria**

The mock implementation is working correctly if:

- ✅ Test screen loads without errors
- ✅ All 5 tests can be executed
- ✅ State updates are visible in real-time
- ✅ Console logs show expected flow
- ✅ Modal UI progresses through all states
- ✅ No crashes or unhandled errors
- ✅ Services can be started/stopped cleanly

---

## 🚀 **Next Steps After Testing**

Once the mock implementation works well:

1. **Install real packages**: `npm install react-native-nearby-api`
2. **Replace mock functions** with real API calls
3. **Test on physical devices** (Android + iOS)
4. **Integrate with PlayVideos** screen
5. **Deploy to production**

The mock implementation gives you a complete preview of how the real system will work!