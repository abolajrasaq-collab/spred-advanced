import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { P2PService, Device, P2PFile } from '../../services/P2PService';
import WiFiDirectDiscovery from '../../components/WiFiDirect/WiFiDirectDiscovery';
import P2PVideoSelector from '../../components/WiFiDirect/P2PVideoSelector';
import P2PReceiveScreen from '../../components/WiFiDirect/P2PReceiveScreen';
import SpredFileService from '../../services/SpredFileService';
import logger from '../../utils/logger';

const { width, height } = Dimensions.get('window');

interface WiFiDirectScreenProps {}

interface WiFiDirectRouteParams {
  mode?: 'send' | 'receive';
  selectedFile?: {
    title: string;
    thumbnail: string;
    duration: string;
    size: number;
    videoKey: string;
    src: string;
  };
  autoStart?: boolean;
}

// Local transfer progress type extends P2PFile with UI-only fields
type TransferProgress = Partial<P2PFile> & {
  progress?: number; // percentage 0-100
  deviceName?: string;
  file?: string; // friendly filename or path
};

const WiFiDirectScreen: React.FC<WiFiDirectScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as WiFiDirectRouteParams;

  const [showFileSelection, setShowFileSelection] = useState(false);
  const [showVideoSelector, setShowVideoSelector] = useState(false);
  const [showReceiveScreen, setShowReceiveScreen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(
    null,
  );
  const [transferDirection, setTransferDirection] = useState<
    'sending' | 'receiving'
  >('sending');

  const p2pService = P2PService.getInstance();

  // Handle auto-start behavior based on route parameters
  useEffect(() => {
    logger.info('🚀 WiFiDirectScreen mounted with params:', routeParams);

    if (routeParams?.autoStart) {
      if (routeParams.mode === 'receive') {
        logger.info('📥 Auto-starting RECEIVE mode');
        // Auto-start receive mode - show receive screen directly
        setShowReceiveScreen(true);
      } else if (routeParams.mode === 'send' && routeParams.selectedFile) {
        logger.info(
          '📤 Auto-starting SEND mode with file:',
          routeParams.selectedFile.title,
        );
        // Auto-start send mode - the WiFiDirectDiscovery component will handle device discovery
        // and when a device is selected, it will automatically use the selected file
      }
    }
  }, [routeParams]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleDeviceSelected = useCallback(
    (device: Device) => {
      setSelectedDevice(device);

      logger.info('📱 Device selected:', device.deviceName);
      logger.info('🔍 Route params:', routeParams);

      // Check if we have pre-selected file from PlayVideos (auto-start send mode)
      if (routeParams?.mode === 'send' && routeParams.selectedFile) {
        logger.info('🚀 Auto-starting file transfer with pre-selected video');

        // Auto-start the transfer with the selected file
        handleAutoSendVideo(device, routeParams.selectedFile);
      } else {
        // Normal mode - show file selection
        setShowFileSelection(true);
      }
    },
    [routeParams],
  );

  // Function to handle auto-sending pre-selected video
  const handleAutoSendVideo = useCallback(
    async (device: Device, videoInfo: any) => {
      try {
        logger.info('📤 Auto-sending video:', videoInfo.title);
        logger.info('📤 To device:', device.deviceName);

        // Get the local file path for the video
        const filePath = await p2pService.getLocalVideoPath(videoInfo);
        
        if (!filePath) {
          Alert.alert(
            'Download Required',
            'The video needs to be downloaded before it can be shared. Would you like to download it first?',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Download', 
                onPress: async () => {
                  Alert.alert('Download Started', 'Please wait for the download to complete before sharing.');
                }
              }
            ]
          );
          return;
        }

        // Start the file transfer process
        const success = await p2pService.sendFile(filePath);

        if (!success) {
          Alert.alert('Transfer Error', 'Failed to start video transfer');
          return;
        }

        Alert.alert(
          '🚀 P2P Transfer Started',
          `Sending "${videoInfo.title}" to ${device.deviceName}\n\n📡 Group Creator: Your device\n📥 Group Connector: ${device.deviceName}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Show transfer progress modal
                setTransferDirection('sending');
                setTransferProgress({
                  file: videoInfo.title,
                  progress: 0,
                  deviceName: device.deviceName,
                });
                setShowTransferModal(true);
              },
            },
          ],
        );
      } catch (error) {
        logger.error('Auto-send error:', error);
        Alert.alert('Transfer Error', `Failed to send video: ${error.message}`);
      }
    },
    [],
  );

  const handleFileTransferStart = useCallback((file: P2PFile) => {
    setTransferProgress(file);
    setShowTransferModal(true);
    setTransferDirection(file.file ? 'sending' : 'receiving');
  }, []);

  const handleFileSelected = useCallback(
    async (filePath: string) => {
      if (!selectedDevice) {
        Alert.alert('Error', 'No device selected');
        return;
      }

      try {
        const success = await p2pService.sendFile(filePath);
        if (!success) {
          Alert.alert('Error', 'Failed to start file transfer');
          return;
        }

        setShowFileSelection(false);
        Alert.alert(
          'Transfer Started',
          `Sending file to ${selectedDevice.deviceName}...`,
        );
      } catch (error) {
        logger.error('File transfer error:', error);
        Alert.alert('Error', 'Failed to send file');
      }
    },
    [selectedDevice],
  );

  const handleVideoSelected = useCallback(
    async (video: any) => {
      if (!selectedDevice) {
        Alert.alert('Error', 'No device selected');
        return;
      }

      try {
        const success = await p2pService.sendFile(video.path);
        if (!success) {
          Alert.alert('Error', 'Failed to start video transfer');
          return;
        }

        Alert.alert(
          'Video Transfer Started',
          `Sending "${video.name}" to ${selectedDevice.deviceName} via WiFi Direct...`,
        );
      } catch (error) {
        logger.error('Video transfer error:', error);
        Alert.alert('Error', 'Failed to send video');
      }
    },
    [selectedDevice],
  );

  const handleReceiveFile = useCallback(() => {
    // Close file selection and open the enhanced receive screen
    setShowFileSelection(false);
    setShowReceiveScreen(true);
  }, []);

  const handleReceiveTransferStart = useCallback(() => {
    // When a receive transfer starts, show the transfer modal
    setTransferDirection('receiving');
    setShowTransferModal(true);
  }, []);

  const handleReceiveTransferComplete = useCallback(
    async (filePath: string) => {
      // When receive transfer completes, close receive screen and show success
      setShowReceiveScreen(false);

      // Extract filename from path
      const fileName = filePath.split('/').pop() || 'Received file';

      // Move the received file to the proper 'Received' directory using SpredFileService
      try {
        const spredFileService = SpredFileService.getInstance();
        await spredFileService.initializeDirectories();

        // Use the SpredFileService to handle the received file properly
        const result = await spredFileService.handleReceivedFile(
          filePath,
          fileName,
        );
        if (result.success) {
          Alert.alert(
            'Transfer Completed!',
            `File "${fileName}" has been received and saved to your Received folder.`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setShowTransferModal(false);
                },
              },
            ],
          );
        } else {
          console.error('Error moving received file:', result.error);
          Alert.alert(
            'Transfer Completed with Warning',
            `File "${fileName}" has been received but could not be properly organized: ${result.error}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setShowTransferModal(false);
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('Error handling received file:', error);
        Alert.alert(
          'Transfer Completed with Warning',
          `File "${fileName}" has been received but could not be properly organized: ${error.message}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowTransferModal(false);
              },
            },
          ],
        );
      }
    },
    [],
  );

  const renderTransferModal = () => (
    <Modal
      visible={showTransferModal}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.transferModal}>
          <View style={styles.transferIcon}>
            <MaterialIcons
              name={
                transferDirection === 'sending'
                  ? 'file-upload'
                  : 'file-download'
              }
              size={48}
              color="#F45303"
            />
          </View>

          <Text style={styles.transferTitle}>
            {transferDirection === 'sending'
              ? 'Sending File'
              : 'Receiving File'}
          </Text>

          {transferProgress && (
            <>
              <Text style={styles.fileName}>
                {transferProgress.file
                  ? transferProgress.file.split('/').pop()
                  : 'Incoming file...'}
              </Text>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${transferProgress?.progress ?? 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(transferProgress?.progress ?? 0)}%
                </Text>
              </View>

              <Text style={styles.transferSpeed}>
                {transferDirection === 'sending'
                  ? 'Uploading...'
                  : 'Downloading...'}
              </Text>
            </>
          )}

          <View style={styles.transferActions}>
            <TouchableOpacity
              style={[styles.transferButton, styles.cancelButton]}
              onPress={() => {
                setShowTransferModal(false);
                setShowFileSelection(false);
                setShowVideoSelector(false);
                setShowReceiveScreen(false);
              }}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render selected video info for SEND mode
  const renderSelectedVideoInfo = () => {
    if (routeParams?.mode !== 'send' || !routeParams?.selectedFile) {
      return null;
    }

    const { selectedFile } = routeParams;
    return (
      <View style={styles.selectedVideoContainer}>
        <View style={styles.selectedVideoHeader}>
          <MaterialIcons name="video-library" size={20} color="#F45303" />
          <Text style={styles.selectedVideoTitle}>Ready to Send:</Text>
        </View>
        <View style={styles.selectedVideoInfo}>
          <Text style={styles.videoTitle}>{selectedFile.title}</Text>
          <View style={styles.videoMeta}>
            {selectedFile.duration && (
              <Text style={styles.videoMetaText}>
                Duration: {selectedFile.duration}s
              </Text>
            )}
            {selectedFile.size > 0 && (
              <Text style={styles.videoMetaText}>
                Size: {Math.round(selectedFile.size / 1024 / 1024)}MB
              </Text>
            )}
          </View>
        </View>
        <View style={styles.selectedVideoAction}>
          <MaterialIcons name="send" size={16} color="#4CAF50" />
          <Text style={styles.selectedVideoActionText}>
            Select device to send
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selected Video Info for SEND mode */}
      {renderSelectedVideoInfo()}

      <WiFiDirectDiscovery
        onBack={handleBack}
        onDeviceSelected={handleDeviceSelected}
        onFileTransferStart={handleFileTransferStart}
        selectedVideo={
          routeParams?.mode === 'send' ? routeParams.selectedFile : null
        }
        autoConnect={routeParams?.mode === 'send' && !!routeParams.selectedFile}
      />

      {/* File Selection Modal */}
      <Modal
        visible={showFileSelection}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFileSelection(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fileSelectionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select File to Share with {selectedDevice?.deviceName}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFileSelection(false)}
              >
                <MaterialIcons name="close" size={24} color="#8B8B8B" />
              </TouchableOpacity>
            </View>

            <View style={styles.fileOptions}>
              <TouchableOpacity
                style={styles.fileOption}
                onPress={() => {
                  setShowVideoSelector(true);
                  setShowFileSelection(false);
                }}
              >
                <MaterialIcons name="video-library" size={32} color="#F45303" />
                <Text style={styles.fileOptionTitle}>
                  Select Downloaded Video
                </Text>
                <Text style={styles.fileOptionSubtitle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fileOption}
                onPress={() => {
                  // Navigate to file selection (you can integrate with existing file picker)
                  Alert.alert(
                    'File Selection',
                    'File picker integration would go here. For now, you can send a test video file.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Send Test File',
                        onPress: () => {
                          // For testing, send a dummy file path
                          handleFileSelected('/test/video.mp4');
                        },
                      },
                    ],
                  );
                }}
              >
                <MaterialIcons name="folder" size={32} color="#D69E2E" />
                <Text style={styles.fileOptionTitle}>Browse Files</Text>
                <Text style={styles.fileOptionSubtitle} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.fileOption}
                onPress={handleReceiveFile}
              >
                <MaterialIcons name="file-download" size={32} color="#4CAF50" />
                <Text style={styles.fileOptionTitle}>Receive File</Text>
                <Text style={styles.fileOptionSubtitle}>
                  {' '}
                  {selectedDevice?.deviceName}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Progress Modal */}
      {renderTransferModal()}

      {/* P2P Video Selector Modal */}
      <P2PVideoSelector
        visible={showVideoSelector}
        onClose={() => {
          setShowVideoSelector(false);
          // Don't automatically show file selection when closing
        }}
        onVideoSelected={handleVideoSelected}
        deviceName={selectedDevice?.deviceName}
      />

      {/* P2P Receive Screen Modal */}
      <P2PReceiveScreen
        visible={showReceiveScreen}
        onClose={() => {
          setShowReceiveScreen(false);
          // Don't automatically show file selection when closing
        }}
        deviceName={selectedDevice?.deviceName}
        onTransferStart={handleReceiveTransferStart}
        onTransferComplete={handleReceiveTransferComplete}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  selectedVideoContainer: {
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  selectedVideoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F45303',
  },
  selectedVideoInfo: {
    marginLeft: 28,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  videoMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  videoMetaText: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  selectedVideoAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  selectedVideoActionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileSelectionModal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  fileOptions: {
    gap: 16,
  },
  fileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  fileOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 16,
    flex: 1,
  },
  fileOptionSubtitle: {
    fontSize: 12,
    color: '#8B8B8B',
    marginTop: 4,
    marginLeft: 16,
  },
  transferModal: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 24,
    width: width * 0.85,
    alignItems: 'center',
  },
  transferIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  transferTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  fileName: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
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
  transferSpeed: {
    fontSize: 12,
    color: '#8B8B8B',
    marginBottom: 24,
  },
  transferActions: {
    flexDirection: 'row',
    width: '100%',
  },
  transferButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#FF5252',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default WiFiDirectScreen;
