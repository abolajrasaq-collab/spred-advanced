# Spred Mobile App Documentation

Welcome to the comprehensive documentation for the Spred Mobile App - a React Native application for streaming premium video content with P2P sharing capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm/yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation
```bash
# Clone the repository
git clone [repository-url]
cd spre_mobile_app

# Install dependencies
yarn install

# iOS specific setup
cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install

# Start Metro bundler
yarn start

# Run on Android
yarn android

# Run on iOS
yarn ios
```

## 📖 Documentation Sections

### [API Reference](./generated/index.html)
Complete API documentation generated from code comments using JSDoc.

### [Testing Guide](../TESTING.md)
Comprehensive guide for testing components, utilities, and integration tests.

### [Architecture Overview](#architecture)
High-level overview of the app architecture and design patterns.

### [Security Guidelines](#security)
Security best practices and implementation details.

### [Performance Guide](#performance)
Performance optimization techniques and monitoring.

### [Accessibility Guide](#accessibility)
Accessibility features and compliance guidelines.

---

## 🏗️ Architecture

### Tech Stack
- **React Native 0.73.5** with New Architecture
- **TypeScript** for type safety
- **Redux Toolkit + RTK Query** for state management
- **React Navigation v6** for navigation
- **React Native Paper** for UI components
- **i18next** for internationalization

### Project Structure
```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components
├── navigators/         # Navigation configuration
├── services/           # API and business logic
├── store/              # Redux store and slices
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── theme/              # Theme and styling
└── translations/       # i18n resources
```

### Key Features
- **Video Streaming**: Premium content with offline capabilities
- **P2P Sharing**: Peer-to-peer file transfer
- **Digital Wallet**: In-app payment system
- **Download System**: Offline video playback
- **User Authentication**: Secure login and registration
- **Multi-language Support**: i18next integration

---

## 🔒 Security

### Security Features Implemented

#### Input Validation & Sanitization
- XSS prevention through input sanitization
- SQL injection protection
- Pattern-based validation for emails, passwords, etc.

#### Authentication & Session Management
- JWT token-based authentication
- Secure session management with automatic expiration
- Failed login attempt tracking and account locking

#### Data Protection
- AES encryption for sensitive data
- HMAC signatures for data integrity
- Secure storage using platform-specific keychains

#### Rate Limiting
- API rate limiting to prevent abuse
- Configurable request limits per time window

### Security Best Practices
1. Always sanitize user input before processing
2. Use HTTPS for all API communications
3. Implement proper error handling without exposing sensitive information
4. Regularly rotate encryption keys and tokens
5. Monitor and log security events

---

## ⚡ Performance

### Performance Optimizations

#### Rendering Performance
- React.memo for expensive components
- useMemo and useCallback for optimization
- Lazy loading for large lists
- Image optimization and caching

#### Bundle Optimization
- Code splitting for large screens
- Dynamic imports for non-critical features
- Asset optimization (images, videos)

#### Memory Management
- Proper cleanup of event listeners
- Image cache management
- Efficient data structures

#### Network Performance
- Request caching and deduplication
- Optimistic updates for better UX
- Background synchronization

### Performance Monitoring
The app includes comprehensive performance monitoring:
- Component render time tracking
- API call performance metrics
- Memory usage monitoring
- User interaction responsiveness

---

## ♿ Accessibility

### Accessibility Features

#### Screen Reader Support
- Comprehensive accessibility labels and hints
- Proper semantic roles for all interactive elements
- Announcements for state changes

#### Visual Accessibility
- High contrast mode support
- Scalable font sizes
- Color-blind friendly design

#### Motor Accessibility
- Minimum touch target sizes (44x44pt)
- Gesture alternatives for complex interactions
- Keyboard navigation support

#### Cognitive Accessibility
- Clear navigation patterns
- Consistent UI elements
- Progressive disclosure of complex features

### WCAG 2.1 Compliance
The app aims for WCAG 2.1 Level AA compliance:
- Color contrast ratios meet AA standards
- Text is resizable up to 200% without loss of functionality
- Content is accessible via keyboard
- Focus indicators are clearly visible

---

## 🧪 Testing

### Testing Strategy

#### Unit Tests
- Individual component testing
- Utility function testing
- Service layer testing
- 70%+ code coverage requirement

#### Integration Tests
- Screen flow testing
- API integration testing
- Navigation testing

#### Accessibility Testing
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation
- Touch target size verification

#### Performance Tests
- Component render time benchmarks
- Memory usage validation
- Bundle size monitoring

### Test Utilities
The app includes comprehensive testing utilities:
- Mock data factories for consistent test data
- Custom matchers for React Native-specific assertions
- Performance testing helpers
- Accessibility testing tools

---

## 🎨 Design System

### Color Palette
- **Primary**: #F45303 (Spred Orange)
- **Secondary**: #D69E2E (Deep Amber)
- **Accent**: #8B8B8B (Sophisticated Grey)
- **Background**: #1A1A1A (Dark)
- **Surface**: #2A2A2A (Elevated)

### Typography
- **Headings**: Various weights (400-700) for hierarchy
- **Body Text**: 16px base size with 1.5 line height
- **Scalable**: Supports dynamic type sizing

### Spacing System
- Base unit: 8px
- Scale: 4px, 8px, 16px, 24px, 32px, 48px

### Component Guidelines
All components follow consistent patterns:
- Prop interfaces with TypeScript
- Accessibility props by default
- Theme-aware styling
- Performance optimizations

---

## 🔧 Development Tools

### Code Quality
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety
- **Husky**: Git hooks for quality checks

### Development Workflow
1. Feature branch from main
2. Implement with tests
3. Code review process
4. Automated testing pipeline
5. Merge to main

### Debugging Tools
- React Native Debugger integration
- Performance monitoring dashboard
- Error tracking and reporting
- Accessibility testing tools

---

## 📱 Platform-Specific Features

### iOS
- Keychain Services for secure storage
- Background app refresh
- Push notifications
- App Store compliance

### Android
- Keystore for secure storage
- Background processing
- Firebase messaging
- Play Store compliance

---

## 🌐 Internationalization

### Supported Languages
- English (default)
- French
- Additional languages can be easily added

### Implementation
- i18next for translation management
- Namespace-based organization
- Dynamic language switching
- RTL support ready

---

## 🚢 Deployment

### Build Process
```bash
# Android Release Build
cd android && ./gradlew assembleRelease

# iOS Release Build
cd ios && xcodebuild -workspace spred.xcworkspace -scheme spred archive
```

### Environment Configuration
- Development: `.env.development`
- Staging: `.env.staging`
- Production: `.env.production`

### CI/CD Pipeline
- Automated testing on pull requests
- Build verification
- Deployment to app stores
- Performance monitoring

---

## 📞 Support & Contributing

### Getting Help
- Check the [FAQ](./FAQ.md)
- Review [common issues](./TROUBLESHOOTING.md)
- Contact the development team

### Contributing
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

### Code Standards
- Follow TypeScript best practices
- Write comprehensive tests
- Document public APIs
- Follow the established patterns

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

## 🔄 Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and release notes.