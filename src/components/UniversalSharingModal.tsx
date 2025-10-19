import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import CrossPlatformSharingService, { SharingState, ShareResult } from '../services/CrossPlatformSharingService';
import { Android12Button } from './Android12Button/index';

const { width, height } = Dimensions.get('window');

interface UniversalSharingModalProps {
  visible: boolean;
  onClose: () => void;
  videoPath?: string;
  videoTitle?: string;
  onShareComplete?: (result: ShareResult) => void;
}

type ModalMode = 'discovering' | 'connecting' | 'transferring' | 'qr_fallback' | 'completed' | 'error';

const UniversalSharingModal: React.FC<UniversalSharingModalProps> = ({
  visible,
  onClose,
  videoPath,
  videoTitle,
  onShareComplete,
}) => {
  const [sharingState, setSharingState] = useState<SharingState | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('discovering');
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  const sharingService = CrossPlatformSharingService.getInstance();

  useEffect(() => {
    if (visible && videoPath) {
      startSharing();
    }

    // Subscribe to sharing state changes
    const unsubscribe = sharingService.subscribe((state) => {
      setSharingState(state);
      updateModalMode(state);
    });

    return () => {
      unsubscribe();
    };
  }, [visible, videoPath]);

  const startSharing = async () => {
    if (!videoPath) return;

    try {
      setModalMode('discovering');
      console.log('🚀 Starting sharing process with enhanced error handling...');
      
      const result = await sharingService.shareVideo(videoPath);
      setShareResult(result);
      
      console.log('📊 Sharing result:', result);
      
      if (result.success) {
        setModalMode('completed');
        onShareComplete?.(result);
      } else {
        console.warn('⚠️ Sharing failed, showing error state:', result.error);
        setModalMode('error');
      }
    } catch (error: any) {
      console.error('❌ Critical sharing error:', {
        message: error.message,
        stack: error.stack,
        videoPath,
        timestamp: new Date().toISOString()
      });
      
      // Create a fallback result for the error state
      setShareResult({
        success: false,
        method: 'nearby',
        error: error.message || 'An unexpected error occurred during sharing'
      });
      
      setModalMode('error');
    }
  };

  const updateModalMode = (state: SharingState) => {
    if (state.qrData && state.currentMethod === 'qr_fallback') {
      setModalMode('qr_fallback');
    } else if (state.transferProgress && state.transferProgress.progress > 0) {
      setModalMode('transferring');
    } else if (state.discoveredDevices.length > 0 && state.currentMethod === 'nearby') {
      setModalMode('connecting');
    } else if (state.error) {
      setModalMode('error');
    }
  };

  const handleClose = () => {
    // Clean up sharing service
    sharingService.cleanup();
    onClose();
  };

  const handleRetry = () => {
    if (videoPath) {
      startSharing();
    }
  };

  const renderDiscoveringState = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
      <Text style={styles.stateTitle}>Looking for nearby devices</Text>
      <Text style={styles.stateSubtitle}>
        Searching for devices ready to receive videos...
      </Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {sharingState?.status || 'Initializing...'}
        </Text>
      </View>
    </View>
  );

  const renderConnectingState = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="wifi" size={64} color="#2196F3" />
      </View>
      <Text style={styles.stateTitle}>Connecting to device</Text>
      <Text style={styles.stateSubtitle}>
        Found {sharingState?.discoveredDevices.length || 0} nearby device(s)
      </Text>
      
      {sharingState?.discoveredDevices.map((device, index) => (
        <View key={device.id} style={styles.deviceItem}>
          <MaterialIcons name="smartphone" size={20} color="#4CAF50" />
          <Text style={styles.deviceName}>{device.name}</Text>
          <Text style={styles.deviceStatus}>{device.status}</Text>
        </View>
      ))}
    </View>
  );

  const renderTransferringState = () => {
    const progress = sharingState?.transferProgress;
    
    return (
      <View style={styles.stateContainer}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="cloud-upload" size={64} color="#F45303" />
        </View>
        <Text style={styles.stateTitle}>Sending video</Text>
        <Text style={styles.stateSubtitle}>
          {progress?.fileName || videoTitle || 'Video file'}
        </Text>
        
        {progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[styles.progressFill, { width: `${progress.progress}%` }]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(progress.progress)}%</Text>
            
            {progress.speed && (
              <Text style={styles.speedText}>
                {Math.round(progress.speed / 1024 / 1024)} MB/s
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderQRFallbackState = () => (
    <View style={styles.stateContainer}>
      <Text style={styles.stateTitle}>Scan QR Code</Text>
      <Text style={styles.stateSubtitle}>
        No nearby devices found. Scan this code on the receiving device.
      </Text>
      
      <View style={styles.qrContainer}>
        {sharingState?.qrData ? (
          <QRCode
            value={sharingState.qrData}
            size={200}
            backgroundColor="#FFFFFF"
            color="#1A1A1A"
          />
        ) : (
          <ActivityIndicator size="large" color="#F45303" />
        )}
      </View>
      
      <View style={styles.qrInstructions}>
        <Text style={styles.instructionsTitle}>How to receive:</Text>
        <Text style={styles.instructionsText}>
          1. Open SPRED on the receiving device{'\n'}
          2. Tap "Scan QR Code" or use camera{'\n'}
          3. Point camera at this QR code{'\n'}
          4. Video will download automatically
        </Text>
      </View>
    </View>
  );

  const renderCompletedState = () => (
    <View style={styles.stateContainer}>
      <View style={[styles.iconContainer, styles.successIcon]}>
        <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.stateTitle}>Video sent successfully!</Text>
      <Text style={styles.stateSubtitle}>
        {shareResult?.method === 'nearby' 
          ? `Sent to ${shareResult.deviceName}` 
          : 'QR code is ready for scanning'
        }
      </Text>
      
      {shareResult?.duration && (
        <Text style={styles.durationText}>
          Completed in {Math.round(shareResult.duration / 1000)}s
        </Text>
      )}
      
      <Android12Button
        title="Done"
        onPress={handleClose}
        iconName="done"
        style={styles.doneButton}
        textStyle={styles.doneButtonText}
        buttonColor="#4CAF50"
        pressedColor="#388E3C"
        releasedColor="#4CAF50"
        iconColor="#FFFFFF"
        iconSize={20}
        size="medium"
      />
    </View>
  );

  const renderErrorState = () => {
    const errorMessage = sharingState?.error || shareResult?.error || 'An error occurred while sharing the video';
    
    // Determine if this is a recoverable error
    const isRecoverable = !errorMessage.includes('permission') && 
                         !errorMessage.includes('not available') && 
                         !errorMessage.includes('System error');
    
    // Get user-friendly error message
    const getUserFriendlyMessage = (error: string): string => {
      if (error.includes('permission')) {
        return 'Permission denied. The app will use QR code sharing instead.';
      }
      if (error.includes('not available') || error.includes('initialization')) {
        return 'Nearby sharing is not available on this device. Using QR code sharing instead.';
      }
      if (error.includes('timeout') || error.includes('No nearby devices')) {
        return 'No nearby devices found. You can still share using QR codes.';
      }
      if (error.includes('null') || error.includes('System error')) {
        return 'System error detected. The app will use test mode instead.';
      }
      return 'Sharing encountered an issue, but QR code sharing is still available.';
    };

    return (
      <View style={styles.stateContainer}>
        <View style={[styles.iconContainer, styles.errorIcon]}>
          <MaterialIcons name="info" size={64} color="#FF9800" />
        </View>
        <Text style={styles.stateTitle}>Nearby sharing unavailable</Text>
        <Text style={styles.stateSubtitle}>
          {getUserFriendlyMessage(errorMessage)}
        </Text>
        
        {/* Show technical details in debug mode */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>{errorMessage}</Text>
          </View>
        )}
        
        <View style={styles.errorActions}>
          {isRecoverable && (
            <Android12Button
              title="Try Again"
              onPress={handleRetry}
              iconName="refresh"
              style={styles.errorButton}
              textStyle={styles.retryButtonText}
              buttonColor="#F45303"
              pressedColor="#D43D00"
              releasedColor="#F45303"
              iconColor="#FFFFFF"
              iconSize={20}
              size="medium"
            />
          )}
          <Android12Button
            title={isRecoverable ? "Use QR Code" : "Continue with QR Code"}
            onPress={() => {
              // Force QR fallback mode
              setModalMode('qr_fallback');
            }}
            iconName="qr-code"
            style={styles.errorButton}
            textStyle={styles.retryButtonText}
            buttonColor="#4CAF50"
            pressedColor="#388E3C"
            releasedColor="#4CAF50"
            iconColor="#FFFFFF"
            iconSize={20}
            size="medium"
          />
          <Android12Button
            title="Close"
            onPress={handleClose}
            style={styles.errorButton}
            textStyle={styles.cancelButtonText}
            buttonColor="#6C757D"
            pressedColor="#5A6268"
            releasedColor="#6C757D"
            size="medium"
          />
        </View>
      </View>
    );
  };

  const renderContent = () => {
    switch (modalMode) {
      case 'discovering':
        return renderDiscoveringState();
      case 'connecting':
        return renderConnectingState();
      case 'transferring':
        return renderTransferringState();
      case 'qr_fallback':
        return renderQRFallbackState();
      case 'completed':
        return renderCompletedState();
      case 'error':
        return renderErrorState();
      default:
        return renderDiscoveringState();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Video</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#8B8B8B" />
            </TouchableOpacity>
          </View>

          {/* Status Indicator */}
          <View style={styles.statusBar}>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      modalMode === 'completed'
                        ? '#4CAF50'
                        : modalMode === 'error'
                        ? '#FF5252'
                        : modalMode === 'transferring'
                        ? '#F45303'
                        : '#2196F3',
                  },
                ]}
              />
              <Text style={styles.statusLabel}>
                {modalMode === 'discovering' && 'Discovering'}
                {modalMode === 'connecting' && 'Connecting'}
                {modalMode === 'transferring' && 'Transferring'}
                {modalMode === 'qr_fallback' && 'QR Code'}
                {modalMode === 'completed' && 'Completed'}
                {modalMode === 'error' && 'Error'}
              </Text>
            </View>
          </View>

          {/* Video Info */}
          {videoTitle && (
            <View style={styles.videoInfo}>
              <MaterialIcons name="movie" size={20} color="#F45303" />
              <Text style={styles.videoTitle} numberOfLines={2}>
                {videoTitle}
              </Text>
            </View>
          )}

          {/* Main Content */}
          <View style={styles.content}>
            {renderContent()}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  statusBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  content: {
    padding: 20,
    minHeight: 300,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  videoTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  errorIcon: {
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
  },
  stateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateSubtitle: {
    fontSize: 16,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  statusContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  deviceName: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  deviceStatus: {
    fontSize: 12,
    color: '#8B8B8B',
    textTransform: 'capitalize',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F45303',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  speedText: {
    fontSize: 14,
    color: '#8B8B8B',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  qrInstructions: {
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F45303',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  durationText: {
    fontSize: 14,
    color: '#8B8B8B',
    marginBottom: 20,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  doneButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  errorButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
  },
  debugTitle: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: '#CCCCCC',
    fontFamily: 'monospace',
  },
});

export default UniversalSharingModal;