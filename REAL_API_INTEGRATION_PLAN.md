# Real API Integration Plan

## Current Status: Google Nearby API Deprecation

**Important Update**: Google's Nearby API has been deprecated as of January 2021. The recommended alternatives are:

### 1. Google Nearby Share (Android Only)
- Built into Android 6.0+
- Uses system-level sharing intents
- Limited programmatic control

### 2. Nearby Connections API
- Part of Google Play Services
- Cross-platform (Android/iOS)
- More complex but more powerful
- Package: `@react-native-google-nearby/connections`

### 3. WiFi Direct (Current Implementation)
- Already implemented in the app
- Android-focused
- Good device discovery

## Recommended Approach: Hybrid Solution

Instead of replacing our current implementation entirely, we should create a **hybrid approach** that combines:

1. **Enhanced WiFi Direct** (current P2P implementation)
2. **Nearby Connections API** (for better cross-platform support)
3. **QR Code Fallback** (already implemented)

## Implementation Strategy

### Phase 1: Install Nearby Connections API
```bash
npm install @react-native-google-nearby/connections
npm install react-native-nearby-connections
```

### Phase 2: Update NearbyService
- Replace mock implementation with real Nearby Connections API
- Keep fallback to WiFi Direct for unsupported devices
- Maintain QR code as final fallback

### Phase 3: Enhanced Integration
- Improve device discovery reliability
- Add better error handling
- Implement automatic method selection

## Alternative Packages to Consider

1. **react-native-nearby-connections**
   - Community maintained
   - Wraps Google's Nearby Connections API
   - Good documentation

2. **react-native-multipeer-connectivity** (iOS)
   - iOS equivalent to Nearby Connections
   - Apple's native peer-to-peer framework

3. **Custom WebRTC Implementation**
   - Universal cross-platform solution
   - More complex but very reliable
   - Good for larger files

## Next Steps

1. Research and test available packages
2. Choose the best combination for our use case
3. Implement real API calls
4. Test with actual devices
5. Maintain backward compatibility

## Files to Update

- `src/services/NearbyService.ts` - Replace mock with real API
- `src/services/CrossPlatformSharingService.ts` - Update method selection logic
- `android/app/src/main/AndroidManifest.xml` - Add new permissions
- `ios/Spred/Info.plist` - Add iOS permissions
- `package.json` - Add new dependencies