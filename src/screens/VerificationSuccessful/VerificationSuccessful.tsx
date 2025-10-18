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

const VerificationSuccessful = () => {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  //phone verification
  const isPasswordValid = (password: string): boolean => {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(
      password,
    );
    const hasMinimumLength = password.length >= 8;

    return (
      hasUppercase &&
      hasLowercase &&
      hasDigit &&
      hasSpecialChar &&
      hasMinimumLength
    );
  };

  const validatePassword = () => {
    if (password !== confirmPassword) {
      setErrorTitle('Passwords do not match');
      setErrorMessage(' Enter your new password again');
      return;
    }
    const isValid = isPasswordValid(password);
    if (isValid) {
      setErrorTitle('');
      setErrorMessage('');
      navigation.navigate('Success');
    } else {
      setErrorTitle('Invalid password');
      setErrorMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, one special character, and have a minimum length of 8 characters.',
      );
    }
  };
  return (
    <View style={styles.mainContainer}>
      <ImageBackground
        source={require('../../../assets/Ellipse.png')}
        resizeMode="cover"
        style={styles.backgroundImage}
      >
        <View style={styles.fullContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Image
              style={styles.backArrow}
              source={require('../../../assets/arrowLeft.png')}
            />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              source={require('../../../assets/logo1.png')}
            />
          </View>
          <View style={styles.spacer20} />

          <View style={styles.spacer40} />
          <View style={styles.overlayContainer}>
            <View style={styles.contentContainer}>
              {errorMessage === '' ? (
                <View style={styles.successMessageContainer}>
                  <Text style={styles.successTitle}>
                    Verification successful
                  </Text>
                  <Text style={styles.successMessage}>
                    Reset your password {'\n'}Passwords must contain numbers,
                    letters and {'\n'}
                    punctuation marks.
                  </Text>
                </View>
              ) : (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorTitle}</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}
              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Enter new password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.textInput}
                />
                <TextInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.spacer40} />
              <TouchableOpacity onPress={validatePassword}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>Reset Password</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default VerificationSuccessful;

const styles = StyleSheet.create({
  // Main containers
  mainContainer: {
    flexDirection: 'column',
    backgroundColor: '#353535',
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
    width: '100%',
    flex: 1,
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#333333',
    width: '100%',
    paddingHorizontal: 24,
    flex: 1,
  },

  // Navigation and logo
  backArrow: {
    width: 12,
    marginTop: 40,
    height: 24,
    marginBottom: 30,
    paddingHorizontal: 24,
    tintColor: '#000000',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logo: {
    width: '80%',
    height: 80,
    marginBottom: 30,
  },

  // Message containers
  successMessageContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 100,
    marginBottom: 10,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 10,
    backgroundColor: '#878787',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  successTitle: {
    color: '#F45303',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 30,
  },
  successMessage: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#ffffff',
  },

  // Input styles
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  textInput: {
    color: '#ffffff',
    backgroundColor: '#353535',
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ffffff',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Button styles
  buttonContainer: {
    width: '100%',
    height: 60,
    backgroundColor: '#F45303',
    justifyContent: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Spacing utilities
  spacer20: {
    height: 20,
  },
  spacer40: {
    height: 40,
  },
});
