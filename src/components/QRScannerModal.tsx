import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRShareService, { QRShareData } from '../services/QRShareService';
import SimpleHTTPServer from '../services/SimpleHTTPServer';
import SpredFileService from '../services/SpredFileService';
import logger from '../utils/logger';

const { width, height } = Dimensions.get('window');

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onVideoReceived: (filePath: string, videoData: any) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onVideoReceived,
}) => {
  const [isScanning, setIsScanning] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string>('');
  const cameraRef = useRef<RNCamera>(null);

  const qrShareService = QRShareService.getInstance();
  const spredFileService = SpredFileService.getInstance();
  const httpServer = SimpleHTTPServer.getInstance();

  useEffect(() => {
    if (visible) {
      setIsScanning(true);
      setError('');
      setDownloadProgress(0);
    }
  }, [visible]);

  const onBarCodeRead = async (event: any) => {
    if (!isScanning) return;

    try {
      setIsScanning(false);
      logger.info('📱 QR code scanned:', event.data);

      // Parse QR data
      const qrData = JSON.parse(event.data);

      // Validate QR data
      if (!qrShareService.validateShareData(qrData)) {
        throw new Error('Invalid QR code. This is not a SPRED video share code.');
      }

      const shareData: QRShareData = qrData;
      logger.info('✅ Valid SPRED QR code detected:', shareData.video.title);

      // Confirm download
      Alert.alert(
        'Download Video',
        `Download "${shareData.video.title}" from ${shareData.senderDevice.name}?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsScanning(true) },
          {
            text: 'Download',
            onPress: () => startDownload(shareData),
          },
        ]
      );

    } catch (error: any) {
      logger.error('❌ QR scan error:', error);
      setError(error.message || 'Invalid QR code');
      setTimeout(() => setIsScanning(true), 2000);
    }
  };

  const startDownload = async (shareData: QRShareData) => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setError('');

      logger.info('📥 Starting download:', shareData.video.title);

      // Parse the share URL to get share ID
      const shareUrl = shareData.video.serverUrl;
      const parseResult = qrShareService.parseShareUrl(shareUrl);
      
      if (!parseResult.isValid || !parseResult.shareId) {
        throw new Error('Invalid share URL format');
      }

      const shareId = parseResult.shareId;
      logger.info('📋 Parsed share ID:', shareId);

      // Get the shared file data
      setDownloadProgress(25);
      const fileDataResult = qrShareService.getSharedFileData(shareId);

      if (!fileDataResult.success || !fileDataResult.data) {
        throw new Error(fileDataResult.error || 'Failed to get file data from sender');
      }

      const fileData = fileDataResult.data;
      logger.info('📁 Retrieved file data:', {
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        serverUrl: fileData.serverUrl
      });

      // Download file from HTTP server
      setDownloadProgress(50);
      const fileName = `${shareData.video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      const RNFS = require('react-native-fs');
      const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Download from the server URL
      setDownloadProgress(75);
      const downloadResult = await RNFS.downloadFile({
        fromUrl: fileData.serverUrl,
        toFile: downloadDest,
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(75 + (progress * 0.25)); // 75-100%
        }
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.statusCode}`);
      }
      
      // Verify file was created
      const fileExists = await RNFS.exists(downloadDest);
      if (!fileExists) {
        throw new Error('Failed to create downloaded file');
      }

      setDownloadProgress(100);
      logger.info('✅ Download completed:', downloadDest);

      // Verify file integrity if checksum is available
      if (shareData.video.checksum) {
        const isValid = await verifyFileIntegrity(downloadDest, shareData.video.checksum);
        if (!isValid) {
          // Delete corrupted file
          await RNFS.unlink(downloadDest);
          throw new Error('File integrity check failed. The downloaded file may be corrupted.');
        }
      }

      // Move file to SPRED downloads directory
      const result = await spredFileService.handleReceivedFile(
        downloadDest,
        fileName
      );

      if (!result.success || !result.filePath) {
        throw new Error(result.error || 'Failed to process downloaded file');
      }

      const finalPath = result.filePath;
      logger.info('✅ File processed and moved to:', finalPath);

      // Create video data object
      const videoData = {
        title: shareData.video.title,
        filePath: finalPath,
        fileSize: shareData.video.fileSize,
        thumbnailUrl: shareData.video.thumbnailUrl,
        senderDevice: shareData.senderDevice,
        timestamp: shareData.video.timestamp,
      };

      // Notify parent component
      onVideoReceived(finalPath, videoData);

      // Show success message
      Alert.alert(
        'Download Complete',
        `"${shareData.video.title}" has been downloaded successfully!`,
        [{ text: 'OK', onPress: onClose }]
      );

    } catch (error: any) {
      logger.error('❌ Download error:', error);
      setError(error.message || 'Download failed');
      setIsDownloading(false);
    }
  };

  const verifyFileIntegrity = async (filePath: string, expectedChecksum: string): Promise<boolean> => {
    try {
      // Simple checksum verification for React Native
      const RNFS = require('react-native-fs');
      const fileContent = await RNFS.readFile(filePath, 'base64');

      // Calculate simple hash
      let hash = 0;
      for (let i = 0; i < fileContent.length; i++) {
        const char = fileContent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      const actualChecksum = Math.abs(hash).toString(16);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      logger.warn('⚠️ Could not verify file integrity:', error);
      return true; // Don't fail if verification fails
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      <RNCamera
        ref={cameraRef}
        style={styles.camera}
        type={RNCamera.Constants.Type.back}
        flashMode={RNCamera.Constants.FlashMode.off}
        captureAudio={false}
        onBarCodeRead={onBarCodeRead}
        barCodeTypes={[RNCamera.Constants.BarCodeType.qr]}
        androidCameraPermissionOptions={{
          title: 'Camera Permission',
          message: 'SPRED needs camera access to scan QR codes',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }}
      >
        {/* Scanning overlay */}
        <View style={styles.cameraOverlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={styles.scanCorner} />
              <View style={[styles.scanCorner, styles.topRight]} />
              <View style={[styles.scanCorner, styles.bottomLeft]} />
              <View style={[styles.scanCorner, styles.bottomRight]} />
            </View>
            <Text style={styles.scanText}>
              Position QR code within the frame
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Scan a QR code from another SPRED device to download videos
            </Text>
          </View>
        </View>
      </RNCamera>
    </View>
  );

  const renderDownloadingView = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#F45303" />
      <Text style={styles.downloadingText}>Downloading Video...</Text>
      <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${downloadProgress}%` }]}
        />
      </View>
    </View>
  );

  const renderErrorView = () => (
    <View style={styles.centerContent}>
      <MaterialIcons name="error" size={64} color="#FF5252" />
      <Text style={styles.errorTitle}>Scan Failed</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => {
        setError('');
        setIsScanning(true);
      }}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.settingsButton} onPress={openAppSettings}>
        <Text style={styles.settingsButtonText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {error ? renderErrorView() :
           isDownloading ? renderDownloadingView() :
           renderCameraView()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    borderWidth: 0,
  },
  scanCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#F45303',
    borderWidth: 3,
    top: 0,
    left: 0,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingBottom: 50,
  },
  footerText: {
    color: '#8B8B8B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  downloadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  progressText: {
    color: '#F45303',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  progressBar: {
    width: '80%',
    height: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F45303',
    borderRadius: 4,
  },
  errorTitle: {
    color: '#FF5252',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#CCCCCC',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  settingsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRScannerModal;