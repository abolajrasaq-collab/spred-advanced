import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  View,
  useColorScheme,
  ImageBackground,
  TextInput,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { api } from '../../../src/helpers/api/api';
import { customHeaders } from '../../../src/helpers/api/apiConfig';
import { ScrollView } from 'react-native';
import { getDataJson } from '../../helpers/api/Asyncstorage';

const ConfirmEmail = ({ route }: { route: any }) => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const emailR = route?.params ? route?.params?.email : '';

  const [email, setEmail] = useState(emailR);
  const [code, setCode] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendloading, setResendLoading] = useState(false);
  const [user, setUser] = useState({ token: '' });

  useEffect(() => {
    async function load() {
      const gotten = await getDataJson('User');
      setUser(gotten);
    }
    load();
  }, []);
  let payload = {
    emailAddress: email,
    token: code,
  };
  let resend = {
    email: emailR,
    purpose: 'ConfirmEmail',
    template: 'ConfirmEmail',
  };
  const handleSubmit = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    setLoading(true);
    // DISABLED FOR PERFORMANCE
    // console.log('payload to be sent', payload);
    try {
      let response = await axios.post(api.confirmEmail, payload, {
        headers: customHeaders(user?.token),
      });
      // DISABLED FOR PERFORMANCE
      // console.log('fr res', response);
      setLoading(false);
      navigation.navigate('SignIn');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('backend error', error?.response);
      setErrorMessage(
        error?.response?.data?.message ||
          'An error occurred. Please try again.',
      );
      setLoading(false);
    }
  };
  const handleResend = async () => {
    setResendLoading(true);
    // DISABLED FOR PERFORMANCE
    // console.log('payload to be sent', resend);
    try {
      let response = await axios.post(api.resentOTP, resend, {
        headers: customHeaders(user?.token),
      });
      // DISABLED FOR PERFORMANCE
      // console.log('fr res', response);

      setResendLoading(false);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('backend error', error?.response);
      setErrorMessage(error?.response?.data?.message);
      setResendLoading(false);
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
                tintColor: '#000000',
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
              {errorMessage === '' ? (
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
                    style={{
                      color: '#ffffff',
                      fontSize: 20,
                      fontWeight: '700',
                    }}
                  >
                    Verify code
                  </Text>
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: '400',
                    }}
                  >
                    We are sending a verification code to your {'\n'} mail.
                    Enter it below to confirm your password.
                  </Text>
                </View>
              ) : (
                <View
                  style={{
                    width: '100%',
                    marginBottom: 10,
                    backgroundColor: '#878787',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // padding: '24',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '400',
                      color: '#ffffff',
                    }}
                  >
                    {errorTitle}
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '400',
                      color: '#ffffff',
                    }}
                  >
                    {errorMessage}
                  </Text>
                </View>
              )}
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',

                  //   marginTop: 60,
                }}
              >
                <TextInput
                  placeholder="Enter your email"
                  placeholderTextColor="#ffffff"
                  autoComplete="off"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
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
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {errorMessage.length > 0 && (
                  <Text style={{ color: 'red', marginBottom: 10 }}>
                    {errorMessage}
                  </Text>
                )}

                <TextInput
                  placeholder="Enter your verification code"
                  placeholderTextColor="#ffffff"
                  autoComplete="off"
                  value={code}
                  onChangeText={setCode}
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
                <ActivityIndicator size="small" color="white" />
              ) : (
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!code.trim()}
                  style={{
                    opacity: code.trim() ? 1 : 0.5,
                  }}
                >
                  <View
                    style={{
                      width: '100%',
                      height: 60,
                      backgroundColor: code.trim() ? '#F45303' : '#82543c',
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
                      Submit
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              {resendloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <TouchableOpacity onPress={handleResend}>
                  <Text
                    style={{
                      color: '#d34d09',
                      fontWeight: '400',
                      fontSize: 16,
                      marginTop: 10,
                    }}
                  >
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ImageBackground>
    </ScrollView>
  );
};

export default ConfirmEmail;

const styles = StyleSheet.create({});
