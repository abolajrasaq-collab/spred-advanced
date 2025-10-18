import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import PlatformTouchable from '../PlatformTouchable/PlatformTouchable';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Android12Button } from '../Android12Button';
import {
  P2PService,
  Device,
  P2PFile,
  P2PServiceState,
} from '../../services/P2PService';

const { width } = Dimensions.get('window');
const DEVICE_ITEM_HEIGHT = 80;


interface WiFiDirectDiscoveryProps {
  onBack: () => void;
  onDeviceSelected: (device: Device) => void;
  onFileTransferStart: (file: P2PFile) => void;
  selectedVideo?: {
    title: string;
    thumbnail: string;
    duration: string;
    size: number;
    videoKey: string;
    src: string;
  } | null;
  autoConnect?: boolean;
}

const WiFiDirectDiscovery: React.FC<WiFiDirectDiscoveryProps> = ({
  onBack,
  onDeviceSelected,
  onFileTransferStart,
  selectedVideo,
  autoConnect,
}) => {
  const [p2pState, setP2PState] = useState<P2PServiceState | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const p2pService = P2PService.getInstance();

  useEffect(() => {
    // Initialize animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize P2P service and auto-start discovery
    initializeAndAutoStartDiscovery();

    // Subscribe to P2P state changes
    const unsubscribe = p2pService.subscribe(state => {
      console.log('🔄 P2P State update received:', {
        isInitialized: state.isInitialized,
        hasPermissions: state.hasPermissions,
        isDiscovering: state.isDiscovering,
        isConnected: state.isConnected,
        discoveredDevices: state.discoveredDevices?.length || 0,
        error: state.error
      });
      
      // Force UI update by setting state
      setP2PState(state);
      
      // Additional state sync check for initialization
      if (state.isInitialized && !p2pState?.isInitialized) {
        console.log('🔄 State subscription: P2P service initialized, forcing UI update...');
        // Force a re-render by updating state
        setTimeout(() => {
          setP2PState({...state});
        }, 100);
      }

      // Check if file transfer is in progress
      if (state.transferProgress && (state.transferProgress as any).progress > 0) {
        onFileTransferStart(state.transferProgress);
      }

      // Auto-connect to first available device if enabled
      if (
        autoConnect &&
        state.discoveredDevices.length > 0 &&
        !state.isConnected &&
        !isConnecting &&
        !isAutoConnecting
      ) {
        // Auto-connect to the first available device
        const firstDevice = state.discoveredDevices[0];
        if (firstDevice.status === 0) { // status 0 means available
          setIsAutoConnecting(true);
          handleConnectToDevice(firstDevice);
        }
      }
    });

    return () => {
      unsubscribe();
      // Cleanup
      if (p2pState?.isDiscovering) {
        p2pService.stopDiscovery();
      }
      // Clear discovery interval on unmount
      if (discoveryInterval) {
        clearInterval(discoveryInterval);
      }
    };
  }, []);

  // Force UI update when component becomes visible
  useEffect(() => {
    const forceUIUpdate = () => {
      console.log('🔄 Component focused - forcing UI update...');
      const currentState = p2pService.getState();
      console.log('🔄 Current state on focus:', currentState);
      setP2PState(currentState);
    };

    // Force update on mount and when component becomes visible
    forceUIUpdate();

    // Add a delayed state check to catch initialization completion
    const delayedStateCheck = setTimeout(() => {
      const currentState = p2pService.getState();
      console.log('🔄 Delayed state check:', currentState);
      if (currentState.isInitialized && !p2pState?.isInitialized) {
        console.log('🔄 State sync: P2P service initialized, updating UI...');
        setP2PState(currentState);
      }
    }, 2000); // Check after 2 seconds

    return () => {
      clearTimeout(delayedStateCheck);
    };
  }, []); // Removed p2pState dependency to prevent loops

  const initializeAndAutoStartDiscovery = async () => {
    try {
      console.log('🚀 Starting P2P service initialization...');
      const initialized = await p2pService.initializeService();
      console.log('🚀 P2P service initialization result:', initialized);
      
      if (!initialized) {
        // Get the specific error from P2P service state
        const currentState = p2pService.getState();
        console.log('❌ Initialization failed, current state:', currentState);
        const errorMessage =
          currentState.error || 'Failed to initialize P2P service';

        Alert.alert('WiFi Direct Initialization Failed', errorMessage, [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => p2pService.openSettings(),
          },
        ]);
      } else {
        console.log('✅ P2P service initialized successfully');
        
        // Force state synchronization after successful initialization
        setTimeout(() => {
          const currentState = p2pService.getState();
          console.log('🔄 Post-initialization state sync:', currentState);
          setP2PState(currentState);
        }, 500);
        
        // Auto-start discovery after successful initialization
        console.log('🔍 Auto-starting discovery in 1 second...');
        setTimeout(() => {
          autoStartDiscovery();
          // Set up periodic discovery refresh
          startPeriodicDiscovery();
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ P2P initialization error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert(
        'WiFi Direct Error',
        `Failed to initialize WiFi Direct: ${error.message || 'Unknown error'}`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => initializeAndAutoStartDiscovery(),
          },
        ],
      );
    }
  };

  // Periodic discovery to maintain fresh device list
  const [discoveryInterval, setDiscoveryInterval] =
    useState<NodeJS.Timeout | null>(null);

  const startPeriodicDiscovery = () => {
    // Clear any existing interval
    if (discoveryInterval) {
      clearInterval(discoveryInterval);
    }

    // Set up a periodic discovery refresh every 30 seconds (reduced frequency for performance)
    const interval = setInterval(async () => {
      if (p2pState?.isDiscovering) {
        // Only refresh if we're currently discovering
        try {
          await p2pService.refreshDeviceList();
        } catch (error) {
          console.log('Periodic discovery refresh failed:', error);
        }
      }
    }, 30000); // Refresh every 30 seconds

    setDiscoveryInterval(interval as unknown as NodeJS.Timeout);
  };

  const autoStartDiscovery = async () => {
    try {
      console.log('🔍 Auto-starting device discovery...');
      
      // Check all requirements before auto-starting
      const currentState = p2pService.getState();
      console.log('🔍 Current P2P state:', {
        isInitialized: currentState.isInitialized,
        hasPermissions: currentState.hasPermissions,
        isWifiEnabled: currentState.isWifiEnabled,
        isLocationEnabled: currentState.isLocationEnabled,
        isDiscovering: currentState.isDiscovering,
        discoveredDevices: currentState.discoveredDevices?.length || 0,
        error: currentState.error
      });

      if (!currentState.hasPermissions) {
        console.log('❌ No permissions, showing permission modal');
        setShowPermissionsModal(true);
        return;
      }

      if (!currentState.isWifiEnabled) {
        console.log('❌ WiFi not enabled');
        Alert.alert(
          'WiFi Required',
          'WiFi must be enabled to use WiFi Direct. Please enable WiFi and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable WiFi', onPress: () => p2pService.openSettings() },
          ],
        );
        return;
      }

      if (!currentState.isLocationEnabled) {
        console.log('❌ Location not enabled');
        Alert.alert(
          'Location Required',
          'Location must be enabled to discover devices. Please enable location and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable Location', onPress: () => p2pService.openSettings() },
          ],
        );
        return;
      }

      console.log('✅ All requirements met, starting discovery...');
      // Start discovery automatically
      const success = await p2pService.startDiscovery();
      console.log('🔍 Discovery start result:', success);
      
      if (!success) {
        console.log('❌ Auto-discovery failed, user will need to start manually');
        const errorState = p2pService.getState();
        console.log('❌ Discovery error state:', errorState);
      } else {
        console.log('✅ Auto-discovery started successfully');
      }
    } catch (error: any) {
      console.error('❌ Auto-discovery error:', error);
      console.error('❌ Auto-discovery error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
  };

  const initializeP2PService = async () => {
    try {
      const initialized = await p2pService.initializeService();
      if (!initialized) {
        // Get the specific error from P2P service state
        const currentState = p2pService.getState();
        const errorMessage =
          currentState.error || 'Failed to initialize P2P service';

        Alert.alert('WiFi Direct Initialization Failed', errorMessage, [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => p2pService.openSettings(),
          },
        ]);
      }
    } catch (error: any) {
      console.error('P2P initialization error:', error);
      Alert.alert(
        'WiFi Direct Error',
        `Failed to initialize WiFi Direct: ${error.message || 'Unknown error'}`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Retry',
            onPress: () => initializeP2PService(),
          },
        ],
      );
    }
  };

  const handleStartDiscovery = useCallback(async () => {
    try {
      // Get the current state to avoid stale closure issues
      const currentState = p2pService.getState();
      
      if (!currentState.hasPermissions) {
        setShowPermissionsModal(true);
        return;
      }

      if (!currentState.isWifiEnabled) {
        Alert.alert(
          'WiFi Required',
          'WiFi must be enabled to use WiFi Direct. Please enable WiFi and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable WiFi', onPress: () => p2pService.openSettings() },
          ],
        );
        return;
      }

      if (!currentState.isLocationEnabled) {
        Alert.alert(
          'Location Required',
          'Location must be enabled to discover devices. Please enable location and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Enable Location', onPress: () => p2pService.openSettings() },
          ],
        );
        return;
      }

      console.log('🔍 Starting device discovery...');
      const success = await p2pService.startDiscovery();
      if (!success) {
        const errorState = p2pService.getState();
        Alert.alert(
          'Error',
          errorState?.error || 'Failed to start device discovery',
        );
      }
    } catch (error) {
      console.error('❌ Start discovery error:', error);
      Alert.alert(
        'Discovery Error',
        `Failed to start device discovery: ${error.message || 'Unknown error'}`,
      );
    }
  }, []);

  const handleStopDiscovery = useCallback(async () => {
    await p2pService.stopDiscovery();
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting from current device...');
      await p2pService.removeGroup();
      Alert.alert(
        'Disconnected',
        'Successfully disconnected from the current device.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Disconnect error:', error);
      Alert.alert(
        'Disconnect Error',
        'Failed to disconnect. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    console.log('🔐 Starting permission request process...');
    
    try {
      // First, close the modal to prevent UI issues
      setShowPermissionsModal(false);
      
      console.log('🔐 Modal closed, calling p2pService.requestPermissions()...');
      
      // Add a small delay to ensure modal is closed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try the native P2P permission request first
      let success = false;
      try {
        success = await p2pService.requestPermissions();
        console.log('🔐 Native permission request completed, result:', success);
      } catch (nativeError: any) {
        console.error('❌ Native permission request failed:', nativeError);
        console.log('🔐 Falling back to React Native permissions...');
        
        // Fallback to React Native permissions
        success = await requestPermissionsFallback();
        console.log('🔐 Fallback permission request completed, result:', success);
      }
      
      if (success) {
        console.log('🔐 Permissions granted, starting discovery in 1 second...');
        // Wait a moment for the state to update, then start discovery
        setTimeout(() => {
          console.log('🔐 Starting discovery after permission grant...');
          handleStartDiscovery();
        }, 1000);
      } else {
        console.log('🔐 Permissions denied, showing alert...');
        Alert.alert(
          'Permissions Required',
          'All permissions are required for WiFi Direct to work properly. Please grant all permissions.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                console.log('🔐 Opening settings...');
                p2pService.openSettings();
              },
            },
          ],
        );
      }
    } catch (error: any) {
      console.error('❌ Permission request error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      
      Alert.alert(
        'Permission Error', 
        `Failed to request permissions: ${error.message || 'Unknown error'}\n\nPlease try again or check your device settings.`,
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              console.log('🔐 Opening settings from error handler...');
              p2pService.openSettings();
            },
          },
        ]
      );
    }
  }, []);

  // Fallback permission request using React Native
  const requestPermissionsFallback = async (): Promise<boolean> => {
    try {
      console.log('🔐 Using React Native permission fallback...');
      
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
          PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
        ];

        console.log('🔐 Requesting Android permissions:', permissions);
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
        
        console.log('🔐 Android permissions result:', granted);
        console.log('🔐 All permissions granted:', allGranted);
        
        return allGranted;
      } else {
        console.log('🔐 iOS platform - permissions handled differently');
        return true; // iOS handles permissions differently
      }
    } catch (error: any) {
      console.error('❌ Fallback permission request failed:', error);
      return false;
    }
  };

  // Safe mode - just open settings without trying to request permissions
  const handleSafeModePermissions = useCallback(() => {
    console.log('🔐 Safe mode: Opening settings directly...');
    setShowPermissionsModal(false);
    
    Alert.alert(
      'Manual Permission Setup',
      'Please manually enable the following permissions in your device settings:\n\n• Location\n• Nearby devices\n• WiFi control\n\nTap "Open Settings" to go to your app permissions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            console.log('🔐 Opening app settings...');
            p2pService.openSettings();
          },
        },
      ],
    );
  }, []);

  const handleConnectToDevice = useCallback(
    async (device: Device) => {
      console.log('🔗 Device selected for connection:', device.deviceName);
      setSelectedDevice(device);
      setShowConnectionModal(true);
      setIsConnecting(true);
      setIsAutoConnecting(false); // Stop auto-connecting
      setConnectionProgress(0);

      try {
        console.log('🔗 Attempting smart connection to device:', device.deviceAddress);
        // Smart connection with automatic retry logic
        const success = await p2pService.smartConnect(device.deviceAddress);

        if (success) {
          console.log('✅ Connection successful, updating progress');
          setConnectionProgress(100);
          // If we have a selected video to send, start the transfer immediately
          if (selectedVideo) {
            console.log('📤 Starting video transfer for pre-selected video:', selectedVideo.title);
            setTimeout(async () => {
              setShowConnectionModal(false);
              // Start the file transfer process
              try {
                console.log('📤 Starting video transfer for pre-selected video:', selectedVideo.title);
                console.log('📤 Video object keys:', Object.keys(selectedVideo));
                console.log('📤 Video properties:', {
                  videoKey: selectedVideo.videoKey,
                  title: selectedVideo.title,
                  src: selectedVideo.src,
                  size: selectedVideo.size,
                  duration: selectedVideo.duration
                });
                
                // Get the local file path for the video
                const filePath = await p2pService.getLocalVideoPath(selectedVideo);
                console.log('📤 getLocalVideoPath result:', filePath);
                
                if (!filePath) {
                  console.log('📤 No local file path found, checking for download...');
                  // If no local path, we need to download the video first
                  Alert.alert(
                    'Download Required',
                    'The video needs to be downloaded before it can be shared. Would you like to download it first?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Download', 
                        onPress: async () => {
                          try {
                            // Here you would implement video download logic
                            console.log('📥 Downloading video for sharing...');
                            Alert.alert('Download Started', 'Please wait for the download to complete before sharing.');
                          } catch (error) {
                            console.error('Download error:', error);
                            Alert.alert('Download Error', 'Failed to download video');
                          }
                        }
                      }
                    ]
                  );
                  return;
                }

                console.log('📤 Sending local file:', filePath);
                const transferSuccess = await p2pService.sendFile(filePath);
                if (transferSuccess) {
                  // Show transfer progress modal through the parent callback
                  onFileTransferStart({
                    file: selectedVideo.title,
                    progress: 0,
                    device: device.deviceName || 'Connected Device',
                    time: Date.now(),
                  } as P2PFile);
                } else {
                  const currentState = p2pService.getState();
                  const errorMessage = currentState.error || 'Unknown transfer error';
                  Alert.alert(
                    'Transfer Error',
                    `Failed to start video transfer: ${errorMessage}`,
                  );
                }
              } catch (error: any) {
                console.error('File transfer error:', error);
                Alert.alert('Transfer Error', `Failed to send video: ${error.message}`);
              }
            }, 500);
          }
          else {
            console.log('📁 No pre-selected video, proceeding to file selection');
            // If no video is pre-selected, proceed to file selection as before
            setTimeout(() => {
              setShowConnectionModal(false);
              // Call the parent callback to handle device selection and transfer
              onDeviceSelected(device);
            }, 500);
          }
        } else {
          console.error('❌ Connection failed to device:', device.deviceName);
          setIsConnecting(false);
          setShowConnectionModal(false);
          
          // Get the specific error from P2P service state
          const currentState = p2pService.getState();
          const errorMessage = currentState.error || 'Unknown connection error';
          
          // Get smart error guidance
          const guidance = p2pService.getErrorGuidance(errorMessage);
          const guidanceText = guidance.actions.map((action, index) => `${index + 1}. ${action}`).join('\n');
          
          Alert.alert(
            guidance.title,
            `${guidance.message}\n\nTroubleshooting steps:\n${guidanceText}`,
            [
              { text: 'OK', style: 'cancel' },
              { 
                text: 'Retry', 
                onPress: () => {
                  // Retry connection after a short delay
                  setTimeout(() => {
                    handleConnectToDevice(device);
                  }, 1000);
                }
              }
            ]
          );
        }
      } catch (error) {
        setIsConnecting(false);
        Alert.alert('Connection Error', error.message);
      }
    },
    [p2pState, onDeviceSelected, onFileTransferStart, selectedVideo],
  );

  const handleCreateGroup = useCallback(async () => {
    try {
      // Check if P2P service is initialized
      if (!p2pState?.isInitialized) {
        Alert.alert(
          'Error',
          'WiFi Direct is still initializing. Please wait a moment and try again.',
        );
        return;
      }

      // Check permissions before creating group
      if (!p2pState.hasPermissions) {
        Alert.alert(
          'Permissions Required',
          'Please grant the required permissions first before creating a group.',
        );
        setShowPermissionsModal(true);
        return;
      }

      // Check if WiFi is enabled
      if (!p2pState.isWifiEnabled) {
        Alert.alert(
          'WiFi Required',
          'WiFi must be enabled to create a group. Please enable WiFi and try again.',
        );
        return;
      }

      // Check if location is enabled
      if (!p2pState.isLocationEnabled) {
        Alert.alert(
          'Location Required',
          'Location must be enabled to create a group. Please enable location and try again.',
        );
        return;
      }

      // Stop any ongoing discovery before creating group
      if (p2pState.isDiscovering) {
        await p2pService.stopDiscovery();
      }

      const success = await p2pService.createGroup();
      if (success) {
        Alert.alert(
          'Success',
          'Group created successfully! Other devices can now connect to you.\n\nYour device is now the Group Owner (GO).',
        );
      } else {
        const errorMessage = p2pState?.error || 'Failed to create group';
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('Create group error:', error);
      Alert.alert(
        'Error',
        `Failed to create group: ${error.message || 'Unknown error'}`,
      );
    }
  }, [p2pState, p2pService]);

  const renderDeviceItem = ({
    item,
    index,
  }: {
    item: Device;
    index: number;
  }) => {
    // In WiFi Direct, status 0 means available, other statuses might be valid for connection
    // Modified to allow connection to more status types
    const isAvailable = item.status === 0 || item.status === 3; // Available statuses
    const isConnecting = item.status === 1; // Invited status
    const isFailed = item.status === 2; // Failed status
    const isOutOfRange = item.status === 4; // Out of range status

    // Determine status text and color
    let deviceStatus = 'Available';
    let statusColor = '#4CAF50';

    if (isConnecting) {
      deviceStatus = 'Invited';
      statusColor = '#FF9800';
    } else if (isFailed) {
      deviceStatus = 'Failed';
      statusColor = '#FF5252';
    } else if (isOutOfRange) {
      deviceStatus = 'Out of range';
      statusColor = '#8B8B8B';
    } else if (!isAvailable) {
      deviceStatus = 'Busy';
      statusColor = '#FF9800';
    }

    // Allow connection if the device is available or in a state where connection is possible
    const canConnect = isAvailable || item.status === 3; // Allow connection even during discovery

    // Simulate signal strength based on device status
    const getSignalStrength = () => {
      if (isOutOfRange) return 0;
      if (isFailed) return 1;
      if (isConnecting || !isAvailable) return 2;
      return 3; // Available devices have good signal
    };

    const signalBars = getSignalStrength();
    const getSignalColor = () => {
      if (signalBars === 0) return '#8B8B8B';
      if (signalBars === 1) return '#F44336';
      if (signalBars === 2) return '#FF9800';
      return '#4CAF50';
    };

    return (
      <Animated.View
        style={[
          styles.deviceItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.deviceItemContent,
            canConnect
              ? styles.deviceItemContentConnectable
              : styles.deviceItemContentDisabled,
          ]}
          onPress={() => {
            console.log('🔘 Device item pressed:', item.deviceName, 'canConnect:', canConnect);
            if (canConnect) {
              handleConnectToDevice(item);
            } else {
              console.log('❌ Device not connectable:', item.deviceName, 'status:', item.status, 'isAvailable:', isAvailable);
            }
          }}
          disabled={!canConnect}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View
            style={[styles.deviceIcon, !isAvailable && styles.deviceIconBusy]}
          >
            <MaterialIcons
              name="smartphone"
              size={32}
              color={isAvailable ? '#4CAF50' : statusColor}
            />
            {!isAvailable &&
              item.status !== 3 && ( // Don't show lock for status 3 (available)
                <View style={styles.busyIndicator}>
                  <MaterialIcons name="lock" size={12} color="#FFFFFF" />
                </View>
              )}
          </View>

          <View style={styles.deviceInfo}>
            <Text
              style={[styles.deviceName, !isAvailable && styles.deviceNameBusy]}
              numberOfLines={1}
            >
              {item.deviceName}
            </Text>
            <Text style={styles.deviceAddress}>{item.deviceAddress}</Text>
            <View style={styles.deviceStatusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: statusColor },
                ]}
              />
              <Text style={styles.deviceStatus}>{deviceStatus}</Text>
              {isAvailable && (
                <Text style={[styles.connectHint, { color: '#4CAF50', fontWeight: 'bold' }]}>
                  TAP TO CONNECT
                </Text>
              )}
            </View>
            
            {/* Signal Strength Indicator */}
            <View style={styles.signalStrengthContainer}>
              <View style={styles.signalBars}>
                {[1, 2, 3, 4].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.signalBar,
                      {
                        backgroundColor: bar <= signalBars ? getSignalColor() : '#333333',
                        height: bar * 3 + 6,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.signalStrengthText}>
                {signalBars === 0 ? 'No Signal' : 
                 signalBars === 1 ? 'Weak' :
                 signalBars === 2 ? 'Fair' :
                 signalBars === 3 ? 'Good' : 'Excellent'}
              </Text>
            </View>
          </View>

          <View style={styles.deviceAction}>
            {canConnect ? (
              <View style={[styles.connectButton, { backgroundColor: '#4CAF50' }]}>
                <MaterialIcons name="wifi-find" size={20} color="#FFFFFF" />
                <Text style={[styles.connectButtonText, { color: '#FFFFFF' }]}>Connect</Text>
              </View>
            ) : isAvailable ? (
              <MaterialIcons name="chevron-right" size={24} color="#F45303" />
            ) : (
              <MaterialIcons
                name={isOutOfRange ? 'visibility-off' : 'lock'}
                size={24}
                color={statusColor}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <MaterialIcons
          name={p2pState?.isDiscovering ? 'wifi-find' : 'devices'}
          size={64}
          color={p2pState?.isDiscovering ? '#F45303' : '#8B8B8B'}
        />
        {p2pState?.isDiscovering && <View style={styles.searchingRing} />}
      </View>
      <Text style={styles.emptyStateTitle}>
        {p2pState?.isDiscovering
          ? 'Discovering Devices...'
          : 'No Devices Found'}
      </Text>
      <Text style={styles.emptyStateMessage}>
        {p2pState?.isDiscovering
          ? 'Looking for nearby devices that can connect via WiFi Direct'
          : 'Make sure other devices have WiFi Direct enabled and are nearby'}
      </Text>
      {p2pState?.isDiscovering && (
        <View style={styles.discoveryStats}>
          <ActivityIndicator size="small" color="#F45303" />
          <Text style={styles.discoveryStatsText}>Scanning for devices...</Text>
        </View>
      )}
    </View>
  );

  const renderAutoConnectStatus = () => {
    if (!isAutoConnecting) {
      return null;
    }

    return (
      <View style={styles.autoConnectBanner}>
        <ActivityIndicator size="small" color="#FFFFFF" />
        <Text style={styles.autoConnectText}>
          Auto-connecting to the first available device...
        </Text>
        <TouchableOpacity onPress={() => setIsAutoConnecting(false)}>
          <MaterialIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  };

  if (!p2pState) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F45303" />
        <Text style={styles.loadingText}>Initializing WiFi Direct...</Text>
      </View>
    );
  }

  // Show initialization error if service failed to initialize
  if (!p2pState.isInitialized && p2pState.error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color="#FF5252" />
        <Text style={styles.errorTitle}>WiFi Direct Failed to Initialize</Text>
        <Text style={styles.errorMessage}>{p2pState.error}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity
            style={[styles.errorButton, styles.retryButton]}
            onPress={initializeP2PService}
          >
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.errorButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.errorButton, styles.settingsButton]}
            onPress={() => p2pService.openSettings()}
          >
            <MaterialIcons name="settings" size={20} color="#FFFFFF" />
            <Text style={styles.errorButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.backButtonError} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={20} color="#8B8B8B" />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons name="arrow-back" size={24} color="#F45303" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {selectedVideo ? 'Send Video' : 'WiFi Direct'}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="close" size={24} color="#8B8B8B" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionsButton}
            onPress={async () => {
            try {
              if (!p2pState?.isInitialized) {
                Alert.alert(
                  'Error',
                  'WiFi Direct is still initializing. Please wait a moment and try again.',
                );
                return;
              }
              // Refresh devices list
              await p2pService.refreshDeviceList();

              // If no devices found, start discovery
              if (
                p2pState?.discoveredDevices.length === 0 &&
                !p2pState?.isDiscovering
              ) {
                await handleStartDiscovery();
              }
            } catch (error) {
              console.error('Quick action error:', error);
            }
          }}
          disabled={!p2pState?.isInitialized || p2pState?.isDiscovering}
          activeOpacity={0.8}
        >
          <MaterialIcons name="refresh" size={24} color="#F45303" />
        </TouchableOpacity>
        </View>
      </View>

      {renderAutoConnectStatus()}

      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: p2pState.isInitialized ? '#4CAF50' : '#FF5252',
                },
              ]}
            />
            <Text style={styles.statusText}>WiFi Direct</Text>
          </View>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: p2pState.isWifiEnabled ? '#4CAF50' : '#FF5252',
                },
              ]}
            />
            <Text style={styles.statusText}>WiFi</Text>
          </View>
          <View style={styles.statusItem}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: p2pState.isLocationEnabled
                    ? '#4CAF50'
                    : '#FF5252',
                },
              ]}
            />
            <Text style={styles.statusText}>Location</Text>
          </View>
          {p2pState.isConnected && (
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          )}
          {p2pState.isRetrying && (
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.statusText}>
                Retrying ({p2pState.retryAttempts}/{p2pState.maxRetryAttempts})
              </Text>
            </View>
          )}
          {p2pState.transferProgress && (
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.statusText}>
                {p2pState.transferRate > 0 ? `${p2pState.transferRate.toFixed(1)} MB/s` : 'Transferring...'}
              </Text>
            </View>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controlSection}>
          {/* Status Summary */}
          <View style={styles.statusSummary}>
            <View style={styles.statusSummaryItem}>
              <View
                style={[
                  styles.statusSummaryDot,
                  {
                    backgroundColor: p2pState?.isDiscovering
                      ? '#F45303'
                      : '#4CAF50',
                  },
                ]}
              />
              <Text style={styles.statusSummaryText}>
                {p2pState?.isDiscovering ? 'Discovering' : 'Ready'}
              </Text>
            </View>
            {p2pState?.discoveredDevices.length > 0 && (
              <Text style={styles.deviceCountText}>
                {p2pState.discoveredDevices.length} device
                {p2pState.discoveredDevices.length > 1 ? 's' : ''} found
              </Text>
            )}
          </View>

          {/* Warning */}
          {!p2pState?.hasPermissions && (
            <TouchableOpacity
              style={styles.permissionWarning}
              onPress={() => setShowPermissionsModal(true)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="warning" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                Tap to enable permissions for WiFi Direct
              </Text>
              <MaterialIcons name="chevron-right" size={16} color="#FF9800" />
            </TouchableOpacity>
          )}

          {/* Main Action Button - Full Width */}
          <View style={styles.mainActionContainer}>
            {p2pState?.isConnected ? (
              <Android12Button
                title="Disconnect"
                onPress={handleDisconnect}
                iconName="link-off"
                style={styles.mainActionButton}
                textStyle={styles.mainActionButtonText}
                buttonColor="#FF5252"
                pressedColor="#D32F2F"
                releasedColor="#4CAF50"
              />
            ) : !p2pState?.isDiscovering ? (
              <Android12Button
                title={p2pState?.discoveredDevices.length > 0
                  ? 'Refresh Search'
                  : 'Start Discovery'}
                onPress={handleStartDiscovery}
                iconName="search"
                style={styles.mainActionButton}
                textStyle={styles.mainActionButtonText}
                buttonColor="#F45303"
                pressedColor="#D43D00"
                releasedColor="#4CAF50"
                disabled={!p2pState?.isInitialized}
              />
            ) : (
              <Android12Button
                title="Stop Discovery"
                onPress={handleStopDiscovery}
                iconName="stop"
                style={styles.mainActionButton}
                textStyle={styles.mainActionButtonText}
                buttonColor="#FF5252"
                pressedColor="#D32F2F"
                releasedColor="#4CAF50"
              />
            )}
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.quickActionsContainer}>
            <Android12Button
              title="Refresh"
              onPress={async () => {
                try {
                  if (!p2pState?.isInitialized) {
                    Alert.alert(
                      'Error',
                      'WiFi Direct is still initializing. Please wait a moment and try again.',
                    );
                    return;
                  }
                  await p2pService.refreshDeviceList();
                } catch (error) {
                  console.error('Refresh device list error:', error);
                }
              }}
              iconName="refresh"
              style={styles.quickActionButton}
              textStyle={styles.quickActionText}
              buttonColor="#F45303"
              pressedColor="#D43D00"
              releasedColor="#4CAF50"
              disabled={!p2pState?.isInitialized || p2pState?.isDiscovering}
              size="small"
            />
            
            <Android12Button
              title="Validate"
              onPress={async () => {
                try {
                  console.log('🔍 Manual connection validation...');
                  const isValid = await p2pService.validateConnection();
                  Alert.alert(
                    'Connection Validation',
                    `Connection is ${isValid ? 'VALID' : 'INVALID'}\n\nCheck console logs for details.`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  console.error('Connection validation error:', error);
                  Alert.alert('Error', `Validation failed: ${error.message}`);
                }
              }}
              iconName="link"
              style={styles.quickActionButton}
              textStyle={styles.quickActionText}
              buttonColor="#4CAF50"
              pressedColor="#388E3C"
              releasedColor="#4CAF50"
              disabled={!p2pState?.isInitialized}
              size="small"
            />
            
            <Android12Button
              title="Start Server"
              onPress={async () => {
                try {
                  console.log('📥 Starting receive server manually...');
                  const success = await p2pService.startReceiveServer();
                  Alert.alert(
                    'Receive Server',
                    `Server ${success ? 'STARTED' : 'FAILED TO START'}\n\nThis is needed for file transfers to work.`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  console.error('Start server error:', error);
                  Alert.alert('Error', `Failed to start server: ${error.message}`);
                }
              }}
              iconName="cloud-download"
              style={styles.quickActionButton}
              textStyle={styles.quickActionText}
              buttonColor="#2196F3"
              pressedColor="#1976D2"
              releasedColor="#4CAF50"
              disabled={!p2pState?.isInitialized}
              size="small"
            />
            
            <Android12Button
              title="Set Spred Name"
              onPress={async () => {
                try {
                  console.log('📱 Setting Spred device name...');
                  const success = await p2pService.setSpredDeviceName();
                  Alert.alert(
                    'Spred Device Name',
                    `Device name ${success ? 'SET' : 'FAILED TO SET'}\n\nThis helps other Spred users identify your device.`,
                    [{ text: 'OK' }]
                  );
                } catch (error) {
                  console.error('Set device name error:', error);
                  Alert.alert('Error', `Failed to set device name: ${error.message}`);
                }
              }}
              iconName="person"
              style={styles.quickActionButton}
              textStyle={styles.quickActionText}
              buttonColor="#9C27B0"
              pressedColor="#7B1FA2"
              releasedColor="#4CAF50"
              disabled={!p2pState?.isInitialized}
              size="small"
            />

            {/* Disconnect Button - Only show when connected */}
            {p2pState?.isConnected && (
              <Android12Button
                title="Disconnect"
                onPress={handleDisconnect}
                iconName="link-off"
                style={styles.quickActionButton}
                textStyle={styles.quickActionText}
                buttonColor="#FF5252"
                pressedColor="#D32F2F"
                releasedColor="#4CAF50"
                disabled={!p2pState?.isInitialized}
                size="small"
              />
            )}
            
            <Android12Button
              title="Force UI"
              onPress={() => {
                console.log('🔄 Force refreshing UI state...');
                const currentState = p2pService.getState();
                console.log('🔄 Current state from service:', currentState);
                setP2PState(currentState);
                Alert.alert('UI Refresh', 'UI state has been refreshed. Check debug panel for current state.');
              }}
              iconName="refresh"
              style={styles.quickActionButton}
              textStyle={styles.quickActionText}
              buttonColor="#FF9800"
              pressedColor="#F57C00"
              releasedColor="#4CAF50"
              disabled={!p2pState?.isInitialized}
              size="small"
            />
          </View>

          {/* Debug Section */}
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug Info:</Text>
            <Text style={styles.debugText}>
              Initialized: {p2pState?.isInitialized ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Permissions: {p2pState?.hasPermissions ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              WiFi: {p2pState?.isWifiEnabled ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Location: {p2pState?.isLocationEnabled ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Discovering: {p2pState?.isDiscovering ? '✅' : '❌'}
            </Text>
            <Text style={styles.debugText}>
              Devices: {p2pState?.discoveredDevices?.length || 0}
            </Text>
            {p2pState?.error && (
              <Text style={[styles.debugText, { color: '#FF5252' }]}>
                Error: {p2pState.error}
              </Text>
            )}
          </View>
        </View>

        {/* Device List */}
        <View style={styles.deviceListContainer}>
          {p2pState.discoveredDevices.length > 0 ? (
            <FlatList
              data={[...p2pState.discoveredDevices].sort((a, b) => {
                // Sort by status priority: available first, then others
                if (a.status === 0 && b.status !== 0) {
                  return -1;
                } // Available devices first
                if (a.status !== 0 && b.status === 0) {
                  return 1;
                } // Available devices first
                // Then sort by name
                return a.deviceName.localeCompare(b.deviceName);
              })}
              renderItem={renderDeviceItem}
              keyExtractor={item => item.deviceAddress}
              contentContainerStyle={styles.deviceList}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false} // Disable FlatList scrolling since parent is scrollable
            />
          ) : (
            renderEmptyState()
          )}
        </View>
      </ScrollView>

      {/* Connection Progress Modal */}
      <Modal
        visible={showConnectionModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.connectionModal}>
            <View style={styles.connectionIcon}>
              <MaterialIcons name="smartphone" size={48} color="#F45303" />
            </View>
            <Text style={styles.connectionTitle}>
              Connecting to {selectedDevice?.deviceName}
            </Text>
            <Text style={styles.connectionSubtitle}>
              {selectedDevice?.deviceAddress}
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${connectionProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{connectionProgress}%</Text>
            </View>

            {connectionProgress === 100 && (
              <View style={styles.successContainer}>
                <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
                <Text style={styles.successText}>Connected Successfully!</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.permissionsModal}>
            <MaterialIcons name="security" size={48} color="#F45303" />
            <Text style={styles.modalTitle}>Permissions Required</Text>
            <Text style={styles.modalMessage}>
              WiFi Direct requires several permissions to work properly:
            </Text>
            <View style={styles.permissionsList}>
              <Text style={styles.permissionItem}>• Location access</Text>
              <Text style={styles.permissionItem}>• WiFi state access</Text>
              <Text style={styles.permissionItem}>• Network access</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPermissionsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.grantButton]}
                onPress={handleRequestPermissions}
              >
                <Text style={styles.grantButtonText}>Grant Permissions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.safeModeButton]}
                onPress={handleSafeModePermissions}
              >
                <Text style={styles.safeModeButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#CCCCCC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#F45303',
  },
  settingsButton: {
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backButtonError: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#8B8B8B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#2A2A2A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 4,
  },
  quickActionsButton: {
    padding: 8,
  },
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  controlSection: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  statusSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusSummaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusSummaryText: {
    fontSize: 13,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  deviceCountText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  permissionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF9800',
    flex: 1,
  },
  mainActionContainer: {
    marginBottom: 12,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    minHeight: 48,
    shadowColor: '#F45303',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  discoveryButton: {
    backgroundColor: '#F45303',
  },
  stopButton: {
    backgroundColor: '#FF5252',
  },
  mainActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F45303',
    gap: 3,
    minHeight: 32,
    maxHeight: 36,
  },
  quickActionText: {
    fontSize: 12,
    color: '#F45303',
    fontWeight: '600',
  },
  deviceListContainer: {
    backgroundColor: '#1A1A1A',
    minHeight: 150,
  },
  deviceList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  deviceItem: {
    marginBottom: 8,
    borderRadius: 10,
    overflow: 'hidden',
  },
  deviceItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333333',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(139, 139, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupOwnerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F45303',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  groupOwnerBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceAddress: {
    fontSize: 12,
    color: '#8B8B8B',
    marginBottom: 4,
  },
  deviceStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  deviceStatus: {
    fontSize: 12,
    color: '#CCCCCC',
    marginRight: 12,
  },
  signalStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 8,
  },
  signalBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 0.5,
  },
  signalStrengthText: {
    fontSize: 10,
    color: '#8B8B8B',
    fontWeight: '500',
  },
  deviceType: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  connectHint: {
    fontSize: 11,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  deviceAction: {
    padding: 8,
  },
  deviceItemContentConnectable: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  deviceItemContentDisabled: {
    opacity: 0.6,
  },
  deviceItemContentGroupOwner: {
    borderColor: '#F45303',
    borderWidth: 2,
  },
  deviceIconGroupOwner: {
    backgroundColor: 'rgba(244, 83, 3, 0.2)',
  },
  deviceIconBusy: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
  },
  busyIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF9800',
    borderRadius: 10,
    padding: 2,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F45303',
    gap: 4,
  },
  connectButtonText: {
    fontSize: 12,
    color: '#F45303',
    fontWeight: '600',
  },
  deviceNameBusy: {
    color: '#8B8B8B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateMessage: {
    fontSize: 13,
    color: '#8B8B8B',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyStateIcon: {
    position: 'relative',
    marginBottom: 16,
  },
  searchingRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: 'rgba(244, 83, 3, 0.3)',
    borderStyle: 'dashed',
  },
  discoveryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discoveryStatsText: {
    fontSize: 14,
    color: '#F45303',
  },
  startDiscoveryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#F45303',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startDiscoveryButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionModal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  connectionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  connectionSubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F45303',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  successText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  permissionsModal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 16,
  },
  permissionsList: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  permissionItem: {
    fontSize: 14,
    color: '#8B8B8B',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#CCCCCC',
    fontWeight: '600',
  },
  grantButton: {
    backgroundColor: '#F45303',
  },
  grantButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  safeModeButton: {
    backgroundColor: '#4CAF50',
    marginTop: 8,
  },
  safeModeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  autoConnectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  autoConnectText: {
    flex: 1,
    marginLeft: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  debugSection: {
    backgroundColor: '#1A1A1A',
    padding: 8,
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333333',
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F45303',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 10,
    color: '#CCCCCC',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});

export default WiFiDirectDiscovery;
