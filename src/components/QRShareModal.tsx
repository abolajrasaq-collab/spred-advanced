import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import QRShareService, { QRShareData } from '../services/QRShareService';
import HTTPClient from '../utils/HTTPClient';
import logger from '../utils/logger';

const { width, height } = Dimensions.get('window');

// Calculate responsive QR code size
const getQRSize = () => {
  const maxSize = 200;
  const minSize = 150;
  const screenBasedSize = width * 0.45;
  return Math.max(minSize, Math.min(maxSize, screenBasedSize));
};

// Check if screen is small
const isSmallScreen = height < 700;

interface QRShareModalProps {
  visible: boolean;
  onClose: () => void;
  videoPath: string;
  videoTitle: string;
  videoSize: number;
  thumbnailUrl?: string;
}

const QRShareModal: React.FC<QRShareModalProps> = ({
  visible,
  onClose,
  videoPath,
  videoTitle,
  videoSize,
  thumbnailUrl,
}) => {
  const [qrData, setQrData] = useState<QRShareData | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const qrShareService = QRShareService.getInstance();
  const httpClient = HTTPClient.getInstance();

  useEffect(() => {
    if (visible && videoPath) {
      startSharing();
    } else if (!visible) {
      stopSharing();
    }
  }, [visible, videoPath]);

  const startSharing = async () => {
    try {
      setIsLoading(true);
      setError('');

      logger.info('🎯 Starting QR video sharing for:', videoTitle);

      // Generate share data
      const shareData = await qrShareService.generateShareData(
        videoPath,
        videoTitle,
        videoSize,
        thumbnailUrl
      );

      // Start file server
      const serverInfo = await qrShareService.startFileServer(videoPath, shareData.video.id);

      // Update share data with server info
      shareData.video.serverUrl = serverInfo.url;
      shareData.video.serverPort = serverInfo.port;

      setQrData(shareData);
      setServerUrl(serverInfo.url);

      logger.info('✅ QR sharing started successfully', {
        videoId: shareData.video.id,
        serverUrl: serverInfo.url,
        port: serverInfo.port,
      });

    } catch (error: any) {
      logger.error('❌ Failed to start QR sharing:', error);
      setError(error.message || 'Failed to start sharing');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSharing = async () => {
    try {
      if (qrData) {
        await qrShareService.stopFileServer(qrData.video.id);
        logger.info('🛑 QR sharing stopped');
      }
    } catch (error: any) {
      logger.error('❌ Error stopping QR sharing:', error);
    } finally {
      setQrData(null);
      setServerUrl('');
      setError('');
    }
  };

  const shareViaOtherApps = async () => {
    try {
      if (!serverUrl) return;

      const shareMessage = `🎬 Watch "${videoTitle}" on SPRED!\n\n📱 Scan the QR code with SPRED app to download this video\n\nShared via SPRED`;

      await Share.share({
        message: shareMessage,
      });

      logger.info('📤 Shared via other apps');
    } catch (error: any) {
      logger.error('❌ Error sharing via other apps:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderLoadingState = () => (
    <View style={styles.centerContent}>
      <ActivityIndicator size="large" color="#F45303" />
      <Text style={styles.loadingText}>Setting up video sharing...</Text>
      <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centerContent}>
      <MaterialIcons name="error" size={64} color="#FF5252" />
      <Text style={styles.errorTitle}>Sharing Failed</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={startSharing}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderShareContent = () => (
    <SafeAreaView style={styles.shareContainer}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Share Video</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Video Info */}
        <View style={styles.videoInfo}>
          <MaterialIcons name="videocam" size={24} color="#F45303" />
          <View style={styles.videoDetails}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {videoTitle}
            </Text>
            <Text style={styles.videoSize}>
              {formatFileSize(videoSize)}
            </Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>Scan to Download</Text>
          <View style={styles.qrCodeWrapper}>
            {qrData && (
              <QRCode
                value={JSON.stringify(qrData)}
                size={getQRSize()}
                color="#000000"
                backgroundColor="#FFFFFF"
              />
            )}
          </View>
          <Text style={styles.qrSubtitle}>
            Open SPRED on another device and scan this code
          </Text>
        </View>

        {/* Server Info */}
        <View style={styles.serverInfo}>
          <MaterialIcons name="wifi" size={16} color="#4CAF50" />
          <Text style={styles.serverText}>
            Server running on local network
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={shareViaOtherApps}
          >
            <MaterialIcons name="share" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Link</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
          {isLoading && renderLoadingState()}
          {error && renderErrorState()}
          {!isLoading && !error && renderShareContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.95,
    minHeight: Math.min(height * 0.6, 400), // Adaptive minimum height
    width: '100%',
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    color: '#8B8B8B',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
  shareContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom
  },
  title: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  videoDetails: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  videoSize: {
    color: '#8B8B8B',
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '600',
    marginBottom: isSmallScreen ? 12 : 16,
    textAlign: 'center',
  },
  qrCodeWrapper: {
    backgroundColor: '#FFFFFF',
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 12,
    marginBottom: isSmallScreen ? 12 : 16,
    alignSelf: 'center',
  },
  qrSubtitle: {
    color: '#8B8B8B',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 20,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  serverText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtons: {
    marginTop: 10,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QRShareModal;