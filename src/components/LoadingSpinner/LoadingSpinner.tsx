import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoadingSpinnerProps {
  visible?: boolean;
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
  fullScreen?: boolean;
  loadingState?: LoadingState;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  visible = true,
  size = 'large',
  color = '#FF6B35',
  text,
  overlay = false,
  fullScreen = false,
  loadingState,
}) => {
  if (!visible) {
    return null;
  }

  const renderSpinner = () => (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        overlay && styles.overlay,
      ]}
    >
      <View style={styles.spinnerContainer}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={[styles.text, { color }]}>{text}</Text>}
        {loadingState?.error && (
          <Text style={styles.errorText}>
            {loadingState.error.message || 'Something went wrong'}
          </Text>
        )}
      </View>
    </View>
  );

  if (overlay || fullScreen) {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={() => {}} // Prevent back button on Android
      >
        {renderSpinner()}
      </Modal>
    );
  }

  return renderSpinner();
};

// Hook for managing loading states
export const useLoadingState = (
  initialState: LoadingState = { isLoading: false, error: null },
) => {
  const [loadingState, setLoadingState] = useState<LoadingState>(initialState);

  const startLoading = useCallback(() => {
    setLoadingState({ isLoading: true, error: null });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const setError = useCallback((error: LoadingState['error']) => {
    setLoadingState({
      isLoading: false,
      error,
      lastUpdated: new Date().toISOString(),
    });
  }, []);

  const clearError = useCallback(() => {
    setLoadingState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setLoadingState({ isLoading: false, error: null });
  }, []);

  return {
    loadingState,
    startLoading,
    stopLoading,
    setError,
    clearError,
    reset,
    isLoading: loadingState.isLoading,
    error: loadingState.error,
  };
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  spinnerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#e74c3c',
    textAlign: 'center',
  },
});

export default LoadingSpinner;
