import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ViewStyle } from 'react-native';

interface SafeAreaViewWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ['top', 'right', 'bottom', 'left'];
}

const SafeAreaViewWrapper: React.FC<SafeAreaViewWrapperProps> = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
}) => {
  return (
    <SafeAreaView style={style} edges={edges}>
      {children}
    </SafeAreaView>
  );
};

export default SafeAreaViewWrapper;
