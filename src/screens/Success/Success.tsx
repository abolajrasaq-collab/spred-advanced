import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  View,
  useColorScheme,
  ImageBackground,
  StatusBar,
  TextInput,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

const Success = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.mainContainer,
        {
          backgroundColor: colorScheme === 'light' ? '#ffffff' : '#353535',
        },
      ]}
    >
      <ImageBackground
        source={require('../../../assets/cover.jpeg')}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View style={styles.fullContainer} />
        <View style={styles.overlayContainer}>
          <View style={styles.contentContainer}>
            <View style={styles.innerContainer}>
              {/* <Image
              style={{
                width: '80%',
                height: 80,
                marginBottom: 30,
              }}
              source={require('../../../assets/vector.png')}
            />  */}
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Success;

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'column',
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
  },
  fullContainer: {
    height: '100%',
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  overlayContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 600,
    width: '100%',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#030303',
    height: 600,
    width: '100%',
    paddingHorizontal: 24,
  },
  innerContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#000000',
    height: 176,
  },
});
