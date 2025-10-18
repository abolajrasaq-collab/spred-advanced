# SPRED - P2P File Sharing Application

## Project Overview

SPRED is a React Native Android application designed for peer-to-peer (P2P) file sharing using WiFi Direct technology. The application allows users to share files directly between Android devices without requiring internet connectivity, making use of native WiFi Direct APIs for secure, fast file transfers.

### Key Technologies
- **React Native** (v0.73.5) - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **Redux Toolkit** - State management with persistence
- **React Navigation** - Screen navigation
- **React Native Paper** - UI components and theming
- **Native WiFi Direct** - P2P file transfer implementation
- **P2P File Transfer Module** - Custom native module for WiFi Direct

### Core Features
- P2P file sharing via WiFi Direct
- QR code-based device pairing
- Real-time transfer progress tracking
- Dark theme UI with custom color palette
- Secure local file sharing without internet
- Performance-optimized architecture

### Design System
The application uses a sophisticated dark theme with a warm color palette:
- **Primary**: `#F45303` (Spred Orange) - Main CTAs, brand elements
- **Secondary**: `#D69E2E` (Deep Amber) - Secondary actions, user profiles
- **Accent**: `#8B8B8B` (Sophisticated Grey) - Secondary text, borders

## Building and Running

### Prerequisites
- Node.js (>=18)
- Android Studio with Android SDK
- Android device or emulator with Android 8.0+ (API 26+)
- Android device must support WiFi Direct
- Location services enabled on device

### Setup Commands
```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Build and run on Android
npm run android

# Run iOS (if available)
npm run ios
```

### Direct APK Build
```bash
# On Mac/Linux
./build-apk.sh

# On Windows
build-apk.bat
```

### Development Scripts
- `npm run android` - Build and run on Android device
- `npm run ios` - Build and run on iOS device
- `npm start` - Start Metro bundler
- `npm run lint` - Run ESLint
- `npm run test` - Run Jest tests
- `npm run type-check` - Run TypeScript compiler
- `npm run pod-install` - Install iOS pods (for iOS)
- `npm run test:report` - Generate test coverage reports

## Architecture

### Folder Structure
- `android/` - Android native code and configuration
- `ios/` - iOS native code and configuration (if available)
- `src/` - Main React Native application source
  - `components/` - Reusable UI components
  - `screens/` - Application screens
  - `services/` - Business logic and API services
  - `store/` - Redux state management
  - `theme/` - Theme and styling
  - `utils/` - Utility functions
  - `navigators/` - Navigation configuration
  - `types/` - TypeScript type definitions
- `assets/` - Static assets (images, fonts, etc.)
- `node_modules/` - Dependencies

### Key Services
- **UnifiedP2PService.ts** - Handles P2P WiFi Direct functionality
- **PerformanceManager** - Optimizes app performance
- **AnalyticsService** - Tracks app usage (disabled for performance)
- **Redux Store** - Manages app state with persistence using MMKV

### Native Module Integration
The P2P functionality is implemented through a custom native module:
- `P2PFileTransferModule.kt` - Core WiFi Direct implementation
- `P2PFileTransferPackage.kt` - React Native bridge
- Proper permissions configured in AndroidManifest.xml

## Development Conventions

### Code Style
- TypeScript with strict typing
- React hooks for state management
- Redux Toolkit for global state
- ESLint and Prettier for code formatting
- Airbnb style guide with React Native extensions

### Testing
- Jest for unit testing
- React Native Testing Library for component testing
- Test coverage reports available

### Performance Optimization
- Lazy loading of modules
- Efficient state management
- Memory management and cleanup
- Background processing for file transfers

## P2P Functionality

### Connection Flow
1. QR code generation on sender device
2. QR code scanning on receiver device
3. WiFi Direct discovery between devices
4. Direct P2P connection establishment
5. Encrypted file transfer over WiFi Direct
6. Real-time progress tracking

### Required Permissions
- `ACCESS_WIFI_STATE` - Access WiFi state
- `CHANGE_WIFI_STATE` - Change WiFi state
- `ACCESS_COARSE_LOCATION` - Location for WiFi Direct
- `NEARBY_WIFI_DEVICES` - Access nearby WiFi devices (Android 12+)
- `ACCESS_FINE_LOCATION` - Fine location (up to Android 11)

### Device Requirements
- Android 8.0+ (API level 26+) for WiFi Direct support
- WiFi enabled on both devices
- Location services enabled on both devices
- Camera permission for QR code scanning
- Storage permissions for file transfers

## Key Files
- `index.js` - Application entry point
- `src/App.tsx` - Main application component
- `package.json` - Dependencies and scripts
- `app.json` - Application configuration
- `android/app/src/main/AndroidManifest.xml` - Android permissions and configuration
- `tsconfig.json` - TypeScript configuration
- `metro.config.js` - Metro bundler configuration
- `.env` - Environment variables

## Troubleshooting

### Common Issues
- **P2P not working**: Ensure location services and WiFi are enabled on both devices
- **QR codes not scanning**: Check camera permissions
- **Connection timeouts**: Ensure devices are within WiFi Direct range (10-20 meters)
- **Build errors**: Clean build with `cd android && ./gradlew clean && cd ..`

### Performance Considerations
- The app suppresses development warnings for better performance
- Redux Flipper integration is disabled to reduce bundle size
- Feature highlights are disabled per user request
- Performance Manager optimizes heavy components

## Production Notes
The application is configured for production with:
- Redux persistence using MMKV
- Performance optimizations
- Error handling without development-specific features
- Proper permission handling
- Secure file transfer implementation

## Qwen Added Memories
- SPRED P2P file sharing application improvement suggestions include: 1) Performance & Architecture: bundle size optimization, better memory management, enhanced caching strategy; 2) UX: connection reliability, transfer management, UI improvements; 3) Security: password protection, file encryption, authentication; 4) Features: multi-file transfers, scheduling, cross-platform options; 5) Technical: testing, logging, network optimization; 6) Code Quality: modularity, documentation; 7) Accessibility: i18n support, RTL layouts.
