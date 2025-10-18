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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';
import axios from 'axios';
import { api } from '../../../src/helpers/api/api';
import { customHeaders } from '../../../src/helpers/api/apiConfig';

const ForgotPassword = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (text: string) => {
    setEmail(text);
  };

  const payload = {
    emailAddress: email,
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      // DISABLED FOR PERFORMANCE
      // console.log('Email is required');
      return;
    }

    setLoading(true);
    try {
      let response = await axios.post(api.forgotPassword, payload, {
        headers: {
          mobileAppByPassIVAndKey:
            'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
          username: 'SpredMediaAdmin',
          password: 'SpredMediaLoveSpreding@2023',
        },
      });
      // DISABLED FOR PERFORMANCE
      // console.log('forgot password response', response);

      // Check if the API call was successful
      if (response.status === 200 || response.data?.success) {
        setLoading(false);
        // Navigate to ResetPassword screen with the email
        navigation.navigate('ResetPassword', {
          email: email,
        });
      } else {
        setLoading(false);
        // DISABLED FOR PERFORMANCE
        // console.log('API call failed with status:', response.status);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('forgot password error', error?.response);
      setLoading(false);
      // You might want to show an error message to the user here
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   'Failed to send reset email. Please check your email address and try again.',
      // );
    }
  };

  return (
    <ScrollView
      style={{
        flexDirection: 'column',
        backgroundColor: '#353535',
        flex: 1,
      }}
    >
      <ImageBackground
        source={require('../../../assets/Ellipse.png')}
        resizeMode="cover"
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <View
          style={{
            height: '100%',
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'center',
            // alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              style={{
                width: 12,
                marginTop: 40,
                height: 24,
                marginBottom: 30,
                paddingHorizontal: 24,
                tintColor: colorScheme === 'dark' ? '#ffffff' : '#000000',
              }}
              source={require('../../../assets/arrowLeft.png')}
            />
          </TouchableOpacity>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <Image
              style={{
                width: '80%',
                height: 80,
                marginBottom: 30,
              }}
              source={require('../../../assets/logo1.png')}
            />
          </View>
          <View style={{ height: 20 }} />

          <View style={{ height: 40 }} />
          <View
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              //   height: 600,
              width: '100%',
              flex: 1,
            }}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#333333',
                // height: 600,
                width: '100%',
                paddingHorizontal: 24,
                flex: 1,
              }}
            >
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  // paddingHorizontal: 24,
                  marginTop: 100,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{ color: '#ffffff', fontSize: 20, fontWeight: '700' }}
                >
                  Forgot your Password?
                </Text>
                <Text
                  style={{ color: '#ffffff', fontSize: 16, fontWeight: '400' }}
                >
                  Please enter your registered email
                </Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',

                  //   marginTop: 60,
                }}
              >
                <TextInput
                  placeholder="Email"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  autoComplete="off"
                  value={email}
                  onChangeText={handleChange}
                  style={{
                    color: '#ffffff',
                    backgroundColor: '#353535',
                    width: '100%',
                    height: 50,
                    borderWidth: 1,
                    borderColor: '#ffffff',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    marginBottom: 20,
                  }}
                />
              </View>
              <View style={{ height: 40 }} />
              {loading ? (
                <ActivityIndicator size="large" color="#F45303" />
              ) : (
                <TouchableOpacity onPress={handleSubmit}>
                  <View
                    style={{
                      width: '100%',
                      height: 60,
                      backgroundColor: '#F45303',
                      justifyContent: 'center',
                      paddingHorizontal: 24,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        textAlign: 'center',
                        color: '#ffffff',
                        fontSize: 18,
                        fontWeight: '700',
                      }}
                    >
                      Reset Password
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </ScrollView>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({});
