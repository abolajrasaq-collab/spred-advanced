# Design Document

## Overview

This design addresses the critical crash issue in the SPRED app's Nearby API Test Lab where pressing "TEST 1" causes a null pointer exception in the Android permissions system. The solution implements robust error handling, safe permission checking, and automatic fallback mechanisms to ensure app stability while maintaining full functionality through mock mode when needed.

## Architecture

### Current Problem Analysis

The crash occurs in the following sequence:
1. User presses "TEST 1" → `testBasicSharing()` → `setShowSharingModal(true)`
2. `UniversalSharingModal` renders → `useEffect` triggers → `startSharing()`
3. `CrossPlatformSharingService.shareVideo()` → `tryNearbySharing()`
4. `NearbyService.initialize()` → `checkPermissions()` → **CRASH**

The crash happens in `NearbyService.checkPermissions()` when:
- `PermissionsAndroid.requestMultiple()` returns null or undefined
- The code tries to use `Object.values(results)` on a null object
- This causes a null pointer exception that crashes the app

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Safe Permission Layer                     │
├─────────────────────────────────────────────────────────────┤
│  • Null-safe permission checking                           │
│  • Try-catch wrappers around all permission calls          │
│  • Graceful degradation on permission failures             │
│  • Automatic fallback to mock mode                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Enhanced Error Handling                    │
├─────────────────────────────────────────────────────────────┤
│  • Comprehensive error catching in all service layers      │
│  • User-friendly error messages                            │
│  • Detailed logging for debugging                          │
│  • State preservation during errors                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                 Automatic Fallback System                   │
├─────────────────────────────────────────────────────────────┤
│  • Real API → Mock Mode fallback                           │
│  • Clear user notification of mode switches                │
│  • Full functionality preservation in mock mode            │
│  • Runtime mode detection and switching                    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. SafePermissionManager

A new utility class that wraps all permission operations:

```typescript
interface SafePermissionManager {
  checkPermissions(permissions: string[]): Promise<PermissionResult>
  requestPermissions(permissions: string[]): Promise<PermissionResult>
  isPermissionGranted(permission: string): Promise<boolean>
}

interface PermissionResult {
  success: boolean
  granted: string[]
  denied: string[]
  error?: string
}
```

### 2. Enhanced NearbyService

Updated with safe permission handling:

```typescript
interface EnhancedNearbyService extends NearbyService {
  initializeSafely(): Promise<InitializationResult>
  checkPermissionsSafely(): Promise<PermissionResult>
  requestPermissionsSafely(): Promise<PermissionResult>
}

interface InitializationResult {
  success: boolean
  mode: 'real' | 'mock'
  reason?: string
  error?: string
}
```

### 3. Fallback Detection System

```typescript
interface FallbackDetector {
  detectCapabilities(): Promise<CapabilityResult>
  shouldUseMockMode(): boolean
  getRecommendedMode(): 'real' | 'mock'
}

interface CapabilityResult {
  permissionsAvailable: boolean
  nativeModulesAvailable: boolean
  platformSupported: boolean
  recommendedMode: 'real' | 'mock'
  issues: string[]
}
```

## Data Models

### Permission Status Model

```typescript
interface PermissionStatus {
  permission: string
  status: 'granted' | 'denied' | 'never_ask_again' | 'unknown' | 'error'
  required: boolean
  description: string
}

interface PermissionSummary {
  allGranted: boolean
  requiredGranted: boolean
  statuses: PermissionStatus[]
  canProceed: boolean
  issues: string[]
}
```

### Error Context Model

```typescript
interface ErrorContext {
  operation: string
  component: string
  timestamp: number
  platform: string
  error: {
    message: string
    stack?: string
    code?: string
    nativeError?: any
  }
  context: {
    permissions?: PermissionSummary
    mode?: 'real' | 'mock'
    capabilities?: CapabilityResult
  }
}
```

## Error Handling Strategy

### 1. Permission Error Handling

```typescript
// Safe permission checking pattern
async function checkPermissionsSafely(): Promise<PermissionResult> {
  try {
    // Validate PermissionsAndroid is available
    if (!PermissionsAndroid || typeof PermissionsAndroid.requestMultiple !== 'function') {
      return { success: false, granted: [], denied: [], error: 'PermissionsAndroid not available' }
    }

    const permissions = [/* permission list */]
    const results = await PermissionsAndroid.requestMultiple(permissions)
    
    // Null safety check
    if (!results || typeof results !== 'object') {
      return { success: false, granted: [], denied: [], error: 'Permission request returned null' }
    }

    // Safe processing of results
    const granted = []
    const denied = []
    
    for (const permission of permissions) {
      const status = results[permission]
      if (status === PermissionsAndroid.RESULTS.GRANTED) {
        granted.push(permission)
      } else {
        denied.push(permission)
      }
    }

    return { success: true, granted, denied }
  } catch (error) {
    return { 
      success: false, 
      granted: [], 
      denied: [], 
      error: `Permission check failed: ${error.message}` 
    }
  }
}
```

### 2. Service Initialization Error Handling

```typescript
async function initializeWithFallback(): Promise<InitializationResult> {
  try {
    // Attempt real API initialization
    const realResult = await initializeRealAPI()
    if (realResult.success) {
      return { success: true, mode: 'real' }
    }
  } catch (error) {
    logger.warn('Real API initialization failed, falling back to mock mode', error)
  }

  // Fallback to mock mode
  try {
    await initializeMockMode()
    return { 
      success: true, 
      mode: 'mock', 
      reason: 'Real API unavailable - using mock mode for testing' 
    }
  } catch (error) {
    return { 
      success: false, 
      mode: 'mock', 
      error: `Both real and mock initialization failed: ${error.message}` 
    }
  }
}
```

### 3. UI Error Handling

```typescript
// Enhanced modal error handling
const handleSharingError = (error: ErrorContext) => {
  // Log detailed error for debugging
  logger.error('Sharing failed with detailed context:', error)
  
  // Show user-friendly message
  const userMessage = getUserFriendlyErrorMessage(error)
  setModalMode('error')
  setErrorMessage(userMessage)
  
  // Preserve UI state
  setShowSharingModal(true) // Keep modal open to show error
}

const getUserFriendlyErrorMessage = (error: ErrorContext): string => {
  if (error.operation === 'permission_check') {
    return 'Unable to access device permissions. The app will use test mode instead.'
  }
  if (error.operation === 'nearby_init') {
    return 'Nearby sharing is not available on this device. Using QR code sharing instead.'
  }
  return 'Something went wrong, but you can still test the sharing features.'
}
```

## Testing Strategy

### 1. Permission Testing

- **Null Permission Results**: Test behavior when `PermissionsAndroid.requestMultiple()` returns null
- **Permission Denial**: Test graceful handling when all permissions are denied
- **Partial Permissions**: Test behavior when some permissions are granted, others denied
- **Permission API Unavailable**: Test fallback when `PermissionsAndroid` is undefined

### 2. Fallback Testing

- **Real to Mock Fallback**: Verify automatic switching when real API fails
- **Mock Mode Functionality**: Ensure all features work in mock mode
- **Mode Indicator**: Verify UI correctly shows current mode
- **Error Messages**: Test user-friendly error message display

### 3. Error Recovery Testing

- **State Preservation**: Ensure UI state is maintained during errors
- **Retry Functionality**: Test retry mechanisms after errors
- **Logging Verification**: Verify comprehensive error logging
- **Multiple Error Scenarios**: Test handling of cascading errors

## Implementation Plan

### Phase 1: Safe Permission Layer
1. Create `SafePermissionManager` utility class
2. Implement null-safe permission checking methods
3. Add comprehensive error handling and logging
4. Update `NearbyService` to use safe permission methods

### Phase 2: Enhanced Error Handling
1. Add try-catch blocks around all critical operations
2. Implement user-friendly error message system
3. Add detailed error logging with context
4. Update UI components to handle errors gracefully

### Phase 3: Automatic Fallback System
1. Implement capability detection system
2. Add automatic real-to-mock mode switching
3. Update UI to show current mode and status
4. Add manual mode switching with warnings

### Phase 4: Testing and Validation
1. Test all error scenarios on physical devices
2. Verify fallback mechanisms work correctly
3. Validate user experience during errors
4. Ensure comprehensive logging for debugging

This design ensures that the app will never crash due to permission issues while maintaining full functionality through robust fallback mechanisms.