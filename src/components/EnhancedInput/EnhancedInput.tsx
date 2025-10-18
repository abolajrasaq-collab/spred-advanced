/**
 * Enhanced Input Component
 * Provides a robust, accessible, and customizable input component with validation
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  Image,
} from 'react-native';
import { ValidationRule, validateInput } from '../../utils/validation';

export interface EnhancedInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  validationRules?: ValidationRule[];
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperTextStyle?: TextStyle;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  error,
  helperText,
  required = false,
  validationRules = [],
  onValidationChange,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  helperTextStyle,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  size = 'medium',
  value,
  onChangeText,
  secureTextEntry,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    // Validate on blur if rules are provided
    if (validationRules.length > 0 && value) {
      const validation = validateInput(value, validationRules);
      setValidationErrors(validation.errors);
      onValidationChange?.(validation.isValid, validation.errors);
    }
  }, [validationRules, value, onValidationChange]);

  const handleChangeText = useCallback((text: string) => {
    onChangeText?.(text);
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
      onValidationChange?.(true, []);
    }
  }, [onChangeText, validationErrors, onValidationChange]);

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      marginBottom: 16,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        minHeight: 40,
      },
      medium: {
        minHeight: 48,
      },
      large: {
        minHeight: 56,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...containerStyle,
    };
  };

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      paddingHorizontal: 16,
    };

    // Size styles
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingVertical: 8,
        minHeight: 40,
      },
      medium: {
        paddingVertical: 12,
        minHeight: 48,
      },
      large: {
        paddingVertical: 16,
        minHeight: 56,
      },
    };

    // Variant styles
    const variantStyles: Record<string, ViewStyle> = {
      default: {
        backgroundColor: '#2A2A2A',
        borderColor: 'transparent',
      },
      outlined: {
        backgroundColor: '#2A2A2A',
        borderColor: isFocused ? '#F45303' : '#333333',
      },
      filled: {
        backgroundColor: '#333333',
        borderColor: 'transparent',
      },
    };

    // Error styles
    const errorStyle: ViewStyle = (error || validationErrors.length > 0)
      ? {
          borderColor: '#E53E3E',
          backgroundColor: '#2A1A1A',
        }
      : {};

    // Focus styles
    const focusStyle: ViewStyle = isFocused && !error && validationErrors.length === 0
      ? {
          borderColor: '#F45303',
          backgroundColor: '#333333',
        }
      : {};

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...errorStyle,
      ...focusStyle,
    };
  };

  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      flex: 1,
      color: '#FFFFFF',
    };

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      small: {
        fontSize: 14,
      },
      medium: {
        fontSize: 16,
      },
      large: {
        fontSize: 18,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...inputStyle,
    };
  };

  const getLabelStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      color: '#FFFFFF',
      marginBottom: 8,
      fontWeight: '500',
    };

    // Size styles
    const sizeStyles: Record<string, TextStyle> = {
      small: {
        fontSize: 12,
      },
      medium: {
        fontSize: 14,
      },
      large: {
        fontSize: 16,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...labelStyle,
    };
  };

  const getErrorStyle = (): TextStyle => {
    return {
      color: '#E53E3E',
      fontSize: 12,
      marginTop: 4,
      ...errorStyle,
    };
  };

  const getHelperTextStyle = (): TextStyle => {
    return {
      color: '#8B8B8B',
      fontSize: 12,
      marginTop: 4,
      ...helperTextStyle,
    };
  };

  const displayError = error || validationErrors[0];

  return (
    <View style={getContainerStyle()}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
          {required && <Text style={{ color: '#E53E3E' }}> *</Text>}
        </Text>
      )}
      
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={styles.iconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          ref={inputRef}
          style={getInputStyle()}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          {...props}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            style={styles.passwordToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
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
        )}
        
        {rightIcon && !showPasswordToggle && (
          <View style={styles.iconContainer}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {displayError && (
        <Text style={getErrorStyle()}>{displayError}</Text>
      )}
      
      {helperText && !displayError && (
        <Text style={getHelperTextStyle()}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordToggle: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordIcon: {
    width: 20,
    height: 20,
    tintColor: '#999999',
  },
});

export default EnhancedInput;