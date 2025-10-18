# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` or `yarn start` - Start Metro bundler
- `npm run android` or `yarn android` - Run Android app
- `npm run ios` or `yarn ios` - Run iOS app
- `npm run lint` or `yarn lint` - Run ESLint
- `npm run type-check` or `yarn type-check` - Run TypeScript checks
- `npm test` or `yarn test` - Run Jest tests
- `npm run test:report` - Run tests with coverage report

### Platform-specific
- `npm run pod-install` - Install iOS CocoaPods with new architecture enabled
- `cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install` - Manual iOS pod install

## Project Architecture

This is a React Native application using modern patterns and technologies:

### Core Stack
- **React Native 0.73.5** with New Architecture (RCT_NEW_ARCH_ENABLED=1)
- **TypeScript** for type safety
- **Redux Toolkit + RTK Query** for state management and API calls
- **Redux Persist** with MMKV storage for persistence
- **React Navigation v6** (Stack + Bottom Tabs)
- **React Native Paper** for UI components
- **i18next** for internationalization

### Key Dependencies
- **P2P File Transfer**: Custom local package (`.yalc/p2p-file-transfer`)
- **Video Playback**: `react-native-video` with custom fullscreen player
- **Orientation**: `react-native-orientation-locker` for landscape video support
- **File System**: `react-native-fs` for file operations
- **Crypto**: `react-native-aes-crypto` and `crypto-js` for encryption
- **Storage**: `react-native-mmkv` for high-performance storage

### App Structure
```
src/
├── App.tsx                 # Root component with Redux/Persist setup
├── navigators/             # Navigation configuration
│   ├── Application.tsx     # Root navigator (Startup → Main)
│   ├── Main.tsx           # Main stack navigator (auth, screens)
│   └── BottomTab.tsx      # Bottom tab navigation
├── screens/               # All screen components
├── components/            # Reusable UI components
├── store/                 # Redux store configuration
├── services/              # API layer (RTK Query)
├── theme/                 # Theme system (fonts, colors, layout)
├── hooks/                 # Custom React hooks
├── helpers/               # Utilities and API helpers
└── translations/          # i18n resources
```

### Navigation Flow
1. **Application Navigator** → Startup screen → Main Navigator
2. **Main Navigator** → Authentication flow → Bottom Tab Dashboard
3. **Bottom Tab** → Primary app sections (Homepage, Spred, Download, etc.)

### State Management
- **Redux Store**: Configured with RTK, persistence, and API middleware
- **MMKV Storage**: High-performance alternative to AsyncStorage
- **API Layer**: RTK Query with base URL from `process.env.API_URL`
- **Theme**: Redux-managed theme with dark/light mode support

### Custom Features
- **Fullscreen Video Player**: Custom implementation with orientation support
- **P2P File Transfer**: Local package for peer-to-peer functionality
- **Crypto Operations**: AES encryption for secure data handling
- **Video Download System**: Premium content download with offline playback

### Configuration
- **Babel**: Module resolution with `@` alias pointing to `src/`
- **TypeScript**: Configured for React Native with custom type declarations
- **Environment**: Uses `react-native-dotenv` for environment variables
- **Testing**: Jest with React Native Testing Library setup

### File Organization Patterns
- Components export through `index.ts` barrel files
- Screens organized by feature folders
- Theme system with variable-based styling
- Translations organized by language with JSON resources

## Video Download System

This app features a comprehensive video download system for premium content:

### Download Flow
1. **User Initiates Download** (PlayVideos.tsx:172)
   - User taps "DOWNLOAD" button on video player
   - Shows `DownloadItems` component with quality options

2. **Authentication & API Process** (DownloadItems.tsx)
   - Loads user token and wallet details from AsyncStorage
   - Calls API: `POST https://www.spred.cc/Api/ContentManager/Content/download-content`
   - Sends payload: `bucketName: 'spredmedia-video-content'`, `key: trailerKey/videoKey`
   - Receives signed download URL from server

3. **File Download with Platform-Specific Storage**
   - **Android 10+**: App-specific directory (`ExternalDirectoryPath/SpredVideos/`)
   - **Older Android**: Requires storage permissions, uses hidden folder (`.spredHiddenFolder`)
   - **iOS**: App-specific directory (no permissions needed)
   - Uses `react-native-fs` for download with progress tracking
   - Saves files as `.mp4` with extracted filenames

4. **Downloaded Content Management** (Download.tsx)
   - Scans download folder for video files
   - Generates thumbnails using `react-native-create-thumbnail`
   - Lists videos with file sizes and metadata
   - Navigate to `PlayDownloadedVideos` for offline playback

### Key Download Components
- `DownloadItems.tsx`: Download interface with progress bar and API integration
- `Download.tsx`: Downloaded content browser with thumbnail generation
- `PlayDownloadedVideo/`: Offline video player for downloaded content

### Download Features
- Real-time progress tracking with percentage display
- Cross-platform file management (Android/iOS compatible)
- Thumbnail generation for video library
- Offline playback capability
- File size tracking and display
- Authentication-based premium content access

### Special Notes
- iOS requires `pod-install` script after dependency changes
- Video player supports fullscreen with automatic landscape orientation
- App uses MMKV instead of AsyncStorage for better performance
- Custom P2P functionality requires the yalc-linked local package
- Download system requires valid user authentication and wallet setup

## Spred Design System

### Color Palette

#### Primary Colors
- **Primary**: `#F45303` (Spred Orange) - Main CTAs, brand elements, active states
- **Secondary**: `#D69E2E` (Deep Amber) - Secondary actions, user profiles, gradients
- **Accent**: `#8B8B8B` (Sophisticated Grey) - Secondary text, inactive states, borders

#### Background & Surface Colors
- **Background Dark**: `#1A1A1A` - Main app background
- **Surface**: `#2A2A2A` - Card backgrounds, elevated surfaces
- **Text Primary**: `#FFFFFF` - Main text on dark backgrounds
- **Text Secondary**: `#CCCCCC` - Secondary text, labels
- **Text Accent**: `#8B8B8B` - Inactive text, placeholders

### Usage Rules

#### Primary Orange (#F45303)
- Main call-to-action buttons
- Logo and brand elements
- Active navigation states
- Key metrics and achievements
- Selected/active states

#### Secondary Amber (#D69E2E)
- Secondary buttons and actions
- User avatars and profiles
- Progress indicators (completed states)
- Highlighted content and quotes
- Gradient combinations with primary

#### Accent Grey (#8B8B8B)
- Secondary text and labels
- Inactive/disabled elements
- Borders and dividers
- Notification badges
- Subtle interactive elements

### Component Guidelines

#### Buttons
```css
/* Primary Button */
background: #F45303;
color: #FFFFFF;
hover: #E04502;

/* Secondary Button */
background: #D69E2E;
color: #FFFFFF;
hover: #C8932A;

/* Outline Button */
border: 2px solid #8B8B8B;
background: transparent;
color: #8B8B8B;
hover: background #8B8B8B, color #FFFFFF;

/* Ghost Button */
background: transparent;
color: #8B8B8B;
hover: background rgba(139, 139, 139, 0.1);
```

#### Cards & Surfaces
- Card backgrounds: `#2A2A2A`
- Border color: `#333333`
- Border radius: `12px` to `20px`
- Elevation: Subtle shadows using `rgba(0, 0, 0, 0.3)`

#### Typography Hierarchy
- **Headings**: `#FFFFFF` (white)
- **Body text**: `#CCCCCC` (light grey)
- **Secondary text**: `#8B8B8B` (accent grey)
- **Highlighted text**: `#D69E2E` (amber)

#### Progress & Status Indicators
- **Active progress**: `#F45303` or gradient `linear-gradient(90deg, #F45303, #D69E2E)`
- **Completed states**: `#D69E2E`
- **Inactive/pending**: `#8B8B8B`
- **Background track**: `#444444`

#### Navigation
- **Active tab/nav**: `#F45303` background
- **Inactive tab/nav**: `#8B8B8B` text
- **Hover states**: Lighten by 10-15%

### Design Principles

1. **Warm Dominance**: Use orange and amber as the primary warm palette
2. **Grey Balance**: Use grey strategically for sophistication and hierarchy
3. **High Contrast**: Ensure WCAG AA compliance on dark backgrounds
4. **Gradient Usage**: Combine primary and secondary for premium feel
5. **Consistent Spacing**: Use 8px grid system (8, 16, 24, 32px)

### Dark Theme Specifications

- Main background: `#1A1A1A`
- Elevated surfaces: `#2A2A2A`
- Borders and dividers: `#333333`
- Input backgrounds: `#2A2A2A`
- Modal overlays: `rgba(0, 0, 0, 0.8)`

### Accessibility Requirements

- Minimum contrast ratio 4.5:1 for normal text
- Minimum contrast ratio 3:1 for large text
- Focus indicators must use primary color `#F45303`
- Interactive elements minimum 44px touch target
- Color should not be the only way to convey information

### Brand Personality

This color system should convey:
- **Energy & Passion** (Orange primary)
- **Sophistication & Premium** (Amber secondary)
- **Professional & Reliable** (Strategic grey usage)
- **Modern & Clean** (Dark theme with high contrast)

### Implementation Notes

- Prefer gradients for major CTAs: `linear-gradient(135deg, #F45303, #D69E2E)`
- Use orange sparingly but boldly for maximum impact
- Grey should feel intentional, not just "missing color"
- Maintain warm personality while ensuring professional appearance
- Test all color combinations on actual dark backgrounds
- Consider hover/active states for all interactive elements
- ✅ P2P Re-Sharing Functionality Complete

  I've successfully implemented the ability for received videos to be shared again via P2P, creating a
  complete sharing ecosystem:

  🔄 Re-Sharing Capabilities Added

  1. Received Videos in File Selection
    - Added SpredP2PReceived folder to video scanning
    - Received videos now appear first in the file selection modal
    - Special 🔄 icon indicates previously received P2P videos
  2. Enhanced Video Modal
    - Shows count of received videos: 🔄 X received videos (P2P)
    - Prioritizes received videos at the top of selection list
    - Clear distinction between received, uploaded, and downloaded videos
  3. Smart Sorting Priority
    - Priority 1: Received videos (P2P) - 🔄
    - Priority 2: Uploaded videos - 📤
    - Priority 3: Downloaded videos - 📥

  🎯 User Experience Flow

  1. Receive Video: User receives encrypted video via P2P → stored in RECEIVED tab
  2. Re-Share Video: User can select received video from Spred sharing
  3. Chain Sharing: Creates viral sharing chains where videos spread between users
  4. Full Ecosystem: Complete P2P sharing network with viral capabilities

  🔒 Security & Encryption

  1. Double Encryption: Received videos are re-encrypted before re-sharing
  2. Secure Chain: Each transfer in the chain is independently encrypted
  3. App-Only Access: All videos remain within Spred's secure folders
  4. Audit Trail: Clear indication of video source (received, uploaded, downloaded)

  📱 Enhanced UI Elements

  1. Video Selection Modal
  🔒 Select Spred Video to Share

  🔄 2 received videos (P2P)
  📤 3 uploaded videos
  📥 5 downloaded videos
  🔐 All transfers are encrypted
  2. Video Selection Confirmation
    - Shows "🔄 Previously received via P2P" for received videos
    - Confirms "This video will be re-encrypted during P2P transfer"
    - Clear source folder identification
  3. Connected Screen Display
    - Shows received video type in file info
    - Indicates encrypted folder status
    - P2P chain awareness

  🚀 Navigation Integration

  1. Smart Navigation: "Check Received" button in no-videos alert
  2. Direct Tab Access: Navigate to Downloads with activeTab: 'received'
  3. Seamless Flow: Users can easily find received videos to re-share

  🔄 Viral Sharing Ecosystem

  This implementation creates a powerful viral sharing system:

  - User A shares original video → User B
  - User B can re-share to → User C
  - User C can continue chain → User D
  - Each transfer is independently encrypted and secure
  - Full traceability with source indicators

  💡 Key Benefits

  1. Viral Distribution: Videos can spread organically through user networks
  2. Secure Chains: Each hop maintains encryption and security
  3. Source Transparency: Users know if content was received vs original
  4. Complete Ecosystem: Downloads ↔ Uploads ↔ Received ↔ P2P Sharing
  5. User Empowerment: Received content can be actively shared forward

  The P2P sharing system is now a complete viral distribution network where users can share, receive,       
  and re-share content securely within the Spred ecosystem, creating organic content distribution chains    
   while maintaining end-to-end encryption at every step!
- Professional Livestream Showcase Platform - Complete Implementation

  Perfect! I've successfully implemented a complete livestream showcase platform for news and sports channels
  exactly as you requested. Here's what's been built:

  🎯 Core Implementation - Stream Aggregation Platform

  ✅ 1. LiveStream Player Component

  - Full-screen video player optimized for live content
  - HLS/DASH protocol support via react-native-video
  - Professional UI with live indicators, viewer counts, and channel branding
  - Error handling for offline streams
  - Low-latency buffering optimized for live content
  - Touch controls with auto-hide functionality

  ✅ 2. Channel Manager for Broadcasters

  - Simple input system for stream URLs (HLS .m3u8 or DASH .mpd)
  - Category selection: News, Sports, Entertainment, Gaming, Music, Talk Show
  - Live toggle to go online/offline instantly
  - Stream validation ensures proper HLS/DASH URLs
  - Local storage for channel management
  - Professional broadcaster interface

  ✅3. Homepage Integration

  - Live channel showcase with viewer counts and categories
  - Seamless navigation from homepage to full-screen player
  - Professional live indicators with Spred branding
  - Demo streams ready for testing

  ✅ 4. Navigation System

  - LiveStream screen added to main navigation
  - Full-screen experience with no headers or tabs
  - Smooth transitions between homepage and live player

  ---
  🚀 How It Works for Broadcasters:

  Step 1: Channel Setup

  // Broadcaster provides their stream URL
  const channelData = {
    channelName: "CNN Sports Live",
    category: "Sports",
    streamUrl: "https://cnn-sports.com/live/stream.m3u8", // Their HLS stream
    isLive: true,
    estimatedViewers: 15000
  };

  Step 2: Stream Integration

  - No complex setup - just provide the HLS/DASH URL
  - Instant go-live - toggle switch to broadcast
  - Global reach - Spred handles the viewer experience

  Step 3: Professional Playback

  - High-quality streaming via react-native-video
  - Professional UI with channel branding
  - Real-time viewer engagement

  ---
  🎬 Technical Architecture:

  graph TD
      A[News/Sports Channel] -->|Provides HLS URL| B[ChannelManager]
      B --> C[Channel Database Storage]
      C --> D[Homepage Live Section]
      D -->|User Taps Live Stream| E[LiveStreamPlayer]
      E -->|Fetches HLS Stream| F[Broadcaster's CDN]
      F -->|Direct Stream| G[react-native-video]

  📱 User Experience Flow:

  1. Discovery: Users see live channels on homepage with viewer counts
  2. Selection: Tap on any live channel to start watching
  3. Viewing: Full-screen professional live streaming experience
  4. Engagement: Live viewer counts and channel information

  ---
  🔧 Implementation Benefits:

  For Spred Platform:

  - ✅ No infrastructure costs - broadcasters handle streaming
  - ✅ Instant scalability - unlimited channels can join
  - ✅ Professional showcase - premium live content experience
  - ✅ Simple maintenance - minimal technical complexity

  For Broadcasters:

  - ✅ Easy onboarding - just provide stream URL
  - ✅ Global audience - reach Spred's user base
  - ✅ Professional presentation - branded channel experience
  - ✅ Real-time control - instant on/off streaming

  For Users:

  - ✅ Premium content - access to live news and sports
  - ✅ Professional quality - full-screen optimized experience
  - ✅ Instant access - no buffering or delays
  - ✅ Seamless integration - part of main Spred app

  ---
  🎯 Ready to Launch:

  The livestream showcase platform is production-ready:

  ✅ Components: LiveStreamPlayer, ChannelManager created✅ Navigation: LiveStream screen integrated✅ Demo Content:    
   Working HLS streams for testing✅ UI/UX: Professional broadcast experience✅ Error Handling: Graceful offline        
  stream management

  Next Steps for Production:
  1. Broadcaster Onboarding: Contact news/sports channels to provide their HLS URLs
  2. Content Curation: Verify stream quality and reliability
  3. API Integration: Connect to backend for dynamic channel management (optional)
  4. Analytics: Track viewer engagement and popular channels

  The platform provides exactly what you requested - a simple, professional livestream showcase that allows news and    
   sports channels to broadcast to Spred users by just providing their streaming URLs! 🚀📺