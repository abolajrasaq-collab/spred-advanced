# Fullscreen Video Player - Testing Guide

**Date:** November 11, 2025
**Build:** ✅ SUCCESSFUL
**APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (65MB)
**Status:** Ready for Testing

---

## 🎉 Build Summary

✅ **Build Successful!**
- APK Size: 65MB
- All dependencies included
- SystemUIModule registered
- Fullscreen implementation integrated

---

## 📱 Testing the Fullscreen Video Player

### Prerequisites
- Android device with USB debugging enabled
- APK installed on device
- Test video file (mp4, m4v, mov, etc.)

### Step 1: Install APK

```bash
# Install via adb
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or push to device and install manually
adb push android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
# Then navigate to Downloads on device and tap the APK
```

### Step 2: Open App and Navigate to Video

1. Launch Spred app
2. Navigate to a video player screen (PlayVideos, PlayDownloadedVideo, etc.)
3. You should see the new FullscreenVideoPlayer component

### Step 3: Test Fullscreen Functionality

#### Test 1: Enter Fullscreen
1. **Tap the fullscreen button** (bottom-right corner)
2. **Expected behavior:**
   - ✅ Status bar disappears
   - ✅ Navigation bar disappears
   - ✅ Screen rotates to landscape
   - ✅ Video fills entire screen
   - ✅ Controls overlay appears with play/pause

**Verification:**
- Check device is in landscape mode
- Verify no system UI visible (true immersive mode)
- Controls should be visible initially

#### Test 2: Controls Auto-Hide
1. **In fullscreen mode, do nothing for 3 seconds**
2. **Expected behavior:**
   - ✅ Controls fade out/disappear
   - ✅ Only video is visible
   - ✅ Immersive mode active

**Verification:**
- Wait 3 seconds after entering fullscreen
- Controls should auto-hide
- Tap screen to reveal controls again

#### Test 3: Exit Fullscreen
1. **In fullscreen mode, tap the fullscreen-exit button** (now bottom-right)
2. **Expected behavior:**
   - ✅ Status bar reappears
   - ✅ Navigation bar reappears
   - ✅ Screen rotates back to portrait
   - ✅ Returns to normal video view

**Verification:**
- Check device returns to portrait mode
- Verify all system UI is restored
- Controls should be visible in normal mode

#### Test 4: Android Back Button
1. **In fullscreen mode, press hardware back button**
2. **Expected behavior:**
   - ✅ Exits fullscreen mode
   - ✅ Returns to portrait orientation
   - ✅ Restores system UI
   - ✅ Does NOT exit the app

**Verification:**
- Press Android back button
- Should exit fullscreen, not close app
- Device returns to portrait

#### Test 5: Play/Pause Controls
1. **In fullscreen mode, tap the center of video**
2. **Expected behavior:**
   - ✅ Controls appear
   - ✅ Tap play/pause button
   - ✅ Video plays or pauses
   - ✅ Button icon changes (play ↔ pause)

**Verification:**
- Play button changes to pause when playing
- Pause button changes to play when paused
- Controls auto-hide after 3 seconds

---

## 🔍 Testing Different Video Sources

### Test A: Remote Video (URL)
```typescript
// Use in your screen
const remoteVideoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

<FullscreenVideoPlayer
  source={{ uri: remoteVideoUrl }}
  onLoad={(data) => console.log('Video loaded:', data)}
/>
```

### Test B: Local File
```typescript
// Use in your screen
const localVideoPath = '/path/to/video.mp4';

<FullscreenVideoPlayer
  source={{ uri: localVideoPath }}
  onLoad={(data) => console.log('Local video loaded:', data)}
/>
```

### Test C: Downloaded Content
```typescript
// Use in your screen
const downloadedVideo = {
  uri: 'file:///storage/emulated/0/SpredVideos/video.mp4'
};

<FullscreenVideoPlayer
  source={downloadedVideo}
  onError={(error) => console.error('Error:', error)}
/>
```

---

## 🎯 Implementation Example

To test the FullscreenVideoPlayer, you can add it to any screen:

```typescript
// Example usage in PlayVideos.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import FullscreenVideoPlayer from '../components/FullscreenVideoPlayer';

const PlayVideos = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  if (isFullscreen) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <FullscreenVideoPlayer
          source={{ uri: videoUrl }}
          style={{ flex: 1 }}
          paused={!isPlaying}
          onFullscreenChange={setIsFullscreen}
          onPlayPause={setIsPlaying}
          onLoad={(data) => console.log('Video loaded, duration:', data.duration)}
          onError={(error) => console.error('Video error:', error)}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A', padding: 20 }}>
      <Text style={{ color: '#FFF', fontSize: 18, marginBottom: 20 }}>
        Spred Video Player
      </Text>

      <View style={{ height: 300, backgroundColor: '#000', marginBottom: 20 }}>
        <FullscreenVideoPlayer
          source={{ uri: videoUrl }}
          style={{ flex: 1 }}
          paused={!isPlaying}
          onFullscreenChange={setIsFullscreen}
          onPlayPause={setIsPlaying}
          onLoad={(data) => console.log('Loaded:', data.duration)}
          onError={(error) => console.error('Error:', error)}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: '#F45303',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={() => setIsPlaying(!isPlaying)}
      >
        <Text style={{ color: '#FFF', fontSize: 16 }}>
          {isPlaying ? 'Pause' : 'Play'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PlayVideos;
```

---

## 🐛 Troubleshooting

### Issue: Video doesn't load
**Symptoms:** Black screen, no video
**Solutions:**
1. Check video URL is valid
2. Check network permissions in AndroidManifest.xml
3. Test with a known working URL
4. Check onError callback for details

### Issue: Fullscreen button not visible
**Symptoms:** No fullscreen toggle button
**Solutions:**
1. Check `react-native-vector-icons` is installed
2. Run: `react-native link react-native-vector-icons`
3. Rebuild: `./gradlew clean assembleDebug`
4. Check import in FullscreenVideoPlayer.tsx

### Issue: System UI still visible in fullscreen
**Symptoms:** Status bar or nav bar still showing
**Solutions:**
1. Check SystemUIModule.java is present
2. Verify SystemUIPackage() is in MainApplication.kt
3. Check logcat: `adb logcat | grep SystemUIModule`
4. Ensure Android 4.4+ (API 19+)

### Issue: Orientation doesn't change
**Symptoms:** Device stays in portrait during fullscreen
**Solutions:**
1. Check `react-native-orientation-locker` installed
2. Verify useOrientation hook is imported
3. Check device supports landscape
4. Try manually rotating device

### Issue: Back button exits app instead of fullscreen
**Symptoms:** App closes when pressing back in fullscreen
**Solutions:**
1. Check BackHandler import in FullscreenVideoPlayer.tsx
2. Verify event listener is added
3. Check isFullscreen state is true
4. Ensure toggleFullscreen function is bound

### Issue: Controls don't auto-hide
**Symptoms:** Controls always visible
**Solutions:**
1. Check showControls state logic
2. Verify setTimeout is being called
3. Ensure isVideoPaused is false (playing)
4. Check if paused prop is being passed

---

## 📊 Logcat Commands

### Check SystemUIModule logs:
```bash
adb logcat -c && adb logcat | grep -E "SystemUIModule|FullscreenVideoPlayer"
```

### Expected logs when entering fullscreen:
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

### Expected logs when exiting fullscreen:
```
FullscreenVideoPlayer: Exiting fullscreen mode
SystemUIModule: showSystemUI() called from React Native
SystemUIModule: showSystemUI() completed
FullscreenVideoPlayer: toggleFullscreen completed
```

---

## ✅ Test Checklist

- [ ] APK installed on Android device
- [ ] Video player loads without errors
- [ ] Fullscreen button visible and tappable
- [ ] Tap fullscreen → status bar hides
- [ ] Tap fullscreen → navigation bar hides
- [ ] Tap fullscreen → device rotates to landscape
- [ ] Controls appear when entering fullscreen
- [ ] Controls auto-hide after 3 seconds
- [ ] Tap video → controls reappear
- [ ] Play/pause button works and changes icon
- [ ] Tap fullscreen-exit → status bar reappears
- [ ] Tap fullscreen-exit → navigation bar reappears
- [ ] Tap fullscreen-exit → device rotates to portrait
- [ ] Android back button exits fullscreen
- [ ] Back button does NOT exit app
- [ ] No errors in logcat
- [ ] Remote video URL works
- [ ] Local video file works
- [ ] Downloaded content works

---

## 🎨 Customization Options

### Change Control Colors:
```typescript
// In FullscreenVideoPlayer.tsx, modify styles
playPauseButton: {
  backgroundColor: 'rgba(0, 0, 0, 0.8)', // Change opacity
  borderRadius: 50,
  padding: 15,
},
```

### Change Fullscreen Button Position:
```typescript
// Move fullscreen button
fullscreenButton: {
  position: 'absolute',
  bottom: 30, // Change vertical position
  right: 30,  // Change horizontal position
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  borderRadius: 25,
  padding: 10,
},
```

### Add Custom Controls:
```typescript
// Add to controls overlay in FullscreenVideoPlayer.tsx
<View style={styles.customControls}>
  <Text style={styles.timeText}>00:30 / 05:00</Text>
</View>
```

---

## 🚀 Performance Testing

### Test with Large Video:
1. Use video > 100MB
2. Check memory usage (should stay stable)
3. Check for lag when seeking
4. Verify controls remain responsive

### Test with Poor Network:
1. Use video with slow connection
2. Check buffering indicators
3. Verify loading state shows
4. Test pause/resume

### Test Multiple Fullscreen Sessions:
1. Enter/exit fullscreen multiple times
2. Check for memory leaks
3. Verify system UI restores correctly
4. Check for orientation issues

---

## 📱 Device Testing Matrix

Test on different Android versions:
- [ ] Android 5.0 (API 21)
- [ ] Android 7.0 (API 24)
- [ ] Android 9.0 (API 28)
- [ ] Android 11 (API 30)
- [ ] Android 13 (API 33)
- [ ] Android 14 (API 34)

Test on different screen sizes:
- [ ] Phone (5-6 inches)
- [ ] Tablet (7-10 inches)
- [ ] Foldable device
- [ ] Different aspect ratios (16:9, 18:9, 19.5:9)

---

## 🎬 Video Test URLs

For testing, use these sample videos:

### Short Clips:
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4
- https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4

### Different Formats:
- MP4: BigBuckBunny.mp4
- MOV: (test with iPhone recorded video)
- MKV: (test with Android recorded video)

---

## 💡 Pro Tips

1. **Add Loading State:**
   - Show spinner while video loads
   - Update isLoading state in onLoadStart/onLoad

2. **Add Error Handling:**
   - Show friendly error messages
   - Retry button for failed loads
   - Log errors to analytics

3. **Add Quality Selection:**
   - Dropdown to choose video quality
   - Auto-select based on connection speed
   - Save user preference

4. **Add Captions/Subtitles:**
   - Support for SRT/VTT files
   - Toggle on/off
   - Language selection

5. **Add Playback Speed:**
   - 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
   - Save as user preference
   - Show speed indicator

---

## 🎯 Success Criteria

The fullscreen implementation is successful when:

✅ **All system UI hides in fullscreen mode**
✅ **All system UI restores on exit**
✅ **Device rotates to landscape in fullscreen**
✅ **Device rotates to portrait on exit**
✅ **Android back button exits fullscreen (not app)**
✅ **Controls auto-hide and show correctly**
✅ **Play/pause works and updates icon**
✅ **No errors in logcat**
✅ **Works with remote URLs**
✅ **Works with local files**
✅ **Works with downloaded content**
✅ **Memory stable during use**
✅ **Compatible with Android 5.0+**

---

**Test Status:** Ready for Testing! 🚀

Install the APK and follow this guide to verify all functionality works correctly!
