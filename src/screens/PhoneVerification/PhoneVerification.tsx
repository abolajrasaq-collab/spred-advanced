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

const PhoneVerification = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const [number, setNumber] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  //phone verification
  const isNumberValid = (number: string): boolean => {
    const hasMinimumLength = number.length <= 6;

    return !hasMinimumLength;
  };

  const validateNumber = () => {
    if (number === '') {
      setErrorTitle('Incorrent code');
      setErrorMessage(' please try again');
      return;
    }

    const isValid = isNumberValid(number);
    if (isValid) {
      setErrorTitle('');
      setErrorMessage('');
      navigation.navigate('VerificationSuccessful');
    } else {
    }
  };
  return (
    <View
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
                    Phone Verification
                  </Text>
                  <Text
                    style={{
                      color: '#ffffff',
                      fontSize: 16,
                      fontWeight: '400',
                    }}
                  >
                    We are sending a verification code to your {'\n'} phone.
                    Enter it below to reset your password.
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
                  placeholder="Verification code"
                  value={number}
                  onChangeText={setNumber}
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
              <TouchableOpacity onPress={validateNumber}>
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
                    Submit
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default PhoneVerification;

const styles = StyleSheet.create({});
