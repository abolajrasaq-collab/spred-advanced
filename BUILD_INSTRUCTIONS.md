# SPRED Production APK Build Instructions

This document provides instructions for building a production APK for the SPRED application.

## Prerequisites

Before building the production APK, you need:

1. Node.js (v18 or higher)
2. Android Studio and Android SDK
3. Java Development Kit (JDK)
4. Android SDK Build Tools
5. Android NDK (if required for native modules)

## Steps to Build Production APK

### Method 1: Using the Automated Scripts

1. **Create the Release Keystore** (only needed once):
   ```bash
   # On Windows
   create-release-keystore.bat
   ```

2. **Build the Production APK**:
   ```bash
   # On Windows
   build-production-apk.bat
   ```

### Method 2: Manual Build Process

1. **Navigate to the project directory**:
   ```bash
   cd E:\AI\VERSIONS\Spredbolarv1\spred-android1
   ```

2. **Create the release keystore** (if not already done):
   ```bash
   cd android\app
   keytool -genkey -v -keystore release.keystore -alias spredReleaseKey -keyalg RSA -keysize 2048 -validity 10000 -storepass SpredRelease2024! -keypass SpredRelease2024! -dname "CN=Spred, OU=Development, O=SPRED, L=Lagos, ST=Lagos, C=NG"
   cd ..
   ```

3. **Clean previous builds**:
   ```bash
   ./gradlew clean
   ```

4. **Build the release APK**:
   ```bash
   ./gradlew assembleRelease
   ```

## Important Information

### Keystore Credentials (for reference)
- **Keystore file**: `android/app/release.keystore`
- **Keystore password**: `SpredRelease2024!`
- **Key alias**: `spredReleaseKey`
- **Key password**: `SpredRelease2024!`

### Generated APK Location
After successful build, the APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Installing the APK
To install the APK on an Android device:

1. Enable Developer Options and USB Debugging on your device
2. Connect your device via USB
3. Run: `adb install android/app/build/outputs/apk/release/app-release.apk`
4. Or transfer the APK file to your device and install manually

## Troubleshooting

### Common Issues:

1. **Gradle build fails**: Make sure you have sufficient disk space and memory
2. **Build tools version errors**: Ensure your Android SDK has the required build tools
3. **Keystore errors**: Verify the keystore file exists in the correct location

### Performance Notes:
- The production APK will be larger than debug APK due to included resources
- Build can take several minutes depending on your system
- Make sure to test the APK on multiple devices before distribution

## Security Considerations

- Keep the keystore file secure and backed up
- Don't share keystore credentials in public repositories
- Consider using more complex passwords for production releases

## Additional Features

This build includes:
- Optimized for multiple CPU architectures (arm64-v8a, armeabi-v7a, x86_64, x86)
- Proguard enabled for code minification and obfuscation
- Support for 16KB page size devices
- Android 12+ compatibility
- P2P file transfer functionality

## Verification

After building:
1. Check that the APK size is reasonable (typically 30-60 MB for React Native apps)
2. Verify that the app opens without immediate crashes
3. Test core functionality like WiFi Direct if applicable
4. Check that all assets and icons are properly included