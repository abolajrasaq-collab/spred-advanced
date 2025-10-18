import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SmartDownloadManager from '../../services/SmartDownloadManager';

interface DownloadTask {
  id: string;
  url: string;
  title: string;
  destination: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalSize: number;
  downloadedSize: number;
  speed: number;
  eta: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  quality: 'low' | 'medium' | 'high';
  priority: 'low' | 'normal' | 'high';
}

interface DownloadProgressProps {
  visible?: boolean;
  onPress?: () => void;
  compact?: boolean;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({
  visible = true,
  onPress,
  compact = false,
}) => {
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloadManager] = useState(SmartDownloadManager.getInstance());

  const progressAnim = new Animated.Value(0);
  const expandAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      loadDownloads();
      downloadManager.addListener('downloadProgress', handleDownloadUpdate);
    }

    return () => {
      downloadManager.removeListener('downloadProgress');
    };
  }, [visible]);

  const loadDownloads = () => {
    const queue = downloadManager.getQueue();
    const activeDownloads = [...queue.active, ...queue.pending];
    setDownloads(activeDownloads);
  };

  const handleDownloadUpdate = (task: DownloadTask) => {
    setDownloads(prev => {
      const updated = prev.filter(t => t.id !== task.id);
      if (task.status === 'downloading' || task.status === 'pending') {
        updated.push(task);
      }
      return updated;
    });
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

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) {
      return '0 B/s';
    }
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return (
      parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    );
  };

  const formatETA = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) {
      return '--:--';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'download';
      case 'pending':
        return 'schedule';
      case 'paused':
        return 'pause';
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'error';
      default:
        return 'download';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'paused':
        return '#9E9E9E';
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const handlePauseResume = async (task: DownloadTask) => {
    if (task.status === 'downloading') {
      await downloadManager.pauseDownload(task.id);
    } else if (task.status === 'paused') {
      await downloadManager.resumeDownload(task.id);
    }
  };

  const handleCancel = async (task: DownloadTask) => {
    await downloadManager.cancelDownload(task.id);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  if (!visible || downloads.length === 0) {
    return null;
  }

  const activeDownloads = downloads.filter(d => d.status === 'downloading');
  const totalProgress =
    activeDownloads.length > 0
      ? activeDownloads.reduce((sum, d) => sum + d.progress, 0) /
        activeDownloads.length
      : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          toggleExpanded();
          onPress?.();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <MaterialIcons name="download" size={20} color="#F45303" />
            <Text style={styles.headerText}>
              {downloads.length} download{downloads.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.progressText}>
              {Math.round(totalProgress)}%
            </Text>
            <MaterialIcons
              name={isExpanded ? 'expand-less' : 'expand-more'}
              size={20}
              color="#CCCCCC"
            />
          </View>
        </View>

        {!compact && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${totalProgress}%` }]}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.expandedContent}>
          {downloads.map(task => (
            <View key={task.id} style={styles.downloadItem}>
              <View style={styles.downloadHeader}>
                <View style={styles.downloadInfo}>
                  <Text style={styles.downloadTitle} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <Text style={styles.downloadStatus}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Text>
                </View>

                <View style={styles.downloadActions}>
                  {task.status === 'downloading' || task.status === 'paused' ? (
                    <TouchableOpacity
                      onPress={() => handlePauseResume(task)}
                      style={styles.actionButton}
                    >
                      <MaterialIcons
                        name={
                          task.status === 'downloading' ? 'pause' : 'play-arrow'
                        }
                        size={16}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => handleCancel(task)}
                    style={[styles.actionButton, styles.cancelButton]}
                  >
                    <MaterialIcons name="close" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {task.status === 'downloading' && (
                <View style={styles.downloadDetails}>
                  <View style={styles.downloadProgress}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${task.progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(task.progress)}%
                    </Text>
                  </View>

                  <View style={styles.downloadStats}>
                    <Text style={styles.statText}>
                      {formatFileSize(task.downloadedSize)} /{' '}
                      {formatFileSize(task.totalSize)}
                    </Text>
                    <Text style={styles.statText}>
                      {formatSpeed(task.speed)}
                    </Text>
                    <Text style={styles.statText}>
                      ETA: {formatETA(task.eta)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginRight: 8,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F45303',
    borderRadius: 2,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  downloadItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
    marginRight: 12,
  },
  downloadTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  downloadStatus: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  downloadActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F45303',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  downloadDetails: {
    marginTop: 12,
  },
  downloadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: '#8B8B8B',
  },
});

export default DownloadProgress;
