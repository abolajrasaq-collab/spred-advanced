# Video Player & Fullscreen Implementation Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Breakdown](#component-breakdown)
4. [Fullscreen Implementation](#fullscreen-implementation)
5. [Native Module Integration](#native-module-integration)
6. [Orientation Management](#orientation-management)
7. [Integration Guide](#integration-guide)
8. [API Reference](#api-reference)
9. [Android Configuration](#android-configuration)
10. [Platform-Specific Behaviors](#platform-specific-behaviors)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Spred app features a custom fullscreen video player built on top of `react-native-video` with custom controls, orientation locking, and immersive fullscreen mode. The implementation includes native Android modules for system UI control and a React hook for orientation management.

### Key Features

- ✅ **Custom Fullscreen Controls** - Play/pause and fullscreen toggle buttons
- ✅ **Immersive Fullscreen** - Hides status bar and navigation bar
- ✅ **Auto-hiding Controls** - Controls hide after 3 seconds of inactivity
- ✅ **Orientation Locking** - Locks to landscape in fullscreen, portrait in normal mode
- ✅ **Android Back Button Handling** - Exits fullscreen on back press
- ✅ **Dynamic Sizing** - Responsive layout for all screen sizes
- ✅ **Loading States** - Shows loading indicator during buffering
- ✅ **Local & Remote Video Support** - Works with both file:// and http:// sources

---

## Architecture

### Component Hierarchy

```
FullscreenVideoPlayer (React Component)
├── Video (react-native-video)
│   ├── Source
│   ├── Controls Overlay
│   └── Loading Indicator
├── Controls Overlay
│   ├── Play/Pause Button
│   └── Fullscreen Toggle Button
└── SystemUIModule (Native Android)
    ├── hideSystemUI()
    ├── showSystemUI()
    └── toggleSystemUI()
```

### State Management

```typescript
// Component State
const [isFullscreen, setIsFullscreen] = useState(false);
const [isVideoPaused, setIsVideoPaused] = useState(paused);
const [showControls, setShowControls] = useState(true);
const [isLoading, setIsLoading] = useState(false);

// Refs
const videoRef = useRef<Video>(null);
const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Dimensions
const [screenDimensions, setScreenDimensions] = useState(() => {
  const { width, height } = Dimensions.get('window');
  return { width, height };
});
```

---

## Component Breakdown

### 1. FullscreenVideoPlayer Component

**File**: `src/components/FullscreenVideoPlayer/FullscreenVideoPlayer.tsx`

This is the main component that handles video playback, fullscreen state, and custom controls.

#### Core Functionality

**a) Video Rendering (Line 202-218)**

```typescript
<Video
  ref={videoRef}
  source={source}
  style={videoStyle}
  paused={isVideoPaused}
  controls={false}  // Disable default controls
  resizeMode={resizeMode}
  onLoad={handleLoad}
  onError={handleError}
  onLoadStart={handleLoadStart}
  onBuffer={onBuffer}
  repeat={false}
  playInBackground={false}
  playWhenInactive={false}
  ignoreSilentSwitch="ignore"
  {...(headers && { headers })}
/>
```

**Key Props**:
- `controls={false}` - Use custom overlay controls
- `resizeMode` - Video scaling mode (contain, cover, stretch)
- `headers` - Custom HTTP headers for authenticated streams

**b) Dynamic Styling (Line 177-193)**

```typescript
const containerStyle = isFullscreen
  ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: screenDimensions.width,
      height: screenDimensions.height,
      backgroundColor: '#000',
      zIndex: 99999,
    }
  : style;

const videoStyle = isFullscreen
  ? {
      ...StyleSheet.absoluteFillObject,
    }
  : { flex: 1 };
```

**c) Control Auto-Hide (Line 84-96)**

```typescript
useEffect(() => {
  if (showControls && !isVideoPaused) {
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }

  return () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };
}, [showControls, isVideoPaused]);
```

**d) Android Back Button Handler (Line 98-109)**

```typescript
useEffect(() => {
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (isFullscreen) {
      toggleFullscreen();
      return true; // Prevent default back action
    }
    return false; // Allow default back action
  });

  return () => backHandler.remove();
}, [isFullscreen, toggleFullscreen]);
```

**e) Touch Handler (Line 158-160)**

```typescript
const handleVideoPress = () => {
  setShowControls(!showControls);
};
```

### 2. Fullscreen Toggle Logic

**File**: `FullscreenVideoPlayer.tsx:111-149`

The core fullscreen transition logic:

```typescript
const toggleFullscreen = useCallback(() => {
  console.log('FullscreenVideoPlayer: toggleFullscreen called');

  if (isFullscreen) {
    // Exit fullscreen
    setIsFullscreen(false);
    StatusBar.setHidden(false);

    // Show system UI on Android
    if (Platform.OS === 'android') {
      SystemUI.showSystemUI();
    }

    onFullscreenChange?.(false);

    // Small delay to ensure state updates before orientation change
    setTimeout(() => {
      lockToPortrait();
    }, 100);
  } else {
    // Enter fullscreen
    setIsFullscreen(true);
    StatusBar.setHidden(true);

    // Hide system UI on Android
    if (Platform.OS === 'android') {
      SystemUI.hideSystemUI();
    }

    onFullscreenChange?.(true);

    // Small delay to ensure state updates before orientation change
    setTimeout(() => {
      lockToLandscape();
    }, 100);
  }
}, [isFullscreen, lockToPortrait, lockToLandscape, onFullscreenChange]);
```

**Transition Steps**:

1. **Update State** - Toggle `isFullscreen`
2. **Status Bar** - Hide/show via React Native's `StatusBar` API
3. **System UI** - Call native module on Android
4. **Callback** - Notify parent component
5. **Orientation** - Lock to landscape/portrait with 100ms delay

### 3. Custom Controls

**File**: `FullscreenVideoPlayer.tsx:228-256`

Custom overlay controls with play/pause and fullscreen toggle:

```typescript
{showControls && (
  <View style={[styles.controlsOverlay, isFullscreen && styles.fullscreenControls]}>
    {/* Play/Pause button */}
    <TouchableOpacity
      style={styles.playPauseButton}
      onPress={togglePlayPause}
    >
      <Icon
        name={isVideoPaused ? 'play-arrow' : 'pause'}
        size={isFullscreen ? 60 : 40}
        color="#fff"
      />
    </TouchableOpacity>

    {/* Fullscreen toggle button */}
    <TouchableOpacity
      style={[styles.fullscreenButton, isFullscreen && styles.exitFullscreenButton]}
      onPress={toggleFullscreen}
    >
      <Icon
        name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
        size={isFullscreen ? 30 : 24}
        color="#fff"
      />
    </TouchableOpacity>
  </View>
)}
```

**Control Features**:
- Icon changes based on state (play ↔ pause, fullscreen ↔ exit)
- Larger icons in fullscreen mode
- Semi-transparent background overlay
- Auto-hide after 3 seconds of inactivity

---

## Fullscreen Implementation

### State Flow

```
Normal Mode
    ↓ [toggleFullscreen() called]
Enter Fullscreen Transition
    ↓
Hide StatusBar + SystemUI
    ↓
Lock to Landscape
    ↓
Fullscreen Mode (isFullscreen = true)
    ↓ [toggleFullscreen() called]
Exit Fullscreen Transition
    ↓
Show StatusBar + SystemUI
    ↓
Lock to Portrait
    ↓
Normal Mode (isFullscreen = false)
```

### Visual States

#### Normal Mode
- Video container: `style` prop (passed from parent)
- Video size: Flexible (e.g., 221px height)
- Status bar: Visible
- Orientation: Portrait unlocked
- Controls: Play/pause, fullscreen toggle

#### Fullscreen Mode
- Video container: `absolute` positioned, covers entire screen
- Video size: `absoluteFillObject` (fills screen)
- Status bar: Hidden
- System UI: Hidden (Android)
- Orientation: Locked to landscape
- Controls: Larger play/pause, exit fullscreen toggle

### Dimension Handling

The component listens for dimension changes to maintain proper sizing:

```typescript
useEffect(() => {
  const subscription = Dimensions.addEventListener('change', ({ window }) => {
    setScreenDimensions({ width: window.width, height: window.height });
  });

  return () => {
    subscription?.remove();
  };
}, []);
```

This ensures the component adapts to:
- Screen rotation
- Multi-window mode (Android)
- Split screen mode
- Device orientation changes

---

## Native Module Integration

### SystemUIModule (Android)

**Files**:
- `android/app/src/main/java/com/spred/SystemUIModule.java`
- `android/app/src/main/java/com/spred/SystemUIPackage.java`

#### Purpose

Provides low-level control over Android's system UI (status bar, navigation bar, immersive mode).

#### Methods

**1. hideSystemUI() - Line 58-101**

```java
@ReactMethod
public void hideSystemUI() {
  currentActivity.runOnUiThread(() -> {
    Window window = currentActivity.getWindow();
    View decorView = window.getDecorView();

    // Store current flags
    systemUiVisibilityFlags = decorView.getSystemUiVisibility();

    // Set immersive sticky mode
    int uiFlags = SYSTEM_UI_FLAG_FULLSCREEN
        | SYSTEM_UI_FLAG_HIDE_NAVIGATION
        | SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        | SYSTEM_UI_FLAG_LAYOUT_STABLE
        | SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        | SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;

    decorView.setSystemUiVisibility(uiFlags);

    // Also set fullscreen flag on window
    window.addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
    window.clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN);
  });
}
```

**Flags Explained**:
- `SYSTEM_UI_FLAG_FULLSCREEN` - Hide status bar
- `SYSTEM_UI_FLAG_HIDE_NAVIGATION` - Hide navigation bar
- `SYSTEM_UI_FLAG_IMMERSIVE_STICKY` - Auto-hide system UI after interaction
- `SYSTEM_UI_FLAG_LAYOUT_STABLE` - Stable layout during UI hide/show
- `SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN` - Layout in fullscreen mode

**2. showSystemUI() - Line 103-127**

```java
@ReactMethod
public void showSystemUI() {
  currentActivity.runOnUiThread(() -> {
    Window window = currentActivity.getWindow();
    View decorView = window.getDecorView();

    // Restore original system UI visibility
    decorView.setSystemUiVisibility(systemUiVisibilityFlags);

    // Remove fullscreen flag from window
    window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);
  });
}
```

**3. toggleSystemUI() - Line 129-156**

```java
@ReactMethod
public void toggleSystemUI() {
  currentActivity.runOnUiThread(() => {
    Window window = currentActivity.getWindow();
    View decorView = window.getDecorView();

    int currentFlags = decorView.getSystemUiVisibility();
    boolean isHidden = (currentFlags & SYSTEM_UI_FLAG_HIDE_NAVIGATION) != 0;

    if (isHidden) {
      showSystemUI();
    } else {
      hideSystemUI();
    }
  });
}
```

#### Module Registration

**File**: `MainApplication.kt`

```kotlin
override fun getPackages(): List<ReactPackage> =
  PackageList(this).packages.apply {
    add(SystemUIPackage())  // Register SystemUI module
  }
```

#### JavaScript Import

**File**: `src/native/SystemUIModule.ts` (or similar)

```typescript
import { NativeModules } from 'react-native';

const SystemUI = NativeModules.SystemUIModule;

export default SystemUI;
```

---

## Orientation Management

### useOrientation Hook

**File**: `src/hooks/useOrientation.ts`

Custom hook that wraps `react-native-orientation-locker` for easier state management.

```typescript
import { useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';

export const useOrientation = () => {
  useEffect(() => {
    // Allow all orientations initially
    Orientation.unlockAllOrientations();

    // Cleanup function to reset to portrait when component unmounts
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const lockToPortrait = () => {
    Orientation.lockToPortrait();
  };

  const lockToLandscape = () => {
    Orientation.lockToLandscape();
  };

  const unlockAllOrientations = () => {
    Orientation.unlockAllOrientations();
  };

  return {
    lockToPortrait,
    lockToLandscape,
    unlockAllOrientations,
  };
};
```

### Usage in Component

```typescript
const { lockToPortrait, lockToLandscape } = useOrientation();
```

### Orientation Locker API

**Package**: `react-native-orientation-locker` (v1.7.0)

**Methods**:
- `Orientation.lockToPortrait()` - Lock to portrait mode
- `Orientation.lockToLandscape()` - Lock to landscape mode
- `Orientation.lockToLandscapeReverse()` - Lock to reverse landscape
- `Orientation.unlockAllOrientations()` - Allow all orientations

### Android Manifest Configuration

**File**: `android/app/src/main/AndroidManifest.xml:33`

```xml
<activity
  android:name=".MainActivity"
  android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
  android:launchMode="singleTask"
  android:windowSoftInputMode="adjustResize"
  android:exported="true">
```

**ConfigChanges**:
- `orientation` - Screen orientation changes
- `screenLayout` - Screen layout changes
- `screenSize` - Screen size changes
- `uiMode` - UI mode changes (night mode, etc.)

This prevents activity recreation on orientation change, allowing the component to handle it gracefully.

---

## Integration Guide

### Basic Usage

```typescript
import FullscreenVideoPlayer from './components/FullscreenVideoPlayer';

const MyScreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <FullscreenVideoPlayer
      source={{
        uri: 'https://example.com/video.mp4',
        headers: {
          Authorization: 'Bearer your-token',
        },
      }}
      style={{ width: '100%', height: 221 }}
      paused={true}
      resizeMode="contain"
      onPlayPause={(paused) => console.log('Paused:', paused)}
      onFullscreenChange={(isFull) => setIsFullscreen(isFull)}
      onLoad={(data) => console.log('Video loaded:', data)}
      onError={(error) => console.error('Video error:', error)}
    />
  );
};
```

### Playing Local Files

```typescript
<FullscreenVideoPlayer
  source={{ uri: 'file:///storage/emulated/0/SpredVideos/video.mp4' }}
  style={{ width: '100%', height: 221 }}
  paused={false}
/>
```

### For PlayDownloadedVideo

```typescript
// File: src/screens/PlayDownloadedVideo/index.tsx:43-86

<FullscreenVideoPlayer
  source={{ uri: `file://${props.route.params?.movie?.path}` }}
  style={{
    width: '100%',
    height: 221,
    marginTop: 10,
    backgroundColor: '#000',
  }}
  paused={isVideoPaused}
  onPlayPause={setIsVideoPaused}
  resizeMode="cover"
  onFullscreenChange={setIsFullscreen}
/>
```

### Required Permissions (Android)

**File**: `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET" />
<!-- For video playback -->
```

### Required Dependencies

**File**: `package.json`

```json
{
  "dependencies": {
    "react-native-video": "^5.2.1",
    "react-native-orientation-locker": "^1.7.0",
    "react-native-vector-icons": "^10.0.3"
  }
}
```

---

## API Reference

### FullscreenVideoPlayer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `any` | **Required** | Video source (uri, headers, etc.) |
| `style` | `ViewStyle` | - | Container style (normal mode) |
| `paused` | `boolean` | `true` | Initial paused state |
| `onPlayPause` | `(paused: boolean) => void` | - | Callback when play/pause toggled |
| `onLoad` | `(data: any) => void` | - | Callback when video loads |
| `onError` | `(error: any) => void` | - | Callback on video error |
| `onLoadStart` | `() => void` | - | Callback when loading starts |
| `onBuffer` | `(data: any) => void` | - | Callback on buffer events |
| `resizeMode` | `'contain' \| 'cover' \| 'stretch' \| 'none'` | `'contain'` | Video scaling mode |
| `headers` | `any` | - | Custom HTTP headers |
| `onFullscreenChange` | `(isFullscreen: boolean) => void` | - | Callback when fullscreen toggled |

### resizeMode Options

- **`contain`** - Maintain aspect ratio, fit within container (may have black bars)
- **`cover`** - Maintain aspect ratio, fill container (may crop)
- **`stretch`** - Fill container (may distort)
- **`none`** - No scaling

### SystemUIModule Methods (Android)

```typescript
import { NativeModules } from 'react-native';
const SystemUI = NativeModules.SystemUIModule;

// Hide system UI (status bar + nav bar)
SystemUI.hideSystemUI();

// Show system UI
SystemUI.showSystemUI();

// Toggle system UI
SystemUI.toggleSystemUI();
```

---

## Android Configuration

### 1. MainActivity ConfigChanges

Ensure MainActivity handles orientation changes:

**File**: `android/app/src/main/AndroidManifest.xml:33`

```xml
<activity
  android:name=".MainActivity"
  android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
  ...
/>
```

### 2. Register SystemUIPackage

**File**: `android/app/src/main/java/com/spred/MainApplication.kt`

```kotlin
override fun getPackages(): List<ReactPackage> =
  PackageList(this).packages.apply {
    add(SystemUIPackage())
  }
```

### 3. Create Native Module Files

**SystemUIModule.java** - Provides system UI control methods
**SystemUIPackage.java** - Registers the module with React Native

### 4. Build and Link

The native module is automatically linked since it's added manually in `MainApplication`.

```bash
# Android
cd android
./gradlew clean
cd ..
npx react-native run-android
```

---

## Platform-Specific Behaviors

### Android

- **Status Bar**: Hidden/shown via React Native's `StatusBar` API
- **System UI**: Controlled via `SystemUIModule` native module
- **Back Button**: Custom handler in component
- **Immersive Mode**: Sticky immersive mode for fullscreen
- **Navigation Bar**: Hidden in fullscreen
- **Orientation**: Locked to landscape/portrait

### iOS

- **Status Bar**: Hidden/shown via React Native's `StatusBar` API
- **System UI**: Uses standard iOS fullscreen behavior
- **Back Button**: Not applicable (iOS doesn't have hardware back button)
- **Orientation**: Locked via `react-native-orientation-locker`
- **Navigation Bar**: Standard iOS behavior

**Note**: On iOS, the `SystemUIModule` methods are not used. The component relies on:
- `StatusBar.setHidden()` for status bar
- `Orientation.lockToLandscape()` for orientation
- Standard React Native fullscreen handling

### Implementation Differences

```typescript
// Fullscreen entry - different for iOS and Android
if (Platform.OS === 'android') {
  // Use native module for immersive fullscreen
  SystemUI.hideSystemUI();
}
// iOS uses standard behavior
```

---

## Troubleshooting

### Issue: Fullscreen not working on Android

**Symptoms**:
- Video doesn't enter fullscreen
- Status bar remains visible
- Navigation bar remains visible

**Solutions**:
1. Verify `SystemUIPackage()` is registered in `MainApplication.kt`
2. Check `SystemUIModule.java` is in correct package directory
3. Clean and rebuild: `cd android && ./gradlew clean`
4. Verify native module is linked

### Issue: Orientation not changing

**Symptoms**:
- Video stays in portrait when toggling fullscreen
- Screen doesn't rotate to landscape

**Solutions**:
1. Verify `react-native-orientation-locker` is installed: `npm list react-native-orientation-locker`
2. Check MainActivity configChanges includes "orientation"
3. Ensure `lockToLandscape()` and `lockToPortrait()` are called
4. iOS: Add orientation keys to `Info.plist`

### Issue: Video won't play

**Symptoms**:
- Loading indicator shows indefinitely
- onError callback fires
- Black screen

**Solutions**:
1. Check video URL is valid
2. Verify headers if authentication required
3. Check network permissions in AndroidManifest.xml
4. Test with different video source
5. Check console for error details

### Issue: Controls not showing

**Symptoms**:
- No play/pause button visible
- No fullscreen toggle button

**Solutions**:
1. Check `showControls` state
2. Verify `showControls &&` condition
3. Check if controls are hidden by timeout (tap screen to show)
4. Verify styles aren't hiding controls

### Issue: Local file not playing

**Symptoms**:
- Remote videos work, local files don't
- Error: "Cannot find video file"

**Solutions**:
1. Check file path is correct
2. Add `file://` prefix: `source={{ uri: 'file:///path/to/video.mp4' }}`
3. Verify file exists in filesystem
4. Check Android permissions for storage access
5. iOS: Use `Library/Caches` or `Documents` directory

### Issue: Back button doesn't exit fullscreen

**Symptoms**:
- Pressing back button exits app instead of fullscreen
- Fullscreen mode won't exit

**Solutions**:
1. Check backHandler is registered
2. Verify `isFullscreen` state is correct
3. Ensure `toggleFullscreen` is in dependency array
4. Test with `console.log` statements

### Issue: Controls auto-hide too fast/slow

**Symptoms**:
- Controls disappear immediately
- Controls never disappear

**Solutions**:
Adjust timeout in component:

```typescript
// Line 86-89
controlsTimeoutRef.current = setTimeout(() => {
  setShowControls(false);
}, 3000); // Change 3000 to desired milliseconds
```

### Debug Logging

Enable detailed logging:

```typescript
// Add to toggleFullscreen function
const toggleFullscreen = useCallback(() => {
  console.log('FullscreenVideoPlayer: toggleFullscreen called, current isFullscreen:', isFullscreen);

  if (isFullscreen) {
    console.log('FullscreenVideoPlayer: Exiting fullscreen mode');
    // ... rest of code
  } else {
    console.log('FullscreenVideoPlayer: Entering fullscreen mode');
    // ... rest of code
  }
}, [isFullscreen, lockToPortrait, lockToLandscape, onFullscreenChange]);
```

---

## Best Practices

### 1. Always Clean Up Timers

```typescript
useEffect(() => {
  return () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };
}, []);
```

### 2. Handle Component Unmount

```typescript
useEffect(() => {
  return () => {
    if (isFullscreen && Platform.OS === 'android') {
      SystemUI.showSystemUI();
      StatusBar.setHidden(false);
    }
  };
}, [isFullscreen]);
```

### 3. Use Callback Refs for Video

```typescript
const videoRef = useRef<Video>(null);

// To control video programmatically
videoRef.current?.seek(0);
```

### 4. Provide Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleLoadStart = () => {
  setIsLoading(true);
};

const handleLoad = () => {
  setIsLoading(false);
};
```

### 5. Handle Errors Gracefully

```typescript
const handleError = (error: any) => {
  console.error('Video error:', error);
  Alert.alert('Playback Error', 'Failed to play video. Please try again.');
};
```

### 6. Test on Real Devices

- iOS Simulator may not accurately represent fullscreen behavior
- Android Emulator has limited orientation support
- Test on actual devices for accurate behavior

### 7. Performance Considerations

- Disable default video controls: `controls={false}`
- Use `playInBackground={false}` to pause when app backgrounds
- Set `ignoreSilentSwitch="ignore"` for consistent playback
- Use appropriate `resizeMode` for content type

---

## Complete Example

```typescript
import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import FullscreenVideoPlayer from './components/FullscreenVideoPlayer';

const VideoPlayerExample = () => {
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <FullscreenVideoPlayer
        source={{
          uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        }}
        style={{ width: '100%', height: 300 }}
        paused={isVideoPaused}
        onPlayPause={setIsVideoPaused}
        onFullscreenChange={setIsFullscreen}
        resizeMode="contain"
        onLoad={(data) => {
          console.log('Video loaded:', data.duration);
        }}
        onError={(error) => {
          console.error('Video error:', error);
          Alert.alert('Error', 'Failed to load video');
        }}
      />
    </View>
  );
};

export default VideoPlayerExample;
```

---

## Summary

The Spred video player implementation provides a robust, feature-rich video playback experience with:

1. **Custom Fullscreen** - Immersive fullscreen with native system UI control
2. **Orientation Management** - Seamless landscape/portrait transitions
3. **Custom Controls** - Branded play/pause and fullscreen buttons
4. **Cross-Platform** - Works on both Android and iOS
5. **Native Integration** - Android native module for system UI control
6. **Performance Optimized** - Efficient rendering and state management

The implementation balances user experience with technical complexity, providing a native-feeling fullscreen video player that enhances the Spred app's premium content viewing experience.

---

## Key Files Reference

| File | Purpose | Key Features |
|------|---------|--------------|
| `src/components/FullscreenVideoPlayer/FullscreenVideoPlayer.tsx` | Main video player component | Fullscreen logic, custom controls, state management |
| `src/hooks/useOrientation.ts` | Orientation management hook | Lock/unlock portrait/landscape |
| `android/app/src/main/java/com/spred/SystemUIModule.java` | Native Android module | hide/show system UI, immersive mode |
| `android/app/src/main/java/com/spred/SystemUIPackage.java` | Module registration | Registers SystemUIModule |
| `android/app/src/main/AndroidManifest.xml` | Android config | Config changes, permissions |
| `src/screens/PlayVideos/PlayVideos.tsx` | Integration example | Fullscreen video player usage |
| `src/screens/PlayDownloadedVideo/index.tsx` | Local video player | File:// video playback |
