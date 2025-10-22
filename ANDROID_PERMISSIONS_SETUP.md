# Android Permissions Setup for Real File Share

## Required Permissions

Add these permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- WiFi and Network Permissions -->
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

<!-- Location Permissions (required for WiFi on Android 6+) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- System Settings (for hotspot creation) -->
<uses-permission android:name="android.permission.WRITE_SETTINGS" />

<!-- File System Access -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Internet (for HTTP server) -->
<uses-permission android:name="android.permission.INTERNET" />
```

## Complete AndroidManifest.xml Example

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- File Share Permissions -->
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.WRITE_SETTINGS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Your existing permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <!-- ... other permissions ... -->

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme">
        
        <!-- Your activities -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme">
            <!-- ... -->
        </activity>
    </application>
</manifest>
```

## Testing Permissions

The `HotspotManager` will automatically:
1. Check if permissions are granted
2. Request missing permissions
3. Provide user-friendly error messages

## Troubleshooting

### "Location permission required"
- Android requires location permission to access WiFi networks
- This is a system requirement, not an app bug

### "Hotspot not supported"
- Some devices/manufacturers disable hotspot APIs
- Test on different devices if possible

### "Write settings permission"
- May require manual approval in device settings
- The app will guide users to the settings page

## iOS Considerations

iOS doesn't support programmatic hotspot creation. Users must:
1. Go to Settings → Personal Hotspot
2. Enable "Allow Others to Join"
3. Note the network name and password
4. Use those credentials in the app

The app will detect iOS and show appropriate instructions.