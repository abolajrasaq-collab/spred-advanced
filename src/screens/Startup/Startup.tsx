import React, { useState, useEffect, memo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../hooks';
import { Brand } from '../../components';
import { ApplicationScreenProps } from '../../../@types/navigation';

const Startup = ({ navigation }: ApplicationScreenProps) => {
  const { Layout, Gutters } = useTheme();

  const init = async () => {
    try {
      // REMOVED DELAY FOR PERFORMANCE - Navigate immediately
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Startup initialization error:', error);
      // Even if there's an error, try to navigate to main
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <View style={[Layout.fill, Layout.colCenter]}>
      {/* <Brand /> */}
      <ActivityIndicator size={'large'} style={[Gutters.largeVMargin]} />
    </View>
  );
};

export default Startup;
