// import 'react-native-gesture-handler';
// import { logger } from './utils/ProductionLogger';

// EMERGENCY PATCH: Apply permission API patch BEFORE any other imports
// This prevents the native permission crash that occurs when permission methods return null
import './utils/PermissionPatch';

// TextEncoder polyfill for QR code library
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('text-encoding-polyfill').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('text-encoding-polyfill').TextDecoder;
}
import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { store, persistor } from './store';
import ApplicationNavigator from './navigators/Application';
import './translations';
import { PaperProvider } from 'react-native-paper';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './theme/ThemeProvider';
// Performance Optimizations - React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/QueryClient';
import FastStorage from './services/FastStorage';
// Performance Manager
import PerformanceManager from './services/PerformanceManager';
// Permission Handler
import { PermissionHandler } from './utils/PermissionHandler';
// Receiver Mode Manager
import ReceiverModeManager from './services/ReceiverModeManager';
// URL Handler for spred:// protocol
import URLHandlerService from './services/URLHandlerService';
// Performance Optimizations
import { LogBox } from 'react-native';
// High Contrast Provider for UniversalTouchable accessibility - DISABLED
// import { HighContrastProvider } from './components/UniversalButton/AccessibilitySystem/HighContrastProvider';
// Simple Real-time Monitoring Dashboard - DISABLED
// import SimpleMonitoringDashboard from './components/SimpleMonitoringDashboard/SimpleMonitoringDashboard';
// Debug Login Component - REMOVED
// import DebugLogin from './components/DebugLogin/DebugLogin';
// DISABLED FOR PERFORMANCE
// import AppInitializationService from './services/AppInitializationService';
// import AnalyticsService from './services/AnalyticsService';
// import PerformanceMonitoringService from './services/PerformanceMonitoringService';
// import { FeatureHighlights } from './components';

const App = () => {
  // Initialize immediately - no useState needed for synchronous init
  // const [appInitialized, setAppInitialized] = useState(true);

  // Initialize global performance manager and request permissions
  React.useEffect(() => {
    // Disable performance warnings for better UX
    LogBox.ignoreLogs([
      'VirtualizedLists should never be nested',
      'Warning: componentWillReceiveProps',
      'Warning: componentWillMount',
    ]);

    // Initialize FastStorage for performance
    const fastStorage = FastStorage.getInstance();
    fastStorage.preloadCriticalData();

    const performanceManager = PerformanceManager.getInstance();

    // Optimize for app startup
    performanceManager.optimizeForHeavyComponent('App');
    
    // Set performance mode to high for better responsiveness
    performanceManager.setPerformanceMode('high');

    // Request permissions on app startup with new auto permission system
    const requestPermissions = async () => {
      try {
        console.log('🔐 Initializing automatic permission system...');
        
        // Import the new permission service
        const { default: PermissionInitializationService } = await import('./services/PermissionInitializationService');
        const permissionService = PermissionInitializationService.getInstance();
        
        // Add a small delay to ensure the app is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await permissionService.initializePermissions();
        
        console.log('📊 Permission initialization result:', {
          success: result.success,
          hasAllPermissions: result.hasAllPermissions,
          hasCriticalPermissions: result.hasCriticalPermissions,
          canUseCoreFeatures: result.canUseCoreFeatures,
          deniedCount: result.deniedPermissions.length,
        });

        if (result.success) {
          if (result.hasCriticalPermissions) {
            console.log('✅ All critical permissions granted - full functionality available');
          } else {
            console.log('⚠️ Some critical permissions missing - limited functionality');
          }
        } else {
          console.log('❌ Permission initialization failed - using fallback mode');
        }
      } catch (error) {
        console.error('❌ Permission initialization failed:', error);
        // Don't block app startup if permissions fail
        console.log('⚠️ Continuing app startup despite permission errors');
      }
    };

    // Request permissions after a short delay to ensure app is ready
    setTimeout(requestPermissions, 1000);

    // Initialize ReceiverModeManager for background sharing
    const initializeReceiverMode = async () => {
      try {
        console.log('📥 Initializing receiver mode...');
        const receiverManager = ReceiverModeManager.getInstance();
        
        // Add a delay to ensure permissions are requested first
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const initialized = await receiverManager.initialize();
        
        if (initialized) {
          console.log('✅ Receiver mode initialized successfully');
        } else {
          console.warn('⚠️ Receiver mode initialization failed, but app continues normally');
        }
      } catch (error) {
        console.error('❌ Receiver mode initialization error:', error);
        // Don't block app startup if receiver mode fails
        console.log('⚠️ Continuing app startup despite receiver mode errors');
      }
    };

    // Initialize receiver mode after permissions - DISABLED to prevent crashes
    // setTimeout(initializeReceiverMode, 2500);
    console.log('📥 Receiver mode initialization disabled - use floating button instead');

    // Initialize URL handler for spred:// protocol
    const initializeURLHandler = async () => {
      try {
        console.log('🔗 Initializing URL handler for spred:// protocol...');
        const urlHandler = URLHandlerService.getInstance();
        urlHandler.initialize();
        console.log('✅ URL handler initialized successfully');
      } catch (error) {
        console.error('❌ URL handler initialization error:', error);
      }
    };

    // Initialize URL handler after a short delay
    setTimeout(initializeURLHandler, 500);

    return () => {
      // Cleanup on app unmount
      performanceManager.forceCleanup();
      
      // Cleanup receiver mode
      ReceiverModeManager.getInstance().cleanup().catch(error => {
        console.error('❌ Error cleaning up receiver mode:', error);
      });

      // Cleanup URL handler
      URLHandlerService.getInstance().cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SafeAreaProvider>
          <ThemeProvider>
            {/* HighContrastProvider - DISABLED */}
            {/* <HighContrastProvider> */}
              <PaperProvider>
                <PersistGate loading={null} persistor={persistor}>
                        <ApplicationNavigator />
                        {/* Simple Real-time Monitoring Dashboard - DISABLED */}
                        {/* <SimpleMonitoringDashboard position="floating" /> */}
                        {/* Feature Highlights - DISABLED per user request */}
                </PersistGate>
              </PaperProvider>
            {/* </HighContrastProvider> */}
          </ThemeProvider>
        </SafeAreaProvider>
      </Provider>
    </QueryClientProvider>
  );
};

export default App;
