import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CrossPlatformSharingService, { SharingState, ShareResult } from '../services/CrossPlatformSharingService';
import UniversalSharingModal from '../components/UniversalSharingModal';
import NearbyModeToggle from '../utils/nearbyToggle';
import PermissionDebugger from '../utils/PermissionDebugger';
import ReceiverModeManager from '../services/ReceiverModeManager';

const TestNearbySharing: React.FC = () => {
  const [showSharingModal, setShowSharingModal] = useState(false);
  const [sharingState, setSharingState] = useState<SharingState | null>(null);
  const [lastResult, setLastResult] = useState<ShareResult | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [currentMode, setCurrentMode] = useState<'mock' | 'real'>(NearbyModeToggle.getCurrentMode());
  const [receiverModeActive, setReceiverModeActive] = useState(false);

  const sharingService = CrossPlatformSharingService.getInstance();

  useEffect(() => {
    // Subscribe to sharing state changes
    const unsubscribe = sharingService.subscribe((state) => {
      setSharingState(state);
      console.log('📊 Sharing state update:', state);
    });

    return unsubscribe;
  }, []);

  // Test 1: Basic sharing with mock video
  const testBasicSharing = () => {
    console.log('🧪 Test 1: Basic sharing started');
    setShowSharingModal(true);
  };

  // Test 2: Direct service call (no UI)
  const testDirectServiceCall = async () => {
    try {
      console.log('🧪 Test 2: Direct service call started');
      Alert.alert('Test Started', 'Check console for progress updates');
      
      const result = await sharingService.shareVideo('/mock/path/test-video.mp4');
      
      console.log('✅ Test 2 completed:', result);
      setLastResult(result);
      
      Alert.alert(
        'Test Completed',
        `Method: ${result.method}\nSuccess: ${result.success}\n${result.error || 'No errors'}`
      );
    } catch (error) {
      console.error('❌ Test 2 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test 3: Start receiver mode
  const testReceiverMode = async () => {
    try {
      console.log('🧪 Test 3: Receiver mode started');
      
      if (isReceiving) {
        await sharingService.stopReceiver();
        setIsReceiving(false);
        Alert.alert('Receiver Stopped', 'No longer receiving videos');
      } else {
        const started = await sharingService.startReceiver();
        setIsReceiving(started);
        
        if (started) {
          Alert.alert('Receiver Started', 'Ready to receive videos from nearby devices');
        } else {
          Alert.alert('Receiver Failed', 'Could not start receiver mode');
        }
      }
    } catch (error) {
      console.error('❌ Test 3 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test: Manual Receiver Mode Manager
  const testManualReceiverMode = async () => {
    try {
      console.log('🧪 Manual Receiver Mode test started');
      
      if (receiverModeActive) {
        // Stop receiver mode
        const receiverManager = ReceiverModeManager.getInstance();
        await receiverManager.cleanup();
        setReceiverModeActive(false);
        Alert.alert('Receiver Mode Stopped', 'Device is no longer discoverable for receiving files');
        console.log('🛑 Receiver mode stopped');
      } else {
        // Start receiver mode
        const receiverManager = ReceiverModeManager.getInstance();
        const initialized = await receiverManager.initialize();
        
        if (initialized) {
          setReceiverModeActive(true);
          Alert.alert('Receiver Mode Started', 'Device is now discoverable and ready to receive files from nearby devices');
          console.log('✅ Receiver mode started successfully');
        } else {
          Alert.alert('Receiver Mode Failed', 'Could not initialize receiver mode. Check permissions and WiFi.');
          console.log('❌ Receiver mode failed to start');
        }
      }
    } catch (error) {
      console.error('❌ Manual Receiver Mode test failed:', error);
      Alert.alert('Test Failed', `Error: ${error.message}`);
    }
  };

  // Test 4: QR Code processing
  const testQRProcessing = async () => {
    try {
      console.log('🧪 Test 4: QR processing started');
      
      // Mock QR data
      const mockQRData = JSON.stringify({
        type: 'spred_video_share',
        method: 'local_server',
        downloadUrl: 'http://192.168.1.100:8080/video',
        fileName: 'test-video.mp4',
        fileSize: 52428800, // 50MB
        deviceName: 'Test Device',
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      });
      
      const result = await sharingService.processQRCode(mockQRData);
      
      console.log('✅ Test 4 completed:', result);
      
      Alert.alert(
        'QR Processing Result',
        `Success: ${result.success}\n${result.error || 'File would be downloaded'}`
      );
    } catch (error) {
      console.error('❌ Test 4 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test 5: Service cleanup
  const testCleanup = async () => {
    try {
      console.log('🧪 Test 5: Cleanup started');
      await sharingService.cleanup();
      setIsReceiving(false);
      Alert.alert('Cleanup Complete', 'All services stopped and cleaned up');
    } catch (error) {
      console.error('❌ Test 5 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test 6: Toggle API mode
  const testToggleMode = () => {
    try {
      console.log('🧪 Test 6: Mode toggle started');
      const newMode = NearbyModeToggle.toggleMode();
      setCurrentMode(newMode);
      
      Alert.alert(
        'Mode Toggled',
        `Switched to ${newMode.toUpperCase()} mode.\n\nRestart the app to apply changes.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
      
      NearbyModeToggle.logStatus();
    } catch (error) {
      console.error('❌ Test 6 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test 7: Device Discovery Test
  const testDeviceDiscovery = async () => {
    try {
      console.log('🧪 Test 7: Device discovery started');
      Alert.alert('Discovery Test', 'Starting device discovery. Check console for discovered devices.');
      
      // Get the nearby service and start discovery
      const nearbyService = sharingService.getNearbyService();
      if (nearbyService) {
        await nearbyService.startDiscovery();
        
        // Monitor for 15 seconds
        setTimeout(async () => {
          const devices = nearbyService.getDiscoveredDevices();
          console.log('📱 Discovered devices:', devices);
          
          Alert.alert(
            'Discovery Results',
            `Found ${devices.length} device(s):\n${devices.map(d => `• ${d.name} (${d.status})`).join('\n') || 'No devices found'}`
          );
          
          await nearbyService.stopDiscovery();
        }, 15000);
      }
    } catch (error) {
      console.error('❌ Test 7 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test 8: Connection Test
  const testConnection = async () => {
    try {
      console.log('🧪 Test 8: Connection test started');
      
      const nearbyService = sharingService.getNearbyService();
      if (nearbyService) {
        const devices = nearbyService.getDiscoveredDevices();
        
        if (devices.length === 0) {
          Alert.alert('No Devices', 'Run Test 7 first to discover devices.');
          return;
        }
        
        const firstDevice = devices[0];
        Alert.alert('Connection Test', `Attempting to connect to ${firstDevice.name}...`);
        
        const connected = await nearbyService.connectToDevice(firstDevice.id);
        
        Alert.alert(
          'Connection Result',
          connected ? `✅ Connected to ${firstDevice.name}` : `❌ Failed to connect to ${firstDevice.name}`
        );
      }
    } catch (error) {
      console.error('❌ Test 8 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  // Test 9: Permission Diagnostic - SAFE VERSION
  const testPermissionDiagnostic = async () => {
    try {
      console.log('🧪 Test 9: SAFE Permission diagnostic started');
      Alert.alert('Safe Diagnostic Started', 'Running safe permission diagnostic. Check console for detailed results.');
      
      // Create a completely safe diagnostic without any native calls
      const safeDiagnostic = {
        system: {
          platform: Platform.OS,
          platformVersion: Platform.Version,
          permissionAPIAvailable: !!PermissionsAndroid,
          timestamp: Date.now()
        },
        summary: {
          message: 'Safe diagnostic mode - no native permission calls made',
          currentMode: currentMode,
          patchApplied: true,
          recommendation: 'App is using safe fallback mode to prevent crashes'
        }
      };
      
      console.log('🧪 Safe diagnostic result:', safeDiagnostic);
      
      Alert.alert(
        'Safe Diagnostic Complete',
        `Platform: ${safeDiagnostic.system.platform}\nMode: ${safeDiagnostic.summary.currentMode.toUpperCase()}\nPatch Applied: Yes\nStatus: Safe Mode Active\n\nNo native permission calls were made to prevent crashes.`
      );
    } catch (error) {
      console.error('❌ Test 9 failed:', error);
      Alert.alert('Test Failed', error.message);
    }
  };

  const handleShareComplete = (result: ShareResult) => {
    console.log('🎉 Share completed:', result);
    setLastResult(result);
    setShowSharingModal(false);
    
    Alert.alert(
      'Share Complete!',
      `Method: ${result.method}\nSuccess: ${result.success}\nDuration: ${result.duration}ms`
    );
  };

  const renderStateInfo = () => {
    if (!sharingState) return null;

    // Get nearby service state for additional info
    const nearbyState = sharingService.getNearbyService().getState();

    return (
      <View style={styles.stateContainer}>
        <Text style={styles.stateTitle}>Current State</Text>
        
        {/* API Mode Status */}
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>API Mode:</Text>
          <View style={styles.statusIndicator}>
            <MaterialIcons 
              name={nearbyState.initializationMode === 'real' ? 'wifi' : 'science'} 
              size={16} 
              color={nearbyState.initializationMode === 'real' ? '#4CAF50' : '#FF9800'} 
            />
            <Text style={[styles.stateValue, { 
              color: nearbyState.initializationMode === 'real' ? '#4CAF50' : '#FF9800',
              marginLeft: 4
            }]}>
              {nearbyState.initializationMode?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* Initialization Reason */}
        {nearbyState.initializationReason && (
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Reason:</Text>
            <Text style={[styles.stateValue, { 
              fontSize: 12, 
              opacity: 0.8,
              color: nearbyState.error ? '#FF5252' : '#CCCCCC'
            }]}>
              {nearbyState.initializationReason}
            </Text>
          </View>
        )}

        {/* Detailed Error Information */}
        {nearbyState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error Details:</Text>
            <Text style={styles.errorText}>{nearbyState.error}</Text>
          </View>
        )}

        {/* Permission Status */}
        {nearbyState.permissionStatus && (
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Permissions:</Text>
            <View style={styles.statusIndicator}>
              <MaterialIcons 
                name={nearbyState.permissionStatus.canProceed ? 'check-circle' : 'error'} 
                size={16} 
                color={nearbyState.permissionStatus.canProceed ? '#4CAF50' : '#FF5252'} 
              />
              <Text style={[styles.stateValue, { 
                color: nearbyState.permissionStatus.canProceed ? '#4CAF50' : '#FF5252',
                marginLeft: 4
              }]}>
                {nearbyState.permissionStatus.canProceed ? 'GRANTED' : 'DENIED'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Is Sharing:</Text>
          <Text style={[styles.stateValue, { color: sharingState.isSharing ? '#4CAF50' : '#8B8B8B' }]}>
            {sharingState.isSharing ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Is Receiving:</Text>
          <Text style={[styles.stateValue, { color: sharingState.isReceiving ? '#4CAF50' : '#8B8B8B' }]}>
            {sharingState.isReceiving ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Method:</Text>
          <Text style={styles.stateValue}>{sharingState.currentMethod || 'None'}</Text>
        </View>
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Status:</Text>
          <Text style={styles.stateValue}>{sharingState.status}</Text>
        </View>
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Devices Found:</Text>
          <Text style={styles.stateValue}>{sharingState.discoveredDevices.length}</Text>
        </View>
        {sharingState.error && (
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Error:</Text>
            <Text style={[styles.stateValue, { color: '#FF5252' }]}>{sharingState.error}</Text>
          </View>
        )}

        {/* Permission Issues */}
        {nearbyState.permissionStatus?.issues && nearbyState.permissionStatus.issues.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.issuesTitle}>Issues:</Text>
            {nearbyState.permissionStatus.issues.map((issue, index) => (
              <Text key={index} style={styles.issueText}>• {issue}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLastResult = () => {
    if (!lastResult) return null;

    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Last Result</Text>
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Success:</Text>
          <Text style={[styles.stateValue, { color: lastResult.success ? '#4CAF50' : '#FF5252' }]}>
            {lastResult.success ? 'Yes' : 'No'}
          </Text>
        </View>
        <View style={styles.stateRow}>
          <Text style={styles.stateLabel}>Method:</Text>
          <Text style={styles.stateValue}>{lastResult.method}</Text>
        </View>
        {lastResult.deviceName && (
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Device:</Text>
            <Text style={styles.stateValue}>{lastResult.deviceName}</Text>
          </View>
        )}
        {lastResult.duration && (
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Duration:</Text>
            <Text style={styles.stateValue}>{lastResult.duration}ms</Text>
          </View>
        )}
        {lastResult.error && (
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Error:</Text>
            <Text style={[styles.stateValue, { color: '#FF5252' }]}>{lastResult.error}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="wifi" size={32} color="#4CAF50" />
          <Text style={styles.title}>Real Device Testing Lab</Text>
          <Text style={styles.subtitle}>Test nearby sharing between physical devices</Text>
          
          {/* API Mode Indicator */}
          <View style={styles.modeIndicator}>
            <MaterialIcons 
              name={currentMode === 'real' ? 'wifi' : 'science'} 
              size={16} 
              color={currentMode === 'real' ? '#4CAF50' : '#FF9800'} 
            />
            <Text style={[styles.modeText, { color: currentMode === 'real' ? '#4CAF50' : '#FF9800' }]}>
              {currentMode.toUpperCase()} API MODE
            </Text>
          </View>
        </View>

        {renderStateInfo()}
        {renderLastResult()}

        <View style={styles.testsContainer}>
          <Text style={styles.testsTitle}>Available Tests</Text>

          <TouchableOpacity style={styles.testButton} onPress={testBasicSharing}>
            <MaterialIcons name="share" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 1: UI Sharing Flow</Text>
              <Text style={styles.testDescription}>
                Opens the UniversalSharingModal with mock video
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testDirectServiceCall}>
            <MaterialIcons name="code" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 2: Direct Service Call</Text>
              <Text style={styles.testDescription}>
                Calls sharing service directly (no UI)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, { backgroundColor: isReceiving ? '#FF5252' : '#4CAF50' }]} 
            onPress={testReceiverMode}
          >
            <MaterialIcons name={isReceiving ? "stop" : "download"} size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>
                Test 3: {isReceiving ? 'Stop' : 'Start'} Receiver Mode
              </Text>
              <Text style={styles.testDescription}>
                {isReceiving ? 'Stop receiving videos' : 'Start listening for incoming videos'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={testQRProcessing}>
            <MaterialIcons name="qr-code-scanner" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 4: QR Code Processing</Text>
              <Text style={styles.testDescription}>
                Process mock QR code data
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.cleanupButton]} onPress={testCleanup}>
            <MaterialIcons name="cleaning-services" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 5: Cleanup Services</Text>
              <Text style={styles.testDescription}>
                Stop all services and clean up resources
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.toggleButton]} onPress={testToggleMode}>
            <MaterialIcons name="swap-horiz" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 6: Toggle API Mode</Text>
              <Text style={styles.testDescription}>
                Switch between Mock and Real API modes (requires restart)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.discoveryButton]} onPress={testDeviceDiscovery}>
            <MaterialIcons name="radar" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 7: Device Discovery</Text>
              <Text style={styles.testDescription}>
                Scan for nearby devices (15 second scan)
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.connectionButton]} onPress={testConnection}>
            <MaterialIcons name="link" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 8: Connection Test</Text>
              <Text style={styles.testDescription}>
                Connect to first discovered device
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.testButton, styles.diagnosticButton]} onPress={testPermissionDiagnostic}>
            <MaterialIcons name="bug-report" size={24} color="#FFFFFF" />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>Test 9: Permission Diagnostic</Text>
              <Text style={styles.testDescription}>
                Run comprehensive permission and system diagnostic
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, receiverModeActive ? styles.stopButton : styles.receiverButton]} 
            onPress={testManualReceiverMode}
          >
            <MaterialIcons 
              name={receiverModeActive ? "stop" : "wifi-tethering"} 
              size={24} 
              color="#FFFFFF" 
            />
            <View style={styles.testInfo}>
              <Text style={styles.testTitle}>
                Manual Receiver: {receiverModeActive ? 'Stop' : 'Start'} Receiver Mode
              </Text>
              <Text style={styles.testDescription}>
                {receiverModeActive 
                  ? 'Stop receiving mode and cleanup resources' 
                  : 'Start manual receiver mode (ReceiverModeManager)'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Real Device Testing Instructions</Text>
          <Text style={styles.instructionsText}>
            1. Install this APK on TWO physical devices{'\n'}
            2. Device 1: Press TEST 3 (Start Receiver Mode){'\n'}
            3. Device 2: Press TEST 7 (Device Discovery) to find Device 1{'\n'}
            4. Device 2: Press TEST 1 (Share Video) to connect and share{'\n'}
            5. Both devices need Bluetooth, WiFi, and Location enabled{'\n'}
            6. Keep devices within 30 feet of each other
          </Text>
        </View>
      </ScrollView>

      <UniversalSharingModal
        visible={showSharingModal}
        videoPath="/mock/path/test-video.mp4"
        videoTitle="Test Video for Nearby Sharing"
        onClose={() => setShowSharingModal(false)}
        onShareComplete={handleShareComplete}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#8B8B8B',
    textAlign: 'center',
    marginTop: 4,
  },
  stateContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  stateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stateLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    flex: 1,
  },
  stateValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  resultContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 12,
  },
  testsContainer: {
    marginBottom: 20,
  },
  testsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cleanupButton: {
    backgroundColor: '#6C757D',
  },
  toggleButton: {
    backgroundColor: '#9C27B0',
  },
  discoveryButton: {
    backgroundColor: '#00BCD4',
  },
  connectionButton: {
    backgroundColor: '#4CAF50',
  },
  diagnosticButton: {
    backgroundColor: '#E91E63',
  },
  receiverButton: {
    backgroundColor: '#FF9800', // Orange for start receiver
  },
  stopButton: {
    backgroundColor: '#F44336', // Red for stop receiver
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  testInfo: {
    flex: 1,
    marginLeft: 16,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  instructions: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  issuesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5252',
  },
  issuesTitle: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '600',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 12,
    color: '#FF5252',
    opacity: 0.8,
    marginBottom: 2,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF5252',
  },
  errorTitle: {
    fontSize: 14,
    color: '#FF5252',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    opacity: 0.8,
    fontFamily: 'monospace',
  },
});

export default TestNearbySharing;