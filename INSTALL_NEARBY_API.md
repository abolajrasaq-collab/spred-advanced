# 📦 Google Nearby API Installation Guide

## Required Packages

Run these commands to install the necessary packages:

```bash
# Core Nearby API package
npm install react-native-nearby-api

# Additional dependencies
npm install react-native-qrcode-svg
npm install react-native-permissions

# iOS setup (if building for iOS)
cd ios && pod install
```

## Android Permissions

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Nearby API permissions -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />

<!-- File access permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## iOS Permissions

Add these to `ios/Spred/Info.plist`:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>SPRED uses local network to share videos with nearby devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>SPRED uses Bluetooth to discover nearby devices for video sharing</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>SPRED uses Bluetooth to share videos with nearby devices</string>
```

## Next Steps

After installation, the new NearbyService will be implemented to replace the current P2P implementation.