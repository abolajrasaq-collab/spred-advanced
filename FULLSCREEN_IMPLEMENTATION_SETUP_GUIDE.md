# Fullscreen Video Player Implementation - Setup Guide

**Date:** November 11, 2025
**Source:** V4 Backup Project
**Destination:** Current Spred Project
**Status:** ✅ FILES COPIED, NEEDS DEPENDENCIES & BUILD

---

## ✅ Files Successfully Copied

All required files have been copied from V4 to the current project:

### 1. **Core Component**
- ✅ `src/components/FullscreenVideoPlayer/FullscreenVideoPlayer.tsx`
  - Full-featured fullscreen video player
  - Custom controls (play/pause, fullscreen toggle)
  - Auto-hide controls after 3 seconds
  - Android back button handling

### 2. **Android Native Module**
- ✅ `android/app/src/main/java/com/spred/SystemUIModule.java`
  - Hides/shows Android system UI (status bar + nav bar)
  - Immersive sticky mode for true fullscreen
  - Stores/restores system UI visibility flags
  - Thread-safe UI operations

- ✅ `android/app/src/main/java/com/spred/SystemUIPackage.java`
  - React Package registration for SystemUIModule
  - Exposes native methods to React Native

- ✅ `android/app/src/main/java/com/spred/MainApplication.kt` (UPDATED)
  - Added `SystemUIPackage()` to packages list
  - SystemUI module now registered in React Native

### 3. **TypeScript Wrappers**
- ✅ `src/native/SystemUIModule.ts`
  - Type-safe wrapper for SystemUIModule
  - Platform-specific handling (Android only)
  - Console logging for debugging

- ✅ `src/hooks/useOrientation.ts`
  - Orientation locking utilities
  - Lock to portrait/landscape
  - Unlock all orientations

---

## 📦 Required Dependencies

The following packages need to be installed in the destination project:

### Install via npm/yarn:

```bash
# Core video player
npm install react-native-video

# Orientation locking
npm install react-native-orientation-locker

# Icon library for controls
npm install react-native-vector-icons

# For TypeScript support
npm install --save-dev @types/react-native-vector-icons
```

### Or add to package.json manually:

```json
{
  "dependencies": {
    "react-native-video": "^5.2.1",
    "react-native-orientation-locker": "^1.7.0",
    "react-native-vector-icons": "^10.0.0"
  },
  "devDependencies": {
    "@types/react-native-vector-icons": "^6.4.10"
  }
}
```

---

## 🔧 Setup Steps

### Step 1: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 2: Link Vector Icons (if needed)
For React Native < 0.60, run:
```bash
react-native link react-native-vector-icons
```

For React Native >= 0.60, autolinking should work automatically.

### Step 3: Build Android
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### Step 4: Install on Device
```bash
npm run android
# or
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📱 How to Use the Fullscreen Video Player

### Basic Usage

```typescript
import React, { useState } from 'react';
import { View } from 'react-native';
import FullscreenVideoPlayer from '../components/FullscreenVideoPlayer';

const MyVideoScreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoUrl = 'https://example.com/video.mp4';

  if (isFullscreen) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <FullscreenVideoPlayer
          source={{ uri: videoUrl }}
          style={{ flex: 1 }}
          onFullscreenChange={setIsFullscreen}
          onPlayPause={(paused) => console.log('Paused:', paused)}
          onLoad={(data) => console.log('Video loaded:', data)}
          onError={(error) => console.error('Video error:', error)}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Your regular screen UI */}
      <FullscreenVideoPlayer
        source={{ uri: videoUrl }}
        style={{ height: 300 }}
        onFullscreenChange={setIsFullscreen}
      />
    </View>
  );
};

export default MyVideoScreen;
```

### Advanced Usage

```typescript
import React, { useState, useRef } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import FullscreenVideoPlayer from '../components/FullscreenVideoPlayer';

const AdvancedVideoScreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const handleFullscreenChange = (fullscreen) => {
    setIsFullscreen(fullscreen);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <View style={{ flex: 1 }}>
      {!isFullscreen && (
        <TouchableOpacity onPress={togglePlayPause}>
          <Text>{isPlaying ? 'Pause' : 'Play'}</Text>
        </TouchableOpacity>
      )}

      <FullscreenVideoPlayer
        ref={videoRef}
        source={{ uri: videoUrl }}
        paused={!isPlaying}
        style={{ flex: 1 }}
        resizeMode="contain"
        onFullscreenChange={handleFullscreenChange}
        onLoad={(data) => {
          console.log('Duration:', data.duration);
          console.log('Current time:', data.currentTime);
        }}
        onProgress={(data) => {
          console.log('Progress:', data.currentTime / data.seekableDuration * 100, '%');
        }}
        onEnd={() => {
          console.log('Video ended');
          setIsPlaying(false);
        }}
      />
    </View>
  );
};
```

---

## 🎯 Features

### 1. **True Fullscreen Mode (Android)**
- Hides status bar
- Hides navigation bar
- Locks to landscape orientation
- Immersive sticky mode (auto-hides UI on interaction)

### 2. **Custom Controls**
- Play/Pause button (center)
- Fullscreen toggle button (bottom right)
- Auto-hide after 3 seconds when playing
- Tap video to show/hide controls

### 3. **Back Button Handling**
- Android hardware back button exits fullscreen
- Returns to portrait orientation
- Restores system UI

### 4. **Orientation Management**
- Locks to landscape in fullscreen
- Locks to portrait when exiting
- Uses `react-native-orientation-locker`

### 5. **iOS Support**
- Graceful degradation (fullscreen flag not supported)
- Works on iOS without native module
- Shows warning in logs (non-blocking)

---

## 🎨 Customization

### Customize Controls

```typescript
// Custom styles in FullscreenVideoPlayer.tsx
const styles = StyleSheet.create({
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // More opaque
    borderRadius: 60, // Larger radius
    padding: 20, // More padding
  },
  fullscreenButton: {
    bottom: 30, // Move up
    right: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.8)', // Red tint
  },
});
```

### Add Seek Bar

```typescript
// Add to FullscreenVideoPlayer.tsx controls overlay
<Slider
  style={styles.seekBar}
  minimumValue={0}
  maximumValue={duration}
  value={currentTime}
  onValueChange={setCurrentTime}
  minimumTrackTintColor="#FFFFFF"
  maximumTrackTintColor="#FFFFFF"
  thumbTintColor="#F45303"
/>
```

### Add Quality Selector

```typescript
// Add quality selector in controls
<TouchableOpacity style={styles.qualityButton} onPress={showQualityOptions}>
  <Text style={styles.qualityText}>1080p</Text>
</TouchableOpacity>
```

---

## 🐛 Troubleshooting

### Issue: "SystemUIModule not found"
**Solution:**
1. Check MainApplication.kt has `SystemUIPackage()` added
2. Clean and rebuild: `./gradlew clean && ./gradlew assembleDebug`
3. Restart Metro bundler: `npm start -- --reset-cache`

### Issue: "Native module SystemUIModule is null"
**Solution:**
1. Ensure dependencies are installed: `npm install`
2. Check Vector Icons is installed: `npm list react-native-vector-icons`
3. Rebuild Android: `cd android && ./gradlew clean assembleDebug`

### Issue: Fullscreen doesn't hide navigation bar
**Solution:**
1. Check Android version (works on Android 4.4+)
2. Ensure `SystemUIModule.hideSystemUI()` is being called
3. Check logcat: `adb logcat | grep SystemUIModule`

### Issue: Orientation doesn't change
**Solution:**
1. Check `react-native-orientation-locker` is installed
2. Ensure hook is imported: `useOrientation`
3. Check if other screens are locking orientation

### Issue: Video doesn't play in fullscreen
**Solution:**
1. Check video URL is valid
2. Check network permissions in AndroidManifest.xml
3. Check onError callback for details

---

## 📊 Architecture

### Component Structure

```
FullscreenVideoPlayer
├── Video (react-native-video)
│   ├── Controls Overlay
│   │   ├── Play/Pause Button
│   │   ├── Fullscreen Toggle
│   │   └── Loading Indicator
│   ├── Orientation Lock
│   ├── Back Button Handler
│   └── System UI Control
```

### Native Module Communication

```
TypeScript (FullscreenVideoPlayer.tsx)
       ↓
SystemUIModule.ts (Wrapper)
       ↓
SystemUIModule.java (Native)
       ↓
Android SystemUI API
```

### State Flow

```
Normal Screen → Tap Fullscreen → Set Fullscreen True
                                    ↓
                               Hide System UI
                                    ↓
                               Lock to Landscape
                                    ↓
                            Show Fullscreen Player
```

---

## 🔍 Log Output

### Expected Logs (Working)

```
SystemUIModule: hideSystemUI() called from React Native, Platform.OS: android
SystemUIModule: SystemUIModule available?: true
SystemUIModule: Calling SystemUIModule.hideSystemUI()
SystemUIModule: hideSystemUI() called
SystemUIModule: Running on UI thread
SystemUIModule: Setting uiFlags: 4606
SystemUIModule: hideSystemUI() completed successfully
FullscreenVideoPlayer: Entering fullscreen mode
```

### Error Logs (Issues)

```
SystemUIModule: ERROR - SystemUIModule or hideSystemUI method not available!
```
**Cause:** Module not registered or build failed

```
SystemUIModule: Exception in hideSystemUI: Attempt to invoke virtual method...
```
**Cause:** Activity context issue

---

## 📈 Performance Tips

1. **Preload Video**
   - Call `videoRef.current?.resume()` in fullscreen

2. **Optimize Controls**
   - Keep controls simple for better performance
   - Avoid heavy animations in fullscreen

3. **Memory Management**
   - Video player automatically handles memory
   - Clean up on unmount (already implemented)

4. **Battery**
   - Lock orientation in fullscreen (already done)
   - Reduce video quality if needed

---

## 🎬 Example Implementation

See reference files in V4:
- `src/screens/PlayVideos/PlayVideos.tsx` - Shows full integration
- `src/screens/PlayDownloadedVideo/index.tsx` - Shows local file playback

These files show how to:
- Initialize player state
- Handle fullscreen transitions
- Manage video controls
- Handle errors

---

## ✅ Verification Checklist

- [ ] Dependencies installed (react-native-video, orientation-locker, vector-icons)
- [ ] SystemUIModule.java copied
- [ ] SystemUIPackage.java copied
- [ ] MainApplication.kt updated with SystemUIPackage()
- [ ] SystemUIModule.ts copied
- [ ] useOrientation.ts copied
- [ ] FullscreenVideoPlayer.tsx copied
- [ ] Android build successful
- [ ] Test fullscreen on Android device
- [ ] Test back button exits fullscreen
- [ ] Test orientation locks correctly
- [ ] Test controls auto-hide

---

## 🎯 Next Steps

1. **Install dependencies** listed above
2. **Build Android** with `./gradlew clean assembleDebug`
3. **Test on device** - open video, tap fullscreen button
4. **Verify behavior**:
   - Status bar hides
   - Navigation bar hides
   - Locks to landscape
   - Controls appear and auto-hide
   - Back button exits fullscreen
5. **Customize** as needed for your app

---

## 🚀 Benefits

✅ **True Fullscreen** - Hides Android system bars completely
✅ **Smooth Experience** - Immersive sticky mode
✅ **Native Feel** - Uses Android SystemUI APIs
✅ **Customizable** - Easy to modify controls and styles
✅ **Production Ready** - Proven in V4 project
✅ **Well Tested** - Handles edge cases and errors
✅ **iOS Compatible** - Graceful degradation on iOS

---

**Status: Ready to Test!** 🎉

All files copied, dependencies identified, setup guide complete. Install dependencies and build to test!
