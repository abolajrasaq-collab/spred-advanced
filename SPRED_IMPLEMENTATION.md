# SPRED Implementation: Peer-to-Peer Video Sharing System

## Overview

**SPRED** is a peer-to-peer (P2P) video sharing feature in the Spred app that enables users to share downloaded videos directly with other Spred users over WiFi Direct. This document provides a comprehensive explanation of the implementation, user flow, and technical architecture.

---

## Table of Contents

1. [User Flow Overview](#user-flow-overview)
2. [Component Architecture](#component-architecture)
3. [Technical Implementation](#technical-implementation)
4. [File Storage & Management](#file-storage--management)
5. [Permission System](#permission-system)
6. [Wallet Integration](#wallet-integration)
7. [API Endpoints](#api-endpoints)

---

## User Flow Overview

### Sending a Video (User A - Sender)

```
1. Watch Video on PlayVideos Screen
         ↓
2. Tap "DOWNLOAD" Button
         ↓
3. Video Downloaded to Device
         ↓
4. Tap "Spred" Button
         ↓
5. Spred Component Renders
         ↓
6. Tap "Spred" (Send Mode)
         ↓
7. SpredSetup: Permission Checks
         ↓
8. Grant Required Permissions
         ↓
9. Start Discovering Peers
         ↓
10. Wait for Receiver to Connect
         ↓
11. Send File (P2P Transfer)
         ↓
12. Transfer Complete
```

### Receiving a Video (User B - Receiver)

```
1. Navigate to Any Video Screen
         ↓
2. Tap "Spred" Button
         ↓
3. Tap "Receive" Button
         ↓
4. SpredSetup: Permission Checks
         ↓
5. Grant Required Permissions
         ↓
6. Discover Available Peers
         ↓
7. Select Sender's Device
         ↓
8. Connection Established
         ↓
9. Tap "Start Receiving Video"
         ↓
10. File Transfer in Progress
         ↓
11. NGN 100 Deducted from Wallet
         ↓
12. Video Saved to Downloads
         ↓
13. Watch in Download Section
```

---

## Component Architecture

### 1. PlayVideos.tsx - Entry Point

**File Location**: `src/screens/PlayVideos/PlayVideos.tsx:419`

The journey begins when a user taps the "Spred" button on the video player screen.

```typescript
<CustomButton
  image={require('../../../assets/icons/spred-share.png')}
  title="Spred"
  width="98%"
  borderRadius={7}
  height={45}
  onPress={() => setShowSpred(!showSpred)}
/>
```

**Key Functionality**:
- Toggles `showSpred` state
- Renders the `Spred` component when activated
- Passes video metadata (`url`, `title`) to child components

### 2. Spred.tsx - Main Orchestrator

**File Location**: `src/screens/Spred/Spred.tsx`

The central hub that manages both send and receive modes.

#### State Management
```typescript
const [showSend, setShowSend] = useState(false);      // Toggle send interface
const [showReceive, setShowReceive] = useState(false); // Toggle receive interface
const [isVideoDownloaded, setIsVideoDownloaded] = useState(false);
const [downloadedVideoPath, setDownloadedVideoPath] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
```

#### Download Verification (Spred.tsx:37-75)

**Critical Function**: Checks if the video exists in local storage before allowing sharing.

```typescript
const checkIfVideoDownloaded = async () => {
  const safeFileName = createSafeFilename(title, url);
  const fileExtension = 'mp4';

  // Check both possible download folders
  const foldersToCheck = [
    'SpredVideos',        // Android 10+ folder (newer downloads)
    '.spredHiddenFolder'  // Older Android/iOS folder (legacy downloads)
  ];

  for (const folderName of foldersToCheck) {
    const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
    const filePath = `${folderPath}/${safeFileName}.${fileExtension}`;

    const fileExists = await RNFS.exists(filePath);

    if (fileExists) {
      setIsVideoDownloaded(true);
      setDownloadedVideoPath(filePath);
      return;
    }
  }
};
```

**UI States**:
1. **Main View** - Two primary buttons
2. **Send View** - `SpredSetup` wrapper with `SpredShare`
3. **Receive View** - `SpredSetup` wrapper with `Receive`

**Visual Feedback**:
- ✅ Green status: "Ready to SPRED" when video is downloaded
- ⚠️ Orange status: "Download Required" when video not found

### 3. SpredSetup.tsx - P2P Connection Manager

**File Location**: `src/screens/Spred/SpredSetup.tsx`

Manages WiFi P2P connection requirements and peer discovery.

#### Required Permissions & Settings

1. **WiFi Permissions** - Network access
2. **Location Services** - Required for WiFi Direct on Android
3. **WiFi Enabled** - Must be turned on
4. **WiFi Hotspot Disabled** - Conflicts with P2P mode

#### Permission Check Flow (SpredSetup.tsx:111-126)

```typescript
const refresh = () => {
  checkPermissions().then(setPermissionsEnabled);
  Promise.all([shouldEnableLocation(), isLocationEnabled()]).then(
    ([shouldEnable, enabled]) => {
      if (!shouldEnable) {
        setLocationEnabled(true);
      } else {
        setLocationEnabled(enabled);
      }
    },
  );
  isWifiEnabled().then(setWifiEnabled);
  isWifiHotspotEnabled().then(enabled => {
    setWifiHotspotDisabled(!enabled);
  });
};
```

#### P2P Initialization (SpredSetup.tsx:50-66)

```typescript
const init = async () => {
  try {
    await initialize();  // Initialize P2P module
  } catch (error) {
    showError(error);
  }

  try {
    await startDiscoveringPeers();
    peersSubscription = subscribeOnPeersUpdates(value => {
      console.log(value);
      setPeers(value.devices);
    });
  } catch (error) {
    showError(error);
  }
};
```

### 4. SpredShare.tsx - File Sender

**File Location**: `src/screens/SpredShare/SpredShare.tsx`

Handles the actual file transfer from sender to receiver.

#### Connection Management

```typescript
const connectionSubscription =
  subscribeOnConnectionInfoUpdates(setConnection);
const clientsSubscription = subscribeOnClientUpdated(value => {
  setClients(value.clients);
});
```

#### File Transfer Logic (SpredShare.tsx:39-74)

```typescript
const sendFile = async () => {
  const address = connection?.isGroupOwner
    ? clients[0]
    : connection?.groupOwnerAddress?.hostAddress;

  if (address) {
    const progressSub = subscribeOnFileSend(data => {
      setProgress(data.progress);
      console.log(`📊 SPRED: Send progress: ${data.progress}%`);
    });

    const data = await sendFileTo(downloadedVideoPath, address);
    progressSub.remove();

    Snackbar.show({
      text: `"${title || 'Video'}" sent successfully!`,
    });
  } else {
    showError('No valid peer address found');
  }
};
```

**Key Requirements**:
- ✅ Video must be downloaded locally
- ✅ Valid peer connection established
- ✅ Active group formed
- ✅ Progress tracking during transfer

### 5. Receive.tsx - File Receiver

**File Location**: `src/screens/Receive/Receive.tsx`

Manages the receiving end of P2P transfers.

#### Peer Discovery (Receive.tsx:79-82)

```typescript
useEffect(() => {
  getAvailablePeers().then(value => {
    setPeers(value.devices);
  });

  return () => {
    connectionSubscription.remove();
    peersSubscription.remove();
  };
}, []);
```

#### Connection Flow (Receive.tsx:36-42)

```typescript
const connectTo = async (peer: Device) => {
  try {
    await connect(peer.deviceAddress);
  } catch (error) {
    showError(error);
  }
};
```

#### File Reception (Receive.tsx:44-77)

```typescript
const startReceivingFile = async () => {
  const folder = `${RNFS.ExternalDirectoryPath}/SpredVideos`;

  const folderExists = await RNFS.exists(folder);
  if (!folderExists) {
    await RNFS.mkdir(folder);
  }

  const progressSub = subscribeOnFileReceive(data => {
    setProgress(data.progress);
    console.log(`📊 SPRED: Receive progress: ${data.progress}%`);
  });

  const data = await receiveFile(folder);
  progressSub.remove();

  Snackbar.show({
    text: 'Video received! Check your Downloads to watch it.',
    duration: Snackbar.LENGTH_LONG,
  });
};
```

**Post-Receive Process**:
1. Files saved to `SpredVideos/` folder
2. User notification displayed
3. Accessible via Download screen
4. Wallet deduction applied (NGN 100)

---

## Technical Implementation

### P2P Technology Stack

- **Local Package**: `.yalc/p2p-file-transfer` (custom native module)
- **Protocol**: WiFi Direct/P2P
- **Transfer Method**: Direct device-to-device via WiFi

### Required Android Permissions

```xml
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
<uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Native Module Functions

#### P2P File Transfer API

```typescript
// Initialization
initialize(): Promise<void>
startDiscoveringPeers(): Promise<void>
stopDiscoveringPeers(): Promise<void>
removeGroup(): Promise<void>

// Connection Management
connect(deviceAddress: string): Promise<void>
cancelConnect(): Promise<void>
subscribeOnPeersUpdates(callback: Function): EmitterSubscription
subscribeOnConnectionInfoUpdates(callback: Function): EmitterSubscription

// File Transfer
sendFileTo(filePath: string, address: string): Promise<any>
receiveFile(destinationFolder: string): Promise<any>
subscribeOnFileSend(callback: Function): EmitterSubscription
subscribeOnFileReceive(callback: Function): EmitterSubscription

// Utility
getAvailablePeers(): Promise<{devices: Device[]}>
checkPermissions(): Promise<boolean>
isWifiEnabled(): Promise<boolean>
isWifiHotspotEnabled(): Promise<boolean>
isLocationEnabled(): Promise<boolean>
shouldEnableLocation(): Promise<boolean>
```

---

## File Storage & Management

### Storage Directory Structure

```
Android/iOS External Directory/
├── SpredVideos/              # Modern location (Android 10+)
│   ├── video_title_1.mp4
│   ├── video_title_2.mp4
│   └── video_title_3.mp4
└── .spredHiddenFolder/       # Legacy location (older Android/iOS)
    ├── video_title_1.mp4
    ├── video_title_2.mp4
    └── video_title_3.mp4
```

### Filename Sanitization (Spred.tsx:18-35)

```typescript
const createSafeFilename = (title: string, originalUrl: string): string => {
  if (!title) {
    return getFileNameFromURL(originalUrl);
  }
  const safeTitle = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_')        // Replace spaces with underscores
    .substring(0, 50);           // Limit length
  return safeTitle || getFileNameFromURL(originalUrl);
};
```

**Rules**:
- Invalid characters removed: `<>:"/\\|?*`
- Spaces converted to underscores
- Maximum length: 50 characters
- Fallback to URL-derived filename if title missing

### Download Verification Logic

The system checks **both** directories to ensure maximum compatibility:

1. **Primary Check**: `SpredVideos/` (Android 10+)
2. **Fallback Check**: `.spredHiddenFolder` (legacy)
3. **Result**: Sets `isVideoDownloaded` state

This dual-check ensures:
- ✅ Backward compatibility with older downloads
- ✅ Support for modern Android storage
- ✅ iOS compatibility

---

## Permission System

### SpredSetup Permission Flow

The component performs **sequential checks** for all required permissions:

#### 1. Permissions Check (SpredSetup.tsx:78-85)

```typescript
const requestPermission = async () => {
  try {
    await requestPermissions();
    refresh(); // Re-check all permissions after requesting
  } catch (error) {
    showError(error);
  }
};
```

#### 2. WiFi Status (SpredSetup.tsx:87-93)

```typescript
const enableWlan = async () => {
  try {
    await openWifiSettings();
  } catch (error) {
    showError(error);
  }
};
```

#### 3. Hotspot Status (SpredSetup.tsx:95-101)

```typescript
const disableWlan = async () => {
  try {
    await openWifiHotspotSettings();
  } catch (error) {
    showError(error);
  }
};
```

#### 4. Location Status (SpredSetup.tsx:103-109)

```typescript
const enableLocation = async () => {
  try {
    await openLocationSettings();
  } catch (error) {
    showError(error);
  }
};
```

### UI Permission Prompts

Each permission displays a visual prompt with:

- **Icon**: Visual identifier
- **Button Text**: Clear action required
- **Status**: Enabled/Disabled state
- **Color Coding**: Orange for disabled, green for enabled

---

## Wallet Integration

### Transaction Model

**Receiving videos incurs a fee**: NGN 100 deducted from user's wallet.

```typescript
// Displayed to user in Receive.tsx:155-158
<CustomText fontSize={11} style={{ color: '#F45303', textAlign: 'center' }}>
  💰 NGN100 will be deducted from your wallet for receiving videos
</CustomText>
```

### SpredWallet Component (SpredWallet.tsx)

**Purpose**: Manage user wallet, balance, and transactions.

#### Wallet Initialization

The system attempts multiple endpoints to initialize wallet:

```typescript
const attempts = [
  {
    url: `https://www.spred.cc/api/Payment/Enquiry/create-wallet-byuserid`,
    payload: { userId: id }
  },
  {
    url: `https://www.spred.cc/api/Payment/Wallet/create-wallet`,
    payload: { userId: id }
  },
  // ... more attempts
];
```

#### API Calls

1. **Fetch Wallet Details**:
   ```typescript
   GET /api/Payment/Wallet/Get-wallet-by-User-Id/{userId}
   ```

2. **Fetch Virtual Account**:
   ```typescript
   GET /api/Payment/Enquiry/Get-Virtual-Account-By-Account-Reference/{reference}
   ```

3. **Fetch Balance**:
   ```typescript
   GET /api/Payment/Enquiry/Get-Available-Balance/{reference}?currency=NGN
   ```

#### Auto-Initialization Flow

If wallet doesn't exist (400 error with "customer doesnt exist"):

1. Try to initialize wallet via multiple endpoints
2. Retry fetching wallet details
3. Show success/error feedback
4. Allow manual refresh

---

## API Endpoints

### Video Download API

**Endpoint**: `{SPRED_BASE_URL}/ContentManager/Content/download-content`

**Method**: POST

**Headers**:
```typescript
{
  mobileAppByPassIVAndKey: 'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
  username: 'SpredMediaAdmin',
  password: 'SpredMediaLoveSpreding@2023',
  Authorization: `Bearer ${userToken}`
}
```

**Payload**:
```typescript
{
  bucketName: 'spredmedia-video-content',
  key: videoKey // or trailerKey
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    downloadUrl: 'https://signed-url-for-video.mp4',
    fileName: 'video-title.mp4'
  }
}
```

### Wallet APIs

#### Get Wallet Details
```
GET /api/Payment/Wallet/Get-wallet-by-User-Id/{userId}
```

#### Create Wallet
```
POST /api/Payment/Enquiry/create-wallet-byuserid
POST /api/Payment/Wallet/create-wallet
POST /api/Payment/Wallet/initialize-wallet
```

#### Get Virtual Account
```
GET /api/Payment/Enquiry/Get-Virtual-Account-By-Account-Reference/{reference}
```

#### Get Balance
```
GET /api/Payment/Enquiry/Get-Available-Balance/{reference}?currency=NGN
```

---

## State Management

### Component State

Each component maintains its own state for:

- **Spred.tsx**: Download status, UI mode (send/receive)
- **SpredSetup.tsx**: Permission states, peer list
- **SpredShare.tsx**: Connection info, transfer progress
- **Receive.tsx**: Available peers, receive progress

### Global State (Redux)

User authentication and tokens stored in:
- **AsyncStorage**: Redux Persist
- **Store**: User data, tokens, wallet details

### State Flow

```
User Authentication
         ↓
Fetch User Token
         ↓
Check Video Download Status
         ↓
P2P Connection Established
         ↓
File Transfer Progress
         ↓
Wallet Transaction (Receive only)
         ↓
Update Download Library
```

---

## Error Handling

### Common Error Scenarios

1. **Video Not Downloaded** (Spred.tsx:82-90)
   ```typescript
   Alert.alert(
     'Video Not Downloaded',
     'You can only SPRED videos that are downloaded to your device.'
   );
   ```

2. **Permission Denied** (SpredSetup.tsx:43-48)
   ```typescript
   const showError = (error: any) => {
     console.log(error);
     Snackbar.show({
       text: JSON.stringify(error),
     });
   };
   ```

3. **Connection Failed** (SpredShare.tsx:32-37)
   - No valid peer address
   - Group not formed
   - Transfer interrupted

4. **Wallet Not Initialized** (SpredWallet.tsx:316-334)
   - Shows error card
   - Auto-setup button
   - Support contact info

---

## Testing Considerations

### Test Scenarios

1. **Permission Testing**:
   - Grant/deny each permission individually
   - Test with location services disabled
   - Test with WiFi off
   - Test with hotspot enabled

2. **Transfer Testing**:
   - Download video → Send → Receive
   - Large file transfer (>100MB)
   - Interruption during transfer
   - Multiple concurrent transfers

3. **Wallet Testing**:
   - Insufficient balance
   - Wallet not initialized
   - Network error during transaction
   - Balance update after receive

### Debug Logs

The system provides extensive console logging:

```typescript
console.log('📤 SPRED: Sending downloaded file:', downloadedVideoPath);
console.log('📤 SPRED: Video title:', title);
console.log('📤 SPRED: Connection info:', { clients, connection, address });
console.log(`📊 SPRED: Send progress: ${data.progress}%`);
```

---

## Security Considerations

### Data Protection

1. **Local Storage Only**: Videos stored on device, not server
2. **WiFi Direct**: No internet required for transfer
3. **Authenticated APIs**: Bearer token for wallet operations
4. **Encrypted Headers**: Custom encryption for API calls

### Permission Model

WiFi Direct requires:
- ✅ Location access (for peer discovery)
- ✅ WiFi state access
- ✅ Network permissions

All permissions are **user-granted** with clear prompts.

---

## Performance Optimization

### File Transfer

- **Chunked Transfer**: Large files split into chunks
- **Progress Tracking**: Real-time UI updates
- **Background Processing**: Continues when app backgrounded (with limitations)

### Peer Discovery

- **Efficient Scanning**: Optimized peer search
- **Cached Peers**: Reduced repeated discovery
- **Auto-Stop**: Stops discovery after timeout

---

## Future Enhancements

### Potential Improvements

1. **Batch Transfer**: Send multiple videos at once
2. **Transfer History**: Track sent/received files
3. **QR Code Pairing**: Visual peer connection
4. **Compression**: Reduce transfer size/time
5. **Encryption**: End-to-end encrypted transfers
6. **Transfer Resumption**: Continue interrupted transfers

---

## Conclusion

The SPRED system provides a robust, peer-to-peer video sharing mechanism that:

- ✅ Enables offline video sharing without internet
- ✅ Integrates with wallet system for transactions
- ✅ Handles cross-platform compatibility
- ✅ Provides real-time transfer progress
- ✅ Manages complex permission flow
- ✅ Ensures downloaded content only

This implementation demonstrates a sophisticated P2P system built on React Native with native WiFi Direct support, creating a unique value proposition for the Spred platform.

---

## Key Files Reference

| File | Purpose | Key Function |
|------|---------|--------------|
| `src/screens/PlayVideos/PlayVideos.tsx` | Entry point | Button trigger (line 419) |
| `src/screens/Spred/Spred.tsx` | Main orchestrator | Download check (line 37) |
| `src/screens/Spred/SpredSetup.tsx` | P2P setup | Permission flow (line 78) |
| `src/screens/SpredShare/SpredShare.tsx` | File sender | Send logic (line 39) |
| `src/screens/Receive/Receive.tsx` | File receiver | Receive logic (line 44) |
| `src/screens/SpredWallet/SpredWallet.tsx` | Wallet management | Balance check (line 214) |
| `.yalc/p2p-file-transfer` | Native module | P2P API |
