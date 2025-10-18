import React, { useState, useEffect, Suspense, lazy } from 'react';
import { store } from '../store';
import { View, ActivityIndicator } from 'react-native';
import {
  Splash,
  Loader,
  Register,
  SignIn,
  ForgotPassword,
  PhoneVerification,
  VerificationSuccessful,
  Success,
  PlayVideos,
} from '../screens';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTab from './BottomTab';

// Lazy load heavy screens to reduce initial bundle size
const Account = lazy(() => import('../screens/Account/Account'));
const ConfirmEmail = lazy(() => import('../screens/ConfirmEmail'));
const ResetPassword = lazy(() => import('../screens/ResetPassword'));
const PlayDownloadedVideos = lazy(
  () => import('../screens/PlayDownloadedVideo'),
);
const DepositScreen = lazy(() => import('../screens/Deposit/Deposit'));
const Search = lazy(() => import('../screens/Search/Search'));
const Shorts = lazy(() => import('../screens/Shorts/Shorts'));
const Upload = lazy(() => import('../screens/Upload/Upload'));
const LiveStream = lazy(() => import('../screens/LiveStream/LiveStream'));
const ChannelManager = lazy(
  () => import('../components/ChannelManager/ChannelManager'),
);
const LiveCategory = lazy(() => import('../screens/LiveCategory/LiveCategory'));
const CategoryScreen = lazy(
  () => import('../screens/CategoryScreen/CategoryScreen'),
);
const Download = lazy(() => import('../screens/Download/Download'));
const CreatorDashboard = lazy(
  () => import('../screens/CreatorDashboard/CreatorDashboard'),
);
const Notifications = lazy(
  () => import('../screens/Notifications/Notifications'),
);
const Settings = lazy(() => import('../screens/Settings/Settings'));
const Help = lazy(() => import('../screens/Help/Help'));
const TransferHistory = lazy(
  () => import('../screens/TransferHistory/TransferHistory'),
);
const CreatorProfile = lazy(
  () => import('../screens/CreatorProfile/CreatorProfile'),
);
const DownloadManager = lazy(
  () => import('../screens/DownloadManager/DownloadManager'),
);
const VideoPlayerTest = lazy(
  () => import('../screens/VideoPlayerTest/VideoPlayerTest'),
);
const OfflineVideos = lazy(
  () => import('../screens/OfflineVideos/OfflineVideos'),
);
const WiFiDirectScreen = lazy(
  () => import('../screens/WiFiDirect/WiFiDirectScreen'),
);

const Stack = createNativeStackNavigator();

// @refresh reset
const MainNavigator = () => {
  // Add authentication state checking
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check authentication state on mount
    const checkAuth = () => {
      const currentState = store.getState();
      setIsAuthenticated(currentState.auth.isAuthenticated);
    };
    
    checkAuth();
    
    // Subscribe to auth state changes
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      setIsAuthenticated(currentState.auth.isAuthenticated);
    });
    
    return unsubscribe;
  }, []);
  // DISABLED FOR PERFORMANCE - Initialize notifications when app starts
  // useEffect(() => {
  //   const initializeNotifications = async () => {
  //     try {
  //       const savedSettings = (await getDataJson('AppSettings')) as {
  //         liveDataNotifications?: boolean;
  //       } | null;
  //       const notificationService = NotificationService.getInstance();

  //       if (savedSettings?.liveDataNotifications) {
  //         // DISABLED FOR PERFORMANCE
  // console.log('Initializing live data notifications...');
  //         notificationService.enableLiveData();
  //       }
  //     } catch (error) {
  //       // DISABLED FOR PERFORMANCE
  // console.log('Error initializing notifications:', error);
  //     }
  //   };

  //   initializeNotifications();

  //   return () => {
  //     const notificationService = NotificationService.getInstance();
  //     notificationService.disableLiveData();
  //   };
  // }, []);

  // Loading component for lazy-loaded screens
  const LazyLoadingFallback = () => (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
      }}
    >
      <ActivityIndicator size="large" color="#F45303" />
    </View>
  );

  return (
    <Suspense fallback={<LazyLoadingFallback />}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Loader" component={Loader} />
        <Stack.Screen name="dashboard" component={BottomTab} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="SignIn" component={SignIn} />
        <Stack.Screen name="ConfirmEmail" component={ConfirmEmail} />

        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="ResetPassword" component={ResetPassword} />
        <Stack.Screen name="PhoneVerification" component={PhoneVerification} />
        <Stack.Screen
          name="VerificationSuccessful"
          component={VerificationSuccessful}
        />
        <Stack.Screen name="Success" component={Success} />
        <Stack.Screen name="PlayVideos" component={PlayVideos} />
        <Stack.Screen
          name="PlayDownloadedVideos"
          component={PlayDownloadedVideos}
        />
        <Stack.Screen name="Download" component={Download} />
        <Stack.Screen name="CreatorDashboard" component={CreatorDashboard} />
        <Stack.Screen name="Notifications" component={Notifications} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Help" component={Help} />

        <Stack.Screen name="Search" component={Search} />
        <Stack.Screen name="Shorts" component={Shorts} />
        <Stack.Screen name="Upload" component={Upload} />
        <Stack.Screen
          name="LiveStream"
          component={LiveStream}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChannelManager"
          component={ChannelManager}
          options={{
            headerShown: true,
            title: 'Add Live Stream',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="LiveCategory"
          component={LiveCategory}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CategoryScreen"
          component={CategoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Account" component={Account} />
        <Stack.Screen name="Deposit" component={DepositScreen} />
        <Stack.Screen name="TransferHistory" component={TransferHistory} />
        <Stack.Screen
          name="CreatorProfile"
          component={CreatorProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DownloadManager"
          component={DownloadManager}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="OfflineVideos"
          component={OfflineVideos}
          options={{
            headerShown: true,
            title: 'Offline Videos',
            headerStyle: { backgroundColor: '#1A1A1A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="VideoPlayerTest"
          component={VideoPlayerTest}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WiFiDirect"
          component={WiFiDirectScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </Suspense>
  );
};

export default MainNavigator;
