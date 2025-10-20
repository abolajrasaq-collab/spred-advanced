import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpredFileService from '../../services/SpredFileService';
import { P2PService } from '../../services/P2PService';
import { Android12Button } from '../Android12Button';

const { width, height } = Dimensions.get('window');

interface P2PReceiveScreenProps {
  visible: boolean;
  onClose: () => void;
  deviceName?: string;
  onTransferStart: () => void;
  onTransferComplete: (filePath: string) => void;
}

type ReceiveState =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'receiving'
  | 'completed'
  | 'error';

const P2PReceiveScreen: React.FC<P2PReceiveScreenProps> = ({
  visible,
  onClose,
  deviceName,
  onTransferStart,
  onTransferComplete,
}) => {
  const [receiveState, setReceiveState] = useState<ReceiveState>('idle');
  const [incomingFile, setIncomingFile] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [availableDevices, setAvailableDevices] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [showSettingsButton, setShowSettingsButton] = useState(false);
  const [transferStartTime, setTransferStartTime] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Initialize services
  const spredFileService = SpredFileService.getInstance();
  const p2pService = P2PService.getInstance();


  const openDeviceSettings = () => {
    Alert.alert(
      'Open App Permissions',
      'Would you like to open your app permissions to enable location and nearby devices access?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Permissions',
          onPress: () => {
            if (Platform.OS === 'android') {
              // For Android, open app-specific settings directly
              const packageName = 'com.spred';
              const settingsUrl = `android.settings.APPLICATION_DETAILS_SETTINGS`;
              
              // Try the most direct approach first
              Linking.openURL(`intent://settings/apps/${packageName}#Intent;action=${settingsUrl};end`).catch(() => {
                // Fallback to app settings
                Linking.openURL(`intent://settings/apps/${packageName}#Intent;end`).catch(() => {
                  // Final fallback to general settings
                  Linking.openSettings().catch(() => {
                    Alert.alert(
                      'Settings Unavailable',
                      'Unable to open settings. Please manually go to Settings > Apps > Spred > Permissions to enable location and nearby devices permissions.'
                    );
                  });
                });
              });
            } else {
              // For iOS, use general settings
              Linking.openSettings().catch(() => {
                Alert.alert(
                  'Settings Unavailable',
                  'Unable to open settings. Please manually go to Settings > Spred > Permissions to enable location and nearby devices permissions.'
                );
              });
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (visible && receiveState === 'idle') {
      setIsInitialized(true);
      startReceiving();
    } else if (!visible) {
      stopReceiving();
    }
  }, [visible]);

  // Set up P2P service event listeners
  useEffect(() => {
    if (visible) {
      setupP2PListeners();
    }
    return () => {
      cleanupP2PListeners();
    };
  }, [visible]);

  const startReceiving = async () => {
    try {
      console.log('🚀 Starting P2P receive process...');

      // Check if running on emulator - show error immediately
      if (__DEV__ && Platform.OS === 'android') {
        console.warn('⚠️ Running on emulator - WiFi Direct not supported');
        setReceiveState('error');
        setErrorMessage('WiFi Direct is not supported on emulators. Please test on a physical Android device.');
        setShowSettingsButton(false);
        return;
      }

      setReceiveState('scanning');
      setErrorMessage('');
      setConnectionStatus('Initializing P2P service...');

      // Clean up any previous state first
      try {
        await p2pService.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup warning (non-critical):', cleanupError);
      }

      // Simple initialization without complex timeout logic
      const success = await p2pService.initializeService();
      console.log('🔧 P2P service initialization result:', success);

      if (!success) {
        setReceiveState('error');
        setErrorMessage('Failed to initialize P2P service. Please try on a physical device.');
        return;
      }

      setConnectionStatus('Starting receiver mode...');

      try {
        // Try the new receiver mode first
        const receiverStarted = await p2pService.startReceiverMode();
        if (receiverStarted) {
          console.log('✅ P2P receiver mode started successfully');
          setConnectionStatus('Device is discoverable. Waiting for connections...');
        } else {
          console.log('⚠️ Receiver mode failed, falling back to discovery');
          setConnectionStatus('Searching for available SPRED members...');
          await p2pService.startDiscovery();
        }
      } catch (receiverError: any) {
        console.error('❌ Receiver mode error, falling back to discovery:', receiverError);
        
        // Handle framework busy error specifically
        if (receiverError.message && receiverError.message.includes('framework is busy')) {
          setConnectionStatus('WiFi Direct is busy, retrying...');
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, 3000));
          try {
            await p2pService.startDiscovery();
            setConnectionStatus('Searching for available SPRED members...');
          } catch (retryError) {
            throw retryError;
          }
        } else {
          setConnectionStatus('Searching for available SPRED members...');
          await p2pService.startDiscovery();
        }
      }

      console.log('✅ P2P receiving initialized successfully');
    } catch (error: any) {
      console.error('❌ Start receiving error:', error);
      setReceiveState('error');
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to start receiving';
      let showSettings = false;
      
      if (error.message) {
        if (error.message.includes('framework is busy')) {
          userMessage = 'WiFi Direct is busy. Please close other apps using WiFi Direct and try again.';
        } else if (error.message.includes('permission')) {
          userMessage = 'Permissions required. Please enable location and nearby devices permissions.';
          showSettings = true;
        } else if (error.message.includes('wifi') || error.message.includes('WiFi')) {
          userMessage = 'WiFi must be enabled. Please turn on WiFi and try again.';
        } else if (error.message.includes('location')) {
          userMessage = 'Location services required. Please enable location and try again.';
          showSettings = true;
        } else {
          userMessage = `Failed to start receiving: ${error.message}`;
        }
      }
      
      setErrorMessage(userMessage);
      setShowSettingsButton(showSettings);
    }
  };

  const setupP2PListeners = () => {
    try {
      console.log('🔧 Setting up P2P event handling through service subscriptions');


      // Subscribe to P2P service state changes for real-time updates
      const unsubscribe = p2pService.subscribe((state) => {
        try {
          console.log('📡 P2P state update received:', {
            isConnected: state.isConnected,
            transferProgress: (state.transferProgress as any)?.progress,
            error: state.error
          });

          // Check for discovered devices
          if (
            state.discoveredDevices?.length &&
            state.discoveredDevices.length !== availableDevices.length
          ) {
            const deviceNames = state.discoveredDevices.map(
              d => d.deviceName || 'Unknown Device',
            );
            setAvailableDevices(deviceNames);
            console.log('📱 Devices discovered:', deviceNames);
          }

          // Check for connections
          if (state.isConnected && receiveState === 'scanning') {
            setReceiveState('connected');
            setConnectionStatus('Connected to device');
            console.log('🔗 Device connected');
            
            // Start receiving files when connected (with delay to prevent blocking)
            setTimeout(() => {
              startReceivingFiles();
            }, 500);
          }

          // Check for transfer progress
          if (state.transferProgress) {
            const transferFile = state.transferProgress as any;
            console.log('📊 Transfer progress data:', transferFile);
            
            if (transferFile.progress !== undefined) {
              setProgress(transferFile.progress);
              setIncomingFile(
                transferFile.name || transferFile.file || 'incoming_file',
              );
              
              if (
                receiveState !== 'receiving' &&
                receiveState !== 'completed'
              ) {
                setReceiveState('receiving');
                setTransferStartTime(Date.now()); // Track when transfer started
                setConnectionStatus(
                  `Receiving ${
                    transferFile.name || transferFile.file || 'file'
                  }...`,
                );
                onTransferStart();
              }
              
              if (transferFile.progress === 100) {
                // Transfer completed
                setReceiveState('completed');
                onTransferComplete(
                  transferFile.filePath || transferFile.file || '',
                );
                console.log('✅ Transfer completed');
              } else {
                console.log('📊 Transfer progress:', transferFile.progress, '%');
              }
            } else {
              console.log('⚠️ Transfer progress object found but no progress value:', transferFile);
            }
          }

          // Check for errors (but not during active transfers)
          if (state.error && receiveState !== 'receiving' && receiveState !== 'completed') {
            console.log('⚠️ P2P service error:', state.error);
            setReceiveState('error');
            setErrorMessage(state.error);
          }
        } catch (error) {
          console.error('Error processing P2P state update:', error);
          if (receiveState !== 'receiving' && receiveState !== 'completed') {
            setReceiveState('error');
            setErrorMessage('Failed to process P2P state update');
          }
        }
      });

      // Store unsubscribe function for cleanup
      (p2pService as any)._receiveUnsubscribe = unsubscribe;
    } catch (error) {
      console.error('Failed to setup P2P listeners:', error);
      setReceiveState('error');
      setErrorMessage('Failed to setup P2P event handling');
    }
  };

  const startReceivingFiles = async () => {
    try {
      console.log('📥 Starting file receive process...');
      setReceiveState('receiving');
      setConnectionStatus('Receiving file...');
      setErrorMessage(''); // Clear any previous errors
      
      // Use P2P service's integrated file handling with retry logic
      const receivedFilePath = await p2pService.receiveFile();
      
      if (receivedFilePath) {
        console.log('✅ File received successfully at:', receivedFilePath);
        setReceiveState('completed');
        setConnectionStatus('File received successfully!');

        // Call completion callback if provided
        onTransferComplete?.(receivedFilePath);
      } else {
        console.error('❌ File receive failed - no file path returned');
        setReceiveState('error');
        setErrorMessage('Transfer failed. The sender may have cancelled or the connection was lost.');
        setShowSettingsButton(false); // Don't show settings for transfer failures
      }
    } catch (error: any) {
      console.error('❌ Error during file receive:', error);
      setReceiveState('error');
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to receive file';
      let showSettings = false;
      
      if (error.message) {
        if (error.message.includes('framework is busy')) {
          userMessage = 'WiFi Direct is busy. Please wait a moment and try again.';
        } else if (error.message.includes('operation failed')) {
          userMessage = 'Transfer failed. Please ensure both devices are connected and try again.';
        } else if (error.message.includes('permission')) {
          userMessage = 'Permission required. Please enable location and nearby devices permissions.';
          showSettings = true;
        } else if (error.message.includes('timeout')) {
          userMessage = 'Transfer timed out. Please check your connection and try again.';
        } else {
          userMessage = `Transfer failed: ${error.message}`;
        }
      }
      
      setErrorMessage(userMessage);
      setShowSettingsButton(showSettings);
    }
  };

  const cleanupP2PListeners = () => {
    try {
      // Unsubscribe from P2P service state changes
      const unsubscribe = (p2pService as any)._receiveUnsubscribe;
      if (unsubscribe) {
        unsubscribe();
        (p2pService as any)._receiveUnsubscribe = null;
      }
    } catch (error) {
      console.error('Error cleaning up P2P listeners:', error);
    }
  };

  const handleConnectionRequest = async (device: any) => {
    try {
      setConnectionStatus(`Connecting to ${device.deviceName}...`);

      const success = await p2pService.connectToDevice(device);
      if (success) {
        setReceiveState('connected');
        setConnectionStatus(`Connected to ${device.deviceName}`);
        console.log('✅ Connected to device:', device.deviceName);
      } else {
        throw new Error('Failed to connect to device');
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      setReceiveState('error');
      setErrorMessage(`Connection failed: ${error.message}`);
    }
  };

  const stopReceiving = async () => {
    try {
      // Properly disconnect P2P service to free up ports
      await p2pService.disconnect();
      cleanupP2PListeners();

      setReceiveState('idle');
      setProgress(0);
      setIncomingFile('');
      setErrorMessage('');
      setAvailableDevices([]);
      setConnectionStatus('');
      setTransferStartTime(0);

      console.log('🛑 P2P receiving stopped and disconnected');
    } catch (error) {
      console.error('❌ Error stopping P2P service:', error);
    }
  };

  const handleCancelReceive = () => {
    // Always stop the service and close the modal
    stopReceiving();
    onClose();
  };

  const handleRejectTransfer = () => {
    // Reject the incoming transfer
    // Note: P2P service doesn't have a reject method, just close the modal
    setReceiveState('scanning');
    Alert.alert(
      'Transfer Rejected',
      'The incoming file transfer has been rejected.',
    );
  };

  const handleAcceptTransfer = (fileName: string) => {
    setIncomingFile(fileName);
    setReceiveState('receiving');
    onTransferStart();

    // Accept the transfer - the P2P service will handle file reception automatically
    console.log('✅ Accepted transfer for:', fileName);
  };

  // Automatically start receiving when a connection is established
  useEffect(() => {
    if (
      visible &&
      receiveState === 'connected' &&
      availableDevices.length > 0
    ) {
      // If we're connected and there are devices available, prepare for receiving
      console.log('✅ Ready to receive from connected device');
      // We don't need the incoming transfer modal since the sender automatically sends
      setReceiveState('receiving');
      onTransferStart();
    }
  }, [receiveState, availableDevices, visible]);

  const renderScanningState = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="wifi-tethering" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.stateTitle}>Scanning for Devices</Text>
      <Text style={styles.stateSubtitle}>
        Looking for nearby SPRED users...
      </Text>
      <View style={styles.statusContainer}>
        <ActivityIndicator size="small" color="#4CAF50" />
        <Text style={styles.statusTextHighlight}>
          {connectionStatus ? connectionStatus : 'Initializing...'}
        </Text>
      </View>

      {/* Show discovered devices */}
      {availableDevices.length > 0 && (
        <View style={styles.devicesContainer}>
          <Text style={styles.devicesTitle}>Found Devices:</Text>
          {availableDevices.map((device, index) => (
            <View key={index} style={styles.deviceItem}>
              <MaterialIcons name="smartphone" size={16} color="#8B8B8B" />
              <Text style={styles.deviceName}>{device}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderConnectingState = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color="#F45303" />
      </View>
      <Text style={styles.stateTitle}>Establishing Connection</Text>
      <Text style={styles.stateSubtitle}>
        {connectionStatus ? connectionStatus : 'Connecting with sender...'}
      </Text>
    </View>
  );

  // Removed renderConnectedState - receiver automatically transitions to receiving state

  const renderIncomingTransferModal = () => (
    <Modal
      visible={receiveState === 'connected' && incomingFile === ''}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.incomingModal}>
          <View style={styles.incomingIcon}>
            <MaterialIcons name="file-download" size={48} color="#F45303" />
          </View>
          <Text style={styles.incomingTitle}>Incoming Transfer</Text>
          <Text style={styles.incomingSubtitle}>
            {deviceName || 'A connected device'} wants to send you a file
          </Text>
          <View style={styles.incomingActions}>
            <Android12Button
              title="Reject"
              onPress={handleRejectTransfer}
              iconName="close"
              style={styles.incomingButton}
              textStyle={styles.rejectButtonText}
              buttonColor="#FF5252"
              pressedColor="#D32F2F"
              releasedColor="#4CAF50"
              iconColor="#FFFFFF"
              iconSize={20}
              size="small"
            />
            <Android12Button
              title="Accept"
              onPress={() => handleAcceptTransfer('incoming_file')}
              iconName="check"
              style={styles.incomingButton}
              textStyle={styles.acceptButtonText}
              buttonColor="#4CAF50"
              pressedColor="#388E3C"
              releasedColor="#4CAF50"
              iconColor="#FFFFFF"
              iconSize={20}
              size="small"
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderReceivingState = () => (
    <View style={styles.stateContainer}>
      <View style={styles.iconContainer}>
        <ActivityIndicator size="large" color="#F45303" />
      </View>
      <Text style={styles.stateTitle}>Receiving File</Text>
      <Text style={styles.fileName}>
        {incomingFile ? incomingFile : 'Receiving...'}
      </Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      <Text style={styles.stateSubtitle}>
        Receiving from{' '}
        <Text style={{ fontWeight: 'bold', color: '#4CAF50' }}>
          {deviceName ? deviceName : 'connected device'}
        </Text>
      </Text>
    </View>
  );

  const renderCompletedState = () => (
    <View style={styles.stateContainer}>
      <View style={[styles.iconContainer, styles.completedIcon]}>
        <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
      </View>
      <Text style={styles.stateTitle}>Transfer Completed!</Text>
      <Text style={styles.fileName}>
        {incomingFile ? incomingFile : 'File received'}
      </Text>
      <Text style={styles.stateSubtitle}>
        File saved to your Downloads folder
      </Text>
      <Android12Button
        title="Done"
        onPress={onClose}
        iconName="done"
        style={styles.doneButton}
        textStyle={styles.doneButtonText}
        buttonColor="#4CAF50"
        pressedColor="#388E3C"
        releasedColor="#4CAF50"
        iconColor="#FFFFFF"
        iconSize={20}
        size="small"
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.stateContainer}>
      <View style={[styles.iconContainer, styles.errorIcon]}>
        <MaterialIcons name="error" size={64} color="#FF5252" />
      </View>
      <Text style={styles.stateTitle}>Transfer Failed</Text>
      <Text style={styles.stateSubtitle}>
        {errorMessage ? errorMessage : 'An error occurred during transfer.'}
      </Text>
      <View style={styles.errorActions}>
        {showSettingsButton && (
          <Android12Button
            title="Open Permissions"
            onPress={openDeviceSettings}
            iconName="settings"
            style={styles.errorButton}
            textStyle={styles.settingsButtonText}
            buttonColor="#2196F3"
            pressedColor="#1976D2"
            releasedColor="#4CAF50"
            iconColor="#FFFFFF"
            iconSize={20}
            size="small"
          />
        )}
        <Android12Button
          title="Try Again"
          onPress={startReceiving}
          iconName="refresh"
          style={styles.errorButton}
          textStyle={styles.retryButtonText}
          buttonColor="#F45303"
          pressedColor="#D43D00"
          releasedColor="#4CAF50"
          iconColor="#FFFFFF"
          iconSize={20}
          size="small"
        />
        <Android12Button
          title="Close"
          onPress={onClose}
          style={styles.errorButton}
          textStyle={styles.cancelButtonText}
          buttonColor="#6C757D"
          pressedColor="#5A6268"
          releasedColor="#4CAF50"
          size="small"
        />
      </View>
    </View>
  );

  const renderContent = () => {
    switch (receiveState) {
      case 'scanning':
        return renderScanningState();
      case 'connecting':
        return renderConnectingState();
      case 'connected':
        // In the simplified flow, we transition directly to receiving when connected
        // so this state should rarely be displayed to the user
        return renderReceivingState(); // Show receiving state since we're ready to receive
      case 'receiving':
        return renderReceivingState();
      case 'completed':
        return renderCompletedState();
      case 'error':
        return renderErrorState();
      default:
        return renderScanningState();
    }
  };


  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleCancelReceive}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Receive SPRED video</Text>
              <Android12Button
                title=""
                onPress={handleCancelReceive}
                iconName="close"
                style={styles.closeButton}
                buttonColor="transparent"
                pressedColor="rgba(0, 0, 0, 0.1)"
                releasedColor="transparent"
                iconColor="#8B8B8B"
                iconSize={24}
                size="small"
              />
            </View>

            {/* Status Bar */}
            <View style={styles.statusBar}>
              <View style={styles.statusItem}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        receiveState === 'completed'
                          ? '#4CAF50'
                          : receiveState === 'error'
                          ? '#FF5252'
                          : receiveState === 'receiving'
                          ? '#F45303'
                          : '#4CAF50',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {receiveState === 'scanning'
                    ? 'Scanning'
                    : receiveState === 'connecting'
                    ? 'Connecting'
                    : receiveState === 'connected'
                    ? 'Connected'
                    : receiveState === 'receiving'
                    ? 'Receiving'
                    : receiveState === 'completed'
                    ? 'Completed'
                    : 'Scanning'}
                </Text>
              </View>
              {deviceName && (
                <View style={styles.statusItem}>
                  <MaterialIcons name="smartphone" size={16} color="#8B8B8B" />
                  <Text style={styles.statusText}>{deviceName}</Text>
                </View>
              )}
            </View>

            {/* Main Content */}
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {renderContent()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Incoming Transfer Modal */}
      {renderIncomingTransferModal()}
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: '70%',
    width: '100%',
    marginTop: 'auto',
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    gap: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  stateContainer: {
    alignItems: 'center',
    width: '100%',
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
  completedIcon: {
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
  fileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F45303',
    textAlign: 'center',
    marginBottom: 24,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
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
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    marginTop: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#F45303',
  },
  retryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#4CAF50',
  },
  settingsButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  incomingModal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  incomingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  incomingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  incomingSubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 24,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  incomingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rejectButton: {
    backgroundColor: '#FF5252',
  },
  rejectButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  acceptButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // New styles for robust receive screen
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  statusTextHighlight: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  devicesContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 16,
  },
  devicesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 6,
  },
  deviceName: {
    fontSize: 14,
    color: '#CCCCCC',
  },
});

export default P2PReceiveScreen;
