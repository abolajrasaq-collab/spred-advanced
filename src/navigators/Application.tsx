import React, { useState, useEffect, memo } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { Startup } from '../screens';
import { useTheme } from '../hooks';
import MainNavigator from './Main';
import { useFlipper } from '@react-navigation/devtools';
import { ApplicationStackParamList } from '../../@types/navigation';
import { FullscreenVideoProvider } from '../contexts/FullscreenVideoContext';
import GlobalFullscreenVideoPlayer from '../components/GlobalFullscreenVideoPlayer/GlobalFullscreenVideoPlayer';

const Stack = createNativeStackNavigator<ApplicationStackParamList>();

// Optimized: Direct navigation to Main, bypassing Startup delay
const ApplicationNavigator = () => {
  const { Layout, darkMode, NavigationTheme } = useTheme();
  const { colors } = NavigationTheme;

  const navigationRef = useNavigationContainerRef();

  return (
    <FullscreenVideoProvider>
      <SafeAreaView
        style={[Layout.fill, { backgroundColor: '#353535' }]}
        edges={['top', 'left', 'right']}
      >
        <NavigationContainer theme={NavigationTheme} ref={navigationRef}>
          <StatusBar
            barStyle="light-content"
            backgroundColor="#353535"
            translucent={false}
          />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {/* Direct navigation to Main - no Startup screen delay */}
            <Stack.Screen name="Main" component={MainNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
        {/* Global fullscreen video player rendered at root level */}
        <GlobalFullscreenVideoPlayer />
      </SafeAreaView>
    </FullscreenVideoProvider>
  );
};

export default ApplicationNavigator;
