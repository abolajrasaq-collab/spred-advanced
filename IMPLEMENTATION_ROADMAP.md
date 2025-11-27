# 🎯 WiFi P2P Video Sharing - Implementation Roadmap

## Project: spred (React Native + Android)

---

## ✅ Phase 1: Native Module Setup (Day 1-2)

### 1. Create Package Registration
```bash
# Create: android/app/src/main/java/com/spred/WifiP2PPackage.java
```
```java
package com.spred;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class WifiP2PPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new WifiP2PModule(reactContext));
        return modules;
    }
}
```

### 2. Register in MainActivity
```java
// Add to android/app/src/main/java/com/spred/MainActivity.java
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.asList(
        new MainReactPackage(),
        new WifiP2PPackage()  // Add this
    );
}
```

### 3. Add ZXing Dependencies
```gradle
// android/app/build.gradle
dependencies {
    implementation 'com.google.zxing:core:3.5.1'
    implementation 'com.journeyapps:zxing-android-embedded:4.3.0'
    implementation 'androidx.camera:camera-camera2:1.3.1'
}
```

---

## 📱 Phase 2: React Native Integration (Day 3-4)

### 1. Create TypeScript Definitions
```typescript
// src/services/WifiP2PService.ts
import { NativeModules } from 'react-native';

interface WifiP2PModule {
  createHotspot(videoId: string): Promise<{ qrData: string; deviceInfo: string }>;
  connectToHotspot(qrData: string): Promise<{ deviceInfo: string; status: string }>;
  startVideoTransfer(videoPath: string): Promise<{ filePath: string }>;
  receiveVideo(): Promise<{ filePath: string }>;
  cleanup(): void;
}

const { WifiP2PModule } = NativeModules;
export default WifiP2PModule as WifiP2PModule;
```

### 2. Create Share Screen
```typescript
// src/screens/ShareVideoScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, Image } from 'react-native';
import WifiP2PService from '../services/WifiP2PService';

const ShareVideoScreen = () => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const startSharing = async (videoId: string) => {
    try {
      const result = await WifiP2PService.createHotspot(videoId);
      setQrCode(result.qrData);
      
      // Listen for transfer progress
      DeviceEventEmitter.addListener('VideoTransferProgress', (progress: number) => {
        setProgress(progress);
      });
      
      // Start transfer
      const transferResult = await WifiP2PService.startVideoTransfer(videoId);
      console.log('Transfer complete:', transferResult.filePath);
      
    } catch (error) {
      console.error('Sharing failed:', error);
    }
  };

  return (
    <View>
      {qrCode ? (
        <Image source={{ uri: qrCode }} style={{ width: 300, height: 300 }} />
      ) : (
        <Button title="Start Sharing" onPress={() => startSharing('video123')} />
      )}
      {progress > 0 && <Text>Transfer Progress: {progress}%</Text>}
    </View>
  );
};

export default ShareVideoScreen;
```

### 3. Create Receive Screen
```typescript
// src/screens/ReceiveVideoScreen.tsx
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { launchCamera } from 'react-native-image-picker';
import WifiP2PService from '../services/WifiP2PService';

const ReceiveVideoScreen = () => {
  const [isReceiving, setIsReceiving] = useState(false);
  const [progress, setProgress] = useState(0);

  const startReceiving = async () => {
    setIsReceiving(true);
    
    try {
      // Listen for receive progress
      DeviceEventEmitter.addListener('VideoReceiveProgress', (progress: number) => {
        setProgress(progress);
      });
      
      // Start receiving
      const result = await WifiP2PService.receiveVideo();
      console.log('Received video:', result.filePath);
      
    } catch (error) {
      console.error('Receive failed:', error);
      setIsReceiving(false);
    }
  };

  return (
    <View>
      <Button 
        title={isReceiving ? "Receiving..." : "Scan QR & Receive"} 
        onPress={startReceiving}
        disabled={isReceiving}
      />
      {progress > 0 && <Text>Download Progress: {progress}%</Text>}
    </View>
  );
};

export default ReceiveVideoScreen;
```

---

## 🔧 Phase 3: Implement Core WiFi P2P (Day 5-7)

### 1. Create WifiP2PManager Class
```bash
# Create: android/app/src/main/java/com/spred/wifip2p/WifiP2PManager.java
```
This is the main class that will:
- Initialize WifiP2pManager
- Create hotspot
- Handle device discovery
- Manage connections

### 2. Create Broadcast Receiver
```bash
# Create: android/app/src/main/java/com/spred/wifip2p/WiFiDirectBroadcastReceiver.java
```
Handles WiFi P2P state changes

### 3. Add QR Code Generation
```bash
# Create: android/app/src/main/java/com/spred/wifip2p/QRCodeGenerator.java
```
Uses ZXing to create QR codes

---

## 📦 Phase 4: File Transfer (Day 8-10)

### 1. Create VideoTransferServer
```bash
# Create: android/app/src/main/java/com/spred/wifip2p/VideoTransferServer.java
```
TCP server for sending videos

### 2. Create VideoReceiveClient
```bash
# Create: android/app/src/main/java/com/spred/wifip2p/VideoReceiveClient.java
```
TCP client for receiving videos

---

## 🧪 Phase 5: Testing (Day 11-12)

### Test Scenarios:
1. ✓ Device A creates hotspot
2. ✓ Device A generates QR code
3. ✓ Device B scans QR code
4. ✓ Device B connects
5. ✓ Device A transfers video
6. ✓ Device B receives video
7. ✓ Progress updates work
8. ✓ Video plays after transfer

---

## 📋 File Checklist

### Native Module Files:
- [ ] WifiP2PModule.java (✅ Created)
- [ ] WifiP2PPackage.java
- [ ] WifiP2PManager.java
- [ ] WiFiDirectBroadcastReceiver.java
- [ ] QRCodeGenerator.java
- [ ] VideoTransferServer.java
- [ ] VideoReceiveClient.java

### React Native Files:
- [ ] src/services/WifiP2PService.ts
- [ ] src/screens/ShareVideoScreen.tsx
- [ ] src/screens/ReceiveVideoScreen.tsx
- [ ] src/types/WifiP2P.ts

---

## 🚀 Quick Start Commands

```bash
# 1. Create Native Module files
mkdir -p android/app/src/main/java/com/spred/wifip2p

# 2. Add dependencies
cd android && ./gradlew app:dependencies | grep zxing

# 3. Build APK
cd ../ && npm run android

# 4. Install on devices
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📚 Resources

- [React Native Native Modules](https://reactnative.dev/docs/native-modules-android)
- [Android WiFi P2P](https://developer.android.com/guide/topics/connectivity/wifip2p)
- [ZXing QR Codes](https://github.com/zxing/zxing)
- [Xender Reference Code](Xender_v17.0.0.prime_decompiled/)

---

## 💡 Tips

1. **Start Simple**: First get hotspot creation working, then add QR codes
2. **Test Early**: Test on real devices, not just emulator
3. **Check Logs**: Use `adb logcat` to debug WiFi P2P
4. **Permissions**: All permissions are already in manifest ✅
5. **Reference Xender**: Study their implementation for patterns

---

## ✅ Success Criteria

Your app works when:
- [ ] Two devices connect via WiFi P2P
- [ ] QR code generated and scanned
- [ ] Video transfers successfully
- [ ] Progress updates in UI
- [ ] Received video plays

---

**Ready to start?** Begin with Phase 1! 🚀
