import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  View,
  ImageBackground,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import logger from '../../utils/logger';

const Loader = ({ navigation }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Debug logging
  logger.info('🔍 Loader Auth State:', { isAuthenticated });

  useEffect(() => {
    // Check authentication state after a short delay
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('dashboard');
      } else {
        navigation.replace('SignIn');
      }
    }, 1500); // Reduced delay for better UX

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <ImageBackground
        source={require('../../../assets/Splash-2.jpg')}
        resizeMode="cover"
        style={{ flex: 1, justifyContent: 'center' }}
      />
    </View>
  );
};

export default Loader;

const styles = StyleSheet.create({});
