import React, { memo } from 'react';
import { TextInput } from 'react-native';
import { useThemeColors } from '../../theme/ThemeProvider';

interface CustomInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  style?: import('react-native').TextInputProps['style'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: import('react-native').TextInputProps['autoComplete'];
}

const CustomTextInput: React.FC<CustomInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  style,
  autoCapitalize = 'none',
  autoComplete = 'off',
}) => {
  const colors = useThemeColors();
  return (
    <TextInput
      secureTextEntry={secureTextEntry}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={colors.text.tertiary}
      style={[
        {
          color: colors.text.primary,
          backgroundColor: colors.background.surface,
          width: '100%',
          height: 50,
          borderWidth: 1,
          borderColor: colors.text.primary,
          alignItems: 'center',
          paddingHorizontal: 20,
          marginBottom: 20,
        },
        style,
      ]}
    />
  );
};

export default memo(CustomTextInput);
export type { CustomInputProps };
