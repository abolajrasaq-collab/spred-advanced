import {
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Image,
  View,
  Alert,
  TextInput,
  StatusBar,
} from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import CustomTextInput from '../../components/CustomInput/CustomInput';
import CustomButton from '../../components/CustomButton/CustomButton';
import axios, { AxiosError } from 'axios';
import { api } from '../../../src/helpers/api/api';
import { customHeaders } from '../../../src/helpers/api/apiConfig';
import { storeDataJson } from '../../../src/helpers/api/Asyncstorage';
import Snackbar from 'react-native-snackbar';
import { useDispatch } from 'react-redux';
import { store } from '../../store';
import { loginSuccess } from '../../store/auth';
import logger from '../../utils/logger';
import { RootStackParamList } from '../../types/navigation';
import { LoginCredentials, User, UserDetails, UserProfile } from '../../types/auth';
import { validateEmail, validatePassword } from '../../utils/validation';
import { handleApiError, handleAuthError, handleValidationError } from '../../utils/errorHandler';

const baseURL = 'https://www.spred.cc/api';

interface SignInState {
  email: string;
  password: string;
}

interface SignInProps {
  navigation?: NavigationProp<RootStackParamList>;
}

const SignIn: React.FC<SignInProps> = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const [state, setState] = useState<SignInState>({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Add a small delay to ensure logout state is properly cleared
      setTimeout(() => {
        const currentState = store.getState();
        if (currentState.auth.isAuthenticated && currentState.auth.token) {
          console.log('🔒 User already authenticated, redirecting to Main');
          navigation.replace('Main');
        }
      }, 100);
    });

    return unsubscribe;
  }, [navigation]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const handleChange = useCallback((key: keyof SignInState, value: string) => {
    setState(prevData => ({
      ...prevData,
      [key]: value,
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors[key]) {
      setValidationErrors(prev => ({
        ...prev,
        [key]: [],
      }));
    }
  }, [validationErrors]);

  const credentials: LoginCredentials = {
    email: state.email,
    password: state.password,
  };

  const performLogin = useCallback(async () => {
    try {
      setLoading(true);
      
      // Validate inputs before making API call
      const emailValidation = validateEmail(state.email);
      const passwordValidation = validatePassword(state.password);
      
      if (!emailValidation.isValid || !passwordValidation.isValid) {
        setValidationErrors({
          email: emailValidation.errors,
          password: passwordValidation.errors,
        });
        setLoading(false);
        return;
      }

      const response = await axios.post(api.login, credentials, {
        headers: customHeaders(),
        timeout: 30000, // 30 second timeout
      }).catch(error => {
        console.error('Login API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers,
          }
        });
        throw error;
      });

      const config = {
        headers: customHeaders(response?.data?.data?.token),
      };

      const userDetailsPromise = axios.get(
        `${baseURL}/UserManagement/User/${response?.data?.data?.id}/get-a-user-by-userId`,
        {
          ...config,
          timeout: 30000,
        },
      ).catch(error => {
        console.error('User Details API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          url: error.config?.url,
        });
        throw error;
      });

      const userProfilesPromise = axios.get(
        `${baseURL}/UserManagement/Profile/${response?.data?.data?.id}/get-all-user-profiles-by-userId`,
        {
          ...config,
          timeout: 30000,
        },
      ).catch(error => {
        console.error('User Profiles API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
          url: error.config?.url,
        });
        throw error;
      });

      const [userDetailsResponse, userProfilesResponse] = await Promise.all([
        userDetailsPromise,
        userProfilesPromise,
      ]);

      // Create user object with proper typing
      const user: User = {
        id: response?.data?.data?.id,
        username: userDetailsResponse?.data?.data?.username || response?.data?.data?.email,
        email: response?.data?.data?.email,
        wallet: userDetailsResponse?.data?.data?.wallet,
        profilePicture: userDetailsResponse?.data?.data?.profilePicture,
        isVerified: userDetailsResponse?.data?.data?.isVerified || false,
        createdAt: userDetailsResponse?.data?.data?.createdAt,
        lastLogin: new Date().toISOString(),
      };

      // Update Redux auth state
      logger.info('🔑 Dispatching loginSuccess with token:', !!response?.data?.data?.token);
      dispatch(loginSuccess({ user, token: response?.data?.data?.token }));
      logger.info('✅ Login success dispatched');

      setLoading(false);
      navigation.replace('Main');

      setTimeout(async () => {
        try {
          await Promise.allSettled([
            storeDataJson('User', response?.data?.data),
            storeDataJson('Profile', userProfilesResponse?.data?.data),
            storeDataJson('UserInfo', userDetailsResponse?.data?.data),
          ]);
        } catch (error) {
          logger.warn('Background storage error:', error);
        }
      }, 200);
    } catch (error) {
      setLoading(false);
      
      // Use centralized error handling
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;

        if (
          errorMessage.includes('not confirmed') ||
          errorMessage.includes('User\'s account is not confirmed')
        ) {
          navigation.navigate('ConfirmEmail', { email: state.email });
        } else {
          handleApiError(error, 'SignIn.performLogin');
        }
      } else {
        handleAuthError(error, 'SignIn.performLogin');
      }
    }
  }, [state.email, state.password, navigation]);

  const validateAndSubmit = useCallback(() => {
    // Validate email
    const emailValidation = validateEmail(state.email);
    if (!emailValidation.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        email: emailValidation.errors,
      }));
      handleValidationError('email', emailValidation.errors[0], 'SignIn.validateAndSubmit');
      return;
    }

    // Validate password
    const passwordValidation = validatePassword(state.password);
    if (!passwordValidation.isValid) {
      setValidationErrors(prev => ({
        ...prev,
        password: passwordValidation.errors,
      }));
      handleValidationError('password', passwordValidation.errors[0], 'SignIn.validateAndSubmit');
      return;
    }

    // Clear any existing errors
    setValidationErrors({});
    
    // Proceed with login
    performLogin();
  }, [state.email, state.password, performLogin]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo and Header */}
        <View style={styles.header}>
          <Image
            style={styles.logo}
            source={require('../../../assets/spred.png')}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to Spred</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View
            style={[
              styles.passwordContainer,
              focusedInput === 'email' && styles.passwordContainerFocused,
            ]}
          >
            <TextInput
              style={[
                styles.passwordInput,
                validationErrors.email && styles.inputError
              ]}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              placeholder="Enter your email address"
              value={state.email}
              onChangeText={text => handleChange('email', text)}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              autoComplete="email"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              importantForAccessibility="yes"
              accessible={true}
              accessibilityLabel="Email address input"
              accessibilityHint="Enter your email address for login"
              returnKeyType="next"
              onSubmitEditing={() => {
                setFocusedInput('password');
              }}
            />
          </View>

          <View
            style={[
              styles.passwordContainer,
              focusedInput === 'password' && styles.passwordContainerFocused,
            ]}
          >
            <TextInput
              style={[
                styles.passwordInput,
                validationErrors.password && styles.inputError
              ]}
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              placeholder="Enter Password"
              secureTextEntry={!isPasswordVisible}
              value={state.password}
              onChangeText={text => handleChange('password', text)}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
              textContentType="password"
              autoComplete="password"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              importantForAccessibility="yes"
              accessible={true}
              accessibilityLabel="Password input"
              accessibilityHint="Enter your password for login"
              returnKeyType="done"
              onSubmitEditing={validateAndSubmit}
            />
            <TouchableOpacity
              onPress={togglePasswordVisibility}
              style={styles.passwordToggle}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel={
                isPasswordVisible ? 'Hide password' : 'Show password'
              }
              accessibilityRole="button"
            >
              <Image
                style={styles.passwordIcon}
                source={
                  isPasswordVisible
                    ? require('../../../assets/notvisible.png')
                    : require('../../../assets/visible.png')
                }
              />
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Validation Error Messages */}
          {validationErrors.email && (
            <Text style={styles.errorText}>{validationErrors.email[0]}</Text>
          )}
          {validationErrors.password && (
            <Text style={styles.errorText}>{validationErrors.password[0]}</Text>
          )}

          {/* Login Button */}
          {loading ? (
            <ActivityIndicator
              size="small"
              color="#F45303"
              style={styles.loader}
            />
          ) : (
            <CustomButton title="Login" onPress={validateAndSubmit} />
          )}

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 40,
    marginBottom: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    borderRadius: 16,
    padding: 24,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 56,
    minHeight: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  passwordInput: {
    color: '#FFFFFF',
    flex: 1,
    fontSize: 16,
    height: 56,
    minHeight: 56,
    paddingVertical: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  passwordToggle: {
    padding: 8,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordContainerFocused: {
    borderColor: '#F45303',
    backgroundColor: '#333333',
  },
  passwordIcon: {
    width: 20,
    height: 20,
    tintColor: '#999999',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPassword: {
    color: '#F45303',
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 20,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#999999',
    fontSize: 14,
  },
  signUpLink: {
    color: '#F45303',
    fontSize: 14,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#E53E3E',
    backgroundColor: '#2A1A1A',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
});
