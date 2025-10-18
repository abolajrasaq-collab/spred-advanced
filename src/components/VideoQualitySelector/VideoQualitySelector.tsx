import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface VideoQuality {
  name: string;
  width: number;
  height: number;
  bitrate: number;
  fileSize: number;
}

interface VideoQualitySelectorProps {
  visible: boolean;
  onClose: () => void;
  onQualitySelected: (quality: VideoQuality) => void;
  videoPath: string;
  currentQuality?: string;
}

const VideoQualitySelector: React.FC<VideoQualitySelectorProps> = ({
  visible,
  onClose,
  onQualitySelected,
  videoPath,
  currentQuality = 'medium',
}) => {
  const [qualities, setQualities] = useState<VideoQuality[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuality, setSelectedQuality] =
    useState<string>(currentQuality);

  useEffect(() => {
    if (visible && videoPath) {
      loadQualityOptions();
    }
  }, [visible, videoPath]);

  const loadQualityOptions = async () => {
    try {
      setLoading(true);
      // Simplified quality options - no performance service
      const defaultQualities: VideoQuality[] = [
        {
          name: 'Auto',
          width: 1920,
          height: 1080,
          bitrate: 5000000,
          fileSize: 50000000,
        },
        {
          name: '1080p HD',
          width: 1920,
          height: 1080,
          bitrate: 5000000,
          fileSize: 50000000,
        },
        {
          name: '720p HD',
          width: 1280,
          height: 720,
          bitrate: 2500000,
          fileSize: 25000000,
        },
        {
          name: '480p SD',
          width: 854,
          height: 480,
          bitrate: 1000000,
          fileSize: 10000000,
        },
        {
          name: '360p SD',
          width: 640,
          height: 360,
          bitrate: 500000,
          fileSize: 5000000,
        },
      ];
      setQualities(defaultQualities);
    } catch (error) {
      Alert.alert('Error', 'Failed to load video quality options');
    } finally {
      setLoading(false);
    }
  };

  const handleQualitySelect = (quality: VideoQuality) => {
    setSelectedQuality(quality.name.toLowerCase().split(' ')[0]);
    onQualitySelected(quality);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 B';
    }
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getQualityIcon = (quality: VideoQuality) => {
    if (quality.height >= 1080) {
      return 'hd';
    }
    if (quality.height >= 720) {
      return 'high-quality';
    }
    return 'sd';
  };

  const getQualityColor = (quality: VideoQuality) => {
    if (quality.height >= 1080) {
      return '#4CAF50';
    }
    if (quality.height >= 720) {
      return '#FF9800';
    }
    return '#F44336';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Video Quality</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F45303" />
              <Text style={styles.loadingText}>Loading quality options...</Text>
            </View>
          ) : (
            <View style={styles.qualityList}>
              {qualities.map((quality, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.qualityItem,
                    selectedQuality ===
                      quality.name.toLowerCase().split(' ')[0] &&
                      styles.selectedQuality,
                  ]}
                  onPress={() => handleQualitySelect(quality)}
                >
                  <View style={styles.qualityInfo}>
                    <View style={styles.qualityHeader}>
                      <MaterialIcons
                        name={getQualityIcon(quality)}
                        size={20}
                        color={getQualityColor(quality)}
                      />
                      <Text style={styles.qualityName}>{quality.name}</Text>
                      <View
                        style={[
                          styles.qualityBadge,
                          { backgroundColor: getQualityColor(quality) },
                        ]}
                      >
                        <Text style={styles.qualityBadgeText}>
                          {quality.width}x{quality.height}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.qualityDetails}>
                      <Text style={styles.qualitySize}>
                        {formatFileSize(quality.fileSize)}
                      </Text>
                      <Text style={styles.qualityBitrate}>
                        {Math.round(quality.bitrate / 1000)}kbps
                      </Text>
                    </View>
                  </View>

                  {selectedQuality ===
                    quality.name.toLowerCase().split(' ')[0] && (
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color="#F45303"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Higher quality = Better experience, Larger file size
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#CCCCCC',
    marginTop: 16,
    fontSize: 14,
  },
  qualityList: {
    maxHeight: 400,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  selectedQuality: {
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
  },
  qualityInfo: {
    flex: 1,
  },
  qualityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
    flex: 1,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qualityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qualitySize: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 16,
  },
  qualityBitrate: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  footerText: {
    fontSize: 12,
    color: '#8B8B8B',
    textAlign: 'center',
  },
});

export default VideoQualitySelector;
