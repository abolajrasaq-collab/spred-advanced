import { BackHandler, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Homepage from '../screens/Homepage/Homepage';
import Download from '../screens/Download/Download';
import Account from '../screens/Account/Account';
import Upload from '../screens/Upload/Upload';
import Shorts from '../screens/Shorts/Shorts';
import { useFocusEffect } from '@react-navigation/native';
import SimpleHeader from '../components/Header/SimpleHeader';
import CustomTabBar from '../components/CustomTabBar/CustomTabBar';

const BottomTab = () => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, []),
  );

  const Tabs = createBottomTabNavigator();

  return (
    <View style={{ flex: 1 }}>
      <Tabs.Navigator
        tabBar={props => <CustomTabBar {...props} />}
        screenOptions={{
          header: () => <SimpleHeader />,
        }}
      >
        <Tabs.Screen
          name="HOME"
          component={Homepage}
          options={{
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="SHORTS"
          component={Shorts}
          options={{
            headerShown: false,
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen name="UPLOAD" component={Upload} />
        <Tabs.Screen name="DOWNLOADS" component={Download} />
        <Tabs.Screen name="ME" component={Account} />
      </Tabs.Navigator>
      
    </View>
  );
};

export default BottomTab;

const styles = StyleSheet.create({});
