import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  View,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';
import BackHeader from '../../components/Backheader/Backheader';
import CustomTextInput from '../../components/CustomInput/CustomInput';
import CustomButton from '../../components/CustomButton/CustomButton';
import { api } from '../../../src/helpers/api/api';
import { customHeaders } from '../../../src/helpers/api/apiConfig';
import Snackbar from 'react-native-snackbar';

const Register = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();

  const [state, setState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    number: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, value) => {
    setState(prevData => ({
      ...prevData,
      [key]: value,
    }));

    if (key === 'password') {
      setPasswordValid(validatePassword(value));
    }
  };
  // Password validation function
  const validatePassword = (password: string) => {
    // Define a regular expression pattern to match your criteria
    const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
    return pattern.test(password);
  };

  let payload = {
    firstName: state.firstName,
    lastName: state.lastName,
    email: state.email,
    phoneNumber: state.number,
    password: state.password,
    confirmPassword: state.confirmPassword,
    pin: '0000',
  };

  const handleSubmit = async () => {
    if (state.password !== state.confirmPassword) {
      setLoading(false);
      // Display an error message or handle the mismatch
      // Alert.alert('Passwords do not match');
      Snackbar.show({
        text: 'Passwords do not match. Enter your new password again',
        duration: Snackbar.LENGTH_SHORT,
      });
      return;
    }

    setLoading(true);
    // DISABLED FOR PERFORMANCE
    // console.log('payload to be sent', payload);
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('to be sent', payload);
      let response = await axios.post(api.register, payload, {
        headers: {
          mobileAppByPassIVAndKey:
            'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
          username: 'SpredMediaAdmin',
          password: 'SpredMediaLoveSpreding@2023',
        },
      });
      // DISABLED FOR PERFORMANCE
      // console.log('register res', response);
      setLoading(false);
      navigation.navigate('ConfirmEmail', {
        email: state.email,
        userId: '', // TODO: Add proper userId from registration response
      });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('backend error', error?.response);
      Snackbar.show({
        text: 'An Error has occured. Please try again',
        duration: Snackbar.LENGTH_SHORT,
      });
      // setError(error?.response?.data?.message);
      setLoading(false);
    }
  };
  //input fields must not be empty
  const isButtonEnabled =
    state.email.length &&
    state.firstName.length &&
    state.lastName.length &&
    state.password.length >= 3;
  // DISABLED FOR PERFORMANCE
  // console.log('false', isButtonEnabled);
  return (
    <View
      style={{
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        paddingTop: 40,
        width: '100%',
        height: '100%',
        backgroundColor: '#353535',
      }}
    >
      {Platform.OS === 'android' && (
        <StatusBar backgroundColor="#050505" barStyle="light-content" />
      )}
      <ScrollView>
        <BackHeader />
        <View style={{ height: 20 }} />
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ color: '#F45303', fontSize: 26, fontWeight: '500' }}>
            Join Spred
          </Text>
          <Text style={{ color: '#999999', fontSize: 18, fontWeight: '500' }}>
            Register to get started.
          </Text>
        </View>
        <View style={{ height: 40 }} />
        <View
          style={{
            display: 'flex',
            flexDirection: 'column',
            paddingHorizontal: 24,
          }}
        >
          <CustomTextInput
            placeholder="First name"
            value={state.firstName}
            onChangeText={text => handleChange('firstName', text)}
          />

          <CustomTextInput
            placeholder="Last name"
            value={state.lastName}
            onChangeText={text => handleChange('lastName', text)}
          />

          <CustomTextInput
            placeholder="Email"
            value={state.email}
            onChangeText={text => handleChange('email', text)}
          />

          {error.length > 0 && (
            <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
          )}

          <CustomTextInput
            placeholder="Mobile No"
            value={state.number}
            onChangeText={text => handleChange('number', text)}
          />

          <View style={{ position: 'relative' }}>
            <CustomTextInput
              placeholder="Password"
              value={state.password}
              onChangeText={text => handleChange('password', text)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 15,
                top: 15,
                zIndex: 1,
              }}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={{ color: '#999999', fontSize: 20 }}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
          {!passwordValid && (
            <Text style={{ color: 'red', marginBottom: 10 }}>
              Password must include a capital letter, a combination of letters
              and numbers, at least 8 characters, and a special character.
            </Text>
          )}
          <View style={{ position: 'relative' }}>
            <CustomTextInput
              placeholder="Confirm-Password"
              value={state.confirmPassword}
              onChangeText={text => handleChange('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 15,
                top: 15,
                zIndex: 1,
              }}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={{ color: '#999999', fontSize: 20 }}>
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={{
              justifyContent: 'flex-end',
              display: 'flex',
              flexDirection: 'row',
              //   paddingHorizontal: 10,
              marginBottom: 30,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text
                style={{ color: '#FCE2D5', fontWeight: '400', fontSize: 16 }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <CustomButton
              backgroundColor={!isButtonEnabled && '#82543c'}
              disabled={!isButtonEnabled}
              title="Register"
              onPress={handleSubmit}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default Register;

const styles = StyleSheet.create({});
