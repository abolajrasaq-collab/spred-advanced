import React, { useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

const Splash = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace('Loader');
    }, 2000);
  }, []);

  return (
    <View
      style={{
        height: 400,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#353535',
      }}
    >
      <Image
        style={{ width: 120, height: 120 }}
        resizeMode="contain"
        source={require('../../../assets/logo.png')}
        onError={(error) => {
          console.warn('Logo image failed to load:', error);
        }}
      />
    </View>
  );
};

export default Splash;
