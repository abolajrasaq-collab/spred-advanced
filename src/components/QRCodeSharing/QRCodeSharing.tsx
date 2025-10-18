import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
// Using react-native-camera for lighter QR scanning instead of heavy react-native-qrcode-scanner
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

// Mode constants to avoid string literals in JSX
const QR_MODE = {
  GENERATE: 'generate' as const,
  SCAN: 'scan' as const,
} as const;

interface QRCodeSharingProps {
  visible: boolean;
  onClose: () => void;
  mode: 'generate' | 'scan';
  deviceInfo?: {
    id: string;
    name: string;
    ipAddress: string;
    port: number;
  };
  onDeviceScanned?: (deviceData: any) => void;
  videoData?: {
    url: string;
    title: string;
  };
}

const QRCodeSharing: React.FC<QRCodeSharingProps> = ({
  visible,
  onClose,
  mode,
  deviceInfo,
  onDeviceScanned,
  videoData,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    if (visible && mode === 'generate' && deviceInfo) {
      generateQRCode();
    }
    if (visible && mode === 'scan') {
      requestCameraPermission();
    }
  }, [visible, mode, deviceInfo]);

  const generateQRCode = () => {
    try {
      const qrData = {
        type: 'spred_p2p_device',
        version: '1.0',
        device: {
          id: deviceInfo?.id || `spred_${Date.now()}`,
          name: deviceInfo?.name || 'Spred Device',
          ipAddress: deviceInfo?.ipAddress || '192.168.1.100',
          port: deviceInfo?.port || 8080,
          timestamp: Date.now(),
        },
        video: videoData
          ? {
              title: videoData.title,
              url: videoData.url,
              shared_at: Date.now(),
            }
          : null,
      };

      setQrValue(JSON.stringify(qrData));
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error generating QR code:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const requestCameraPermission = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message:
              'Spred needs camera access to scan QR codes for P2P device discovery',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        // iOS permissions are handled automatically by the system
        setHasPermission(true);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error requesting camera permission:', error);
      setHasPermission(false);
    }
    setIsLoading(false);
  };

  const handleQRCodeScanned = (e: any) => {
    try {
      let scannedData;
      try {
        scannedData = JSON.parse(e.data);
      } catch (parseError) {
        // DISABLED FOR PERFORMANCE
        // console.log('Invalid QR code format - not valid JSON:', e.data);
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not a valid Spred P2P device code.',
        );
        return;
      }

      if (scannedData.type === 'spred_p2p_device') {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Valid Spred P2P QR code scanned:', scannedData);

        Alert.alert(
          '🔗 Device Found',
          `Found device: ${scannedData.device.name}\nIP: ${scannedData.device.ipAddress}\n\nConnect to this device?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Connect',
              onPress: () => {
                if (onDeviceScanned) {
                  onDeviceScanned(scannedData.device);
                }
                onClose();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not from a Spred device.',
        );
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error parsing QR code:', error);
      Alert.alert('Invalid QR Code', 'Could not read the QR code data.');
    }
  };

  const renderGenerateMode = () => (
    <View style={styles.generateContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share Device</Text>
        <Text style={styles.headerSubtitle}>
          Show this QR code to nearby devices
        </Text>
      </View>

      <View style={styles.qrContainer}>
        {qrValue ? (
          <QRCode
            value={qrValue}
            size={200}
            backgroundColor="#FFFFFF"
            color="#1A1A1A"
            logoSize={30}
            logoBackgroundColor="transparent"
          />
        ) : (
          <ActivityIndicator size="large" color="#F45303" />
        )}
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>
          {deviceInfo?.name || 'Your Device'}
        </Text>
        <Text style={styles.deviceDetails}>
          IP: {deviceInfo?.ipAddress || 'Auto-detect'}
        </Text>
        {videoData && (
          <View style={styles.videoInfo}>
            <MaterialIcons name="video-library" size={16} color="#F45303" />
            <Text style={styles.videoTitle}>{videoData.title}</Text>
          </View>
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to connect:</Text>
        <Text style={styles.instructionsText}>
          • Open Spred on the other device{'\n'}• Go to Share → Scan QR Code
          {'\n'}• Point camera at this QR code{'\n'}• Start secure P2P transfer
        </Text>
      </View>
    </View>
  );

  const renderScanMode = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F45303" />
          <Text style={styles.loadingText}>
            Requesting camera permission...
          </Text>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="camera-alt" size={64} color="#8B8B8B" />
          <Text style={styles.errorTitle}>Camera Permission Required</Text>
          <Text style={styles.errorText}>
            Please grant camera permission to scan QR codes for device discovery
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestCameraPermission}
          >
            <Text style={styles.retryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.scanContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan Device QR</Text>
          <Text style={styles.headerSubtitle}>
            Point camera at another device's QR code
          </Text>
        </View>

        <View style={styles.cameraContainer}>
          <View style={styles.placeholderCamera}>
            <MaterialIcons name="qr-code-scanner" size={64} color="#F45303" />
            <Text style={styles.placeholderText}>
              QR Scanner temporarily disabled for performance
            </Text>
            <Text style={styles.placeholderSubtext}>
              Please use manual device connection instead
            </Text>
          </View>
        </View>

        <View style={styles.scanInstructions}>
          <MaterialIcons name="qr-code-scanner" size={24} color="#F45303" />
          <Text style={styles.scanInstructionsText}>
            Position the QR code within the frame
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.modalTitleContainer}>
            <MaterialIcons
              name={mode === 'generate' ? 'qr-code' : 'qr-code-scanner'}
              size={24}
              color="#F45303"
            />
            <Text style={styles.modalTitle}>
              {mode === 'generate' ? 'Generate QR Code' : 'Scan QR Code'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {mode === QR_MODE.GENERATE ? renderGenerateMode() : renderScanMode()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -40, // Offset the close button
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Generate Mode Styles
  generateContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  deviceInfo: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 14,
    color: '#8B8B8B',
    marginBottom: 12,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  videoTitle: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 6,
    maxWidth: 200,
  },
  instructions: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 12,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F45303',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },

  // Scan Mode Styles
  scanContainer: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 20,
  },
  camera: {
    height: '100%',
  },
  qrMarker: {
    borderColor: '#F45303',
    borderWidth: 3,
    borderRadius: 12,
  },
  topView: {
    height: 0,
  },
  bottomView: {
    height: 0,
  },
  scanInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  scanInstructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
  },

  // Loading and Error Styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Placeholder camera styles
  placeholderCamera: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    margin: 20,
    borderRadius: 20,
    padding: 40,
  },
  placeholderText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
});

export default QRCodeSharing;
