# Real API Integration Testing Guide

## 🎉 Integration Complete!

The SPRED app now includes real Google Nearby API integration with the following packages:
- `react-native-multipeer-connectivity` (iOS)
- `expo-nearby-connections` (Android)

## 📱 Current Configuration

### Mode Selection
The app can run in two modes controlled by `src/config/nearbyConfig.ts`:

```typescript
useMockMode: false  // Real API mode (current setting)
useMockMode: true   // Mock mode for testing
```

### Automatic Fallback
If real APIs aren't available, the service automatically falls back to mock mode with a warning.

## 🧪 Testing the Real API Integration

### 1. Test with Single Device (Fallback Mode)
Since you're testing on an emulator, the real APIs may not be fully functional:

1. Navigate to TestNearbySharing screen
2. Run Test 1: UI Sharing Flow
3. Check console logs for:
   - `⚠️ Real Nearby API packages not available, using fallback mode`
   - Mock behavior should activate automatically

### 2. Test with Real Devices (Full API Mode)
To test real API functionality, you need physical devices:

#### Android Testing:
1. Install APK on two Android devices
2. Ensure both devices have:
   - Bluetooth enabled
   - Location services enabled
   - WiFi enabled
3. Grant all permissions when prompted
4. Run tests on both devices simultaneously

#### iOS Testing:
1. Build and install on two iOS devices
2. Ensure Bluetooth and WiFi are enabled
3. Test Multipeer Connectivity functionality

### 3. Expected Behavior Differences

#### Mock Mode (Emulator/Fallback):
- Simulated device discovery after 2 seconds
- Mock devices: "Mock iPhone", "Mock Android"
- Simulated file transfer progress
- No real network communication

#### Real API Mode (Physical Devices):
- Actual device discovery via Bluetooth/WiFi
- Real device names and IDs
- Actual file transfers
- Real network communication

## 🔧 Configuration Options

### Enable Mock Mode for Testing
Edit `src/config/nearbyConfig.ts`:

```typescript
export const defaultNearbyConfig: NearbyConfig = {
  useMockMode: true, // Change to true for testing
  // ... other settings
};
```

### Auto-Development Mode
Uncomment this line to automatically use mock mode in development:

```typescript
// useMockMode: isDevelopment,
```

## 📊 Monitoring Real API Integration

### Console Log Indicators:

#### Real API Initialization:
- `🚀 Initializing Nearby API service...`
- `✅ Multipeer Connectivity initialized` (iOS)
- `✅ Nearby Connections initialized` (Android)

#### Fallback to Mock:
- `⚠️ Real Nearby API packages not available, using fallback mode`
- `🎭 Mock mode: Skipping permission checks`

#### Real Device Discovery:
- `👥 Peer found:` (iOS)
- `🔍 Endpoint found:` (Android)

#### Real Connections:
- `🤝 Peer connected:` (iOS)
- `✅ Connection result:` (Android)

## 🚨 Troubleshooting

### Common Issues:

#### 1. Permissions Denied
**Symptoms**: App crashes or no device discovery
**Solution**: 
- Check Android manifest permissions
- Grant all permissions manually in device settings
- Restart app after granting permissions

#### 2. No Devices Found
**Symptoms**: Discovery starts but no devices appear
**Solution**:
- Ensure both devices are running the app
- Check Bluetooth/WiFi are enabled
- Try restarting discovery
- Check device compatibility

#### 3. Connection Failures
**Symptoms**: Devices found but connection fails
**Solution**:
- Check network connectivity
- Ensure devices are close together (< 10 meters)
- Try restarting both apps
- Check firewall/security settings

#### 4. Package Import Errors
**Symptoms**: Build errors or runtime crashes
**Solution**:
- Run `npm install` to ensure packages are installed
- Clear React Native cache: `npx react-native start --reset-cache`
- Clean and rebuild: `cd android && ./gradlew clean && cd ..`

## 📋 Testing Checklist

### Pre-Testing Setup:
- [ ] Two physical devices available (recommended)
- [ ] Both devices have app installed
- [ ] Bluetooth enabled on both devices
- [ ] WiFi enabled on both devices
- [ ] Location services enabled (Android)
- [ ] All permissions granted

### Test Scenarios:
- [ ] Device discovery works
- [ ] Connection establishment works
- [ ] File transfer initiates
- [ ] Progress tracking works
- [ ] Transfer completion works
- [ ] Error handling works
- [ ] Cleanup works properly

### Fallback Testing:
- [ ] Mock mode activates when real APIs unavailable
- [ ] UI still functions in mock mode
- [ ] No crashes when switching modes
- [ ] Configuration changes work

## 🔄 Next Steps

### Phase 1: Validate Integration ✅
- [x] Install real API packages
- [x] Update NearbyService implementation
- [x] Add configuration system
- [x] Test build process

### Phase 2: Real Device Testing
- [ ] Test on physical Android devices
- [ ] Test on physical iOS devices
- [ ] Validate cross-platform compatibility
- [ ] Performance testing

### Phase 3: Production Readiness
- [ ] Error handling improvements
- [ ] User permission flows
- [ ] Connection reliability
- [ ] File transfer optimization

### Phase 4: Enhanced Features
- [ ] Multiple device support
- [ ] File type validation
- [ ] Transfer resumption
- [ ] Background transfers

## 📁 Modified Files

### New Files:
- `src/config/nearbyConfig.ts` - Configuration management
- `src/services/NearbyService.real.ts` - Real API implementation backup
- `REAL_API_INTEGRATION_PLAN.md` - Integration planning
- `REAL_API_TESTING_GUIDE.md` - This guide

### Updated Files:
- `src/services/NearbyService.ts` - Real API integration
- `android/app/src/main/AndroidManifest.xml` - Bluetooth permissions
- `package.json` - New dependencies

### Dependencies Added:
- `react-native-multipeer-connectivity@0.1.0`
- `expo-nearby-connections@1.0.0`

## 🎯 Success Metrics

The integration is successful when:
1. ✅ App builds without errors
2. ✅ Real APIs initialize on physical devices
3. ✅ Fallback works on emulators
4. ✅ Device discovery functions
5. ✅ File transfers complete
6. ✅ Error handling is robust

**Current Status**: Phase 1 Complete ✅
**Next**: Phase 2 - Real Device Testing