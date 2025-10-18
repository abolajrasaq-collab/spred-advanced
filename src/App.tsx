// import 'react-native-gesture-handler';
// import { logger } from './utils/ProductionLogger';
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
// Performance Manager
import PerformanceManager from './services/PerformanceManager';
// Permission Handler
import { PermissionHandler } from './utils/PermissionHandler';
// Performance Optimizations
import { LogBox } from 'react-native';
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

    const performanceManager = PerformanceManager.getInstance();

    // Optimize for app startup
    performanceManager.optimizeForHeavyComponent('App');
    
    // Set performance mode to high for better responsiveness
    performanceManager.setPerformanceMode('high');

    // Request permissions on app startup
    const requestPermissions = async () => {
      try {
        console.log('🔐 Requesting app permissions...');
        const permissionHandler = PermissionHandler.getInstance();
        
        // Add a small delay to ensure the app is fully initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const results = await permissionHandler.requestAllPermissions();
        
        console.log('📊 Permission results:', {
          core: results.core.granted,
          storage: results.storage.granted,
          wifi: results.wifi.granted,
        });

        // Show alert for denied permissions
        const allDeniedPermissions = [
          ...results.core.deniedPermissions,
          ...results.storage.deniedPermissions,
          ...results.wifi.deniedPermissions,
        ];
        
        if (allDeniedPermissions.length > 0) {
          permissionHandler.showPermissionAlert(allDeniedPermissions);
        }
      } catch (error) {
        console.error('❌ Permission request failed:', error);
        // Don't block app startup if permissions fail
        console.log('⚠️ Continuing app startup despite permission errors');
      }
    };

    // Request permissions after a short delay to ensure app is ready
    setTimeout(requestPermissions, 1000);

    return () => {
      // Cleanup on app unmount
      performanceManager.forceCleanup();
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <PaperProvider>
            <PersistGate loading={null} persistor={persistor}>
                    <ApplicationNavigator />
                    {/* Simple Real-time Monitoring Dashboard - DISABLED */}
                    {/* <SimpleMonitoringDashboard position="floating" /> */}
                    {/* Feature Highlights - DISABLED per user request */}
            </PersistGate>
          </PaperProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;
