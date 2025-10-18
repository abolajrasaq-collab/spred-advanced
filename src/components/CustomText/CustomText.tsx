import React, { useState, useEffect, memo } from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../hooks';

interface CustomTextProps {
  children: React.ReactNode;
  style?: any;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  marginLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  lineHeight?: number;
  fontFamily?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  fontStyle?: 'normal' | 'italic';
  onPress?: () => void;
  testID?: string;
}

const CustomText: React.FC<CustomTextProps> = ({
  children,
  style,
  fontSize,
  fontWeight,
  color,
  marginLeft,
  marginTop,
  marginRight,
  marginBottom,
  textAlign,
  lineHeight,
  fontFamily,
  numberOfLines,
  ellipsizeMode,
  fontStyle,
  onPress,
  testID,
}) => {
  const { Fonts } = useTheme();

  const textStyles = {
    color: color || 'white',
    fontSize: fontSize || 14,
    fontWeight: fontWeight || 'normal',
    lineHeight: lineHeight || 20,
    marginLeft: marginLeft || 0,
    marginRight: marginRight || 0,
    marginTop: marginTop || 0,
    marginBottom: marginBottom || 0,
    textAlign: textAlign || 'auto',
    fontFamily: fontFamily || Fonts.textVideo.fontFamily,
    fontStyle: fontStyle || 'normal',
    ...style,
  };

  return (
    <Text
      style={textStyles}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      onPress={onPress}
      testID={testID}
    >
      {children}
    </Text>
  );
};

export default memo(CustomText);
export type { CustomTextProps };
