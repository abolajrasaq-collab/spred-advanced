# Wi-Fi Direct P2P Transfer Dependencies

To enable cross-platform Wi-Fi Direct file transfer in SPRED, install the following dependencies:

## Required Dependencies

### 1. P2P File Transfer (Android Wi-Fi Direct)
```bash
npm install p2p-file-transfer
```

### 2. Transfer Big Files (Cross-platform)
```bash
npm install @arekjaar/react-native-transfer-big-files
```

### 3. React Native File System
```bash
npm install react-native-fs
```

### 4. QR Code Components (Already installed)
- `react-native-qrcode-svg`
- `react-native-qrcode-scanner`

## Platform-Specific Setup

### Android Setup

1. **Add permissions to `android/app/src/main/AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
```

2. **Add Wi-Fi Direct features:**
```xml
<uses-feature android:name="android.hardware.wifi.direct" android:required="true" />
```

### iOS Setup

1. **Add permissions to `ios/SPRED/Info.plist`:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs location access to discover nearby devices for file sharing.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs location access to discover nearby devices for file sharing.</string>
```

### React Native Setup

1. **Link native modules:**
```bash
npx react-native link p2p-file-transfer
npx react-native link @arekjaar/react-native-transfer-big-files
npx react-native link react-native-fs
```

2. **For React Native 0.60+, auto-linking should handle the linking automatically.**

## Usage

The Wi-Fi Direct transfer system is now integrated into the SPRED sharing flow:

1. **From PlayVideos screen**: Press SPRED button → Choose "Wi-Fi Direct" option
2. **Direct navigation**: Navigate to `SpredShareNavigator` with `WiFiDirectTransfer` screen
3. **Cross-platform**: Works on Android, iOS, and PC devices

## Features

- ✅ **Cross-platform compatibility**: Android, iOS, PC
- ✅ **Wi-Fi Direct support**: Native Android Wi-Fi Direct
- ✅ **Network fallback**: Uses local network when Wi-Fi Direct unavailable
- ✅ **Real-time progress**: Transfer progress tracking
- ✅ **Device discovery**: Automatic nearby device detection
- ✅ **QR code pairing**: Alternative connection method
- ✅ **Group management**: Create/join transfer groups
- ✅ **File validation**: Size and format checking
- ✅ **Error handling**: Comprehensive error recovery

## Testing

1. **Install dependencies** listed above
2. **Run the app** on multiple devices
3. **Test Wi-Fi Direct transfer** between devices
4. **Verify cross-platform compatibility**

## Troubleshooting

- **Permission issues**: Ensure all permissions are granted
- **Wi-Fi Direct not working**: Check if device supports Wi-Fi Direct
- **Network issues**: Ensure devices are on same network
- **File transfer fails**: Check file permissions and storage space
