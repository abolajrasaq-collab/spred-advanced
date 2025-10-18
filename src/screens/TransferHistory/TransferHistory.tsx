import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SpredFileService, {
  TransferProgress,
} from '../../services/SpredFileService';
import TransferHistoryService, {
  TransferHistoryItem,
} from '../../services/TransferHistoryService';
import CustomText from '../../components/CustomText/CustomText';

const TransferHistory: React.FC = () => {
  const [transfers, setTransfers] = useState<TransferHistoryItem[]>([]);
  const [selectedTransfer, setSelectedTransfer] =
    useState<TransferHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const spredFileService = SpredFileService.getInstance();
  const transferHistoryService = TransferHistoryService.getInstance();

  useEffect(() => {
    loadTransferHistory();
  }, []);

  const loadTransferHistory = async () => {
    try {
      const history = await transferHistoryService.getHistory();
      setTransfers(history);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Failed to load transfer history:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 B';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  const formatDate = (timestamp: Date): string => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const date = new Date(timestamp);
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${month} ${day}, ${year} - ${hours}:${minutes}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'cancelled':
        return '#FF9800';
      default:
        return '#8B8B8B';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const getTypeIcon = (type: string): string => {
    return type === 'sent' ? 'upload' : 'download';
  };

  const handleTransferPress = (transfer: TransferHistoryItem) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Transfer History',
      'Are you sure you want to clear all transfer history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await transferHistoryService.clearHistory();
            setTransfers([]);
            Alert.alert('Success', 'Transfer history cleared');
          },
        },
      ],
    );
  };

  const handleRetryTransfer = (transfer: TransferHistoryItem) => {
    setShowDetailModal(false);
    // Navigate to SPRED screen with the file info for retry
    // This would need to be integrated with the navigation system
    Alert.alert('Retry Transfer', `Retrying transfer of ${transfer.fileName}`);
  };

  const renderTransferItem = ({ item }: { item: TransferHistoryItem }) => (
    <TouchableOpacity
      style={styles.transferItem}
      onPress={() => handleTransferPress(item)}
    >
      <View style={styles.transferHeader}>
        <View style={styles.transferTypeContainer}>
          <MaterialIcons
            name={getTypeIcon(item.type)}
            size={20}
            color={item.type === 'sent' ? '#F45303' : '#4CAF50'}
          />
          <Text
            style={[
              styles.transferType,
              { color: item.type === 'sent' ? '#F45303' : '#4CAF50' },
            ]}
          >
            {item.type.toUpperCase()}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <MaterialIcons
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.transferContent}>
        <Text style={styles.fileName} numberOfLines={1}>
          {item.fileName}
        </Text>
        <View style={styles.transferMeta}>
          <Text style={styles.fileSize}>{formatFileSize(item.fileSize)}</Text>
          <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.timestamp)}</Text>
        </View>

        {item.type === 'sent' && item.recipient && (
          <Text style={styles.recipient}>To: {item.recipient}</Text>
        )}
        {item.type === 'received' && item.sender && (
          <Text style={styles.sender}>From: {item.sender}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText fontSize={20} fontWeight="600" color="#FFFFFF">
          Transfer History
        </CustomText>
        {transfers.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <MaterialIcons name="delete" size={24} color="#8B8B8B" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={transfers}
        renderItem={renderTransferItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadTransferHistory}
            tintColor="#F45303"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="history" size={64} color="#666" />
            <CustomText
              fontSize={16}
              fontWeight="500"
              color="#CCCCCC"
              style={styles.emptyTitle}
            >
              No Transfer History
            </CustomText>
            <CustomText
              fontSize={14}
              color="#8B8B8B"
              style={styles.emptySubtitle}
            >
              Your SPRED transfers will appear here
            </CustomText>
          </View>
        }
      />

      {/* Transfer Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <CustomText fontSize={18} fontWeight="600" color="#FFFFFF">
                Transfer Details
              </CustomText>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <MaterialIcons name="close" size={24} color="#8B8B8B" />
              </TouchableOpacity>
            </View>

            {selectedTransfer && (
              <View style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>File Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedTransfer.fileName}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={styles.detailTypeContainer}>
                    <MaterialIcons
                      name={getTypeIcon(selectedTransfer.type)}
                      size={16}
                      color={
                        selectedTransfer.type === 'sent' ? '#F45303' : '#4CAF50'
                      }
                    />
                    <Text
                      style={[
                        styles.detailValue,
                        {
                          color:
                            selectedTransfer.type === 'sent'
                              ? '#F45303'
                              : '#4CAF50',
                        },
                      ]}
                    >
                      {selectedTransfer.type.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={styles.detailStatusContainer}>
                    <MaterialIcons
                      name={getStatusIcon(selectedTransfer.status)}
                      size={16}
                      color={getStatusColor(selectedTransfer.status)}
                    />
                    <Text
                      style={[
                        styles.detailValue,
                        { color: getStatusColor(selectedTransfer.status) },
                      ]}
                    >
                      {selectedTransfer.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>File Size:</Text>
                  <Text style={styles.detailValue}>
                    {formatFileSize(selectedTransfer.fileSize)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>
                    {formatDuration(selectedTransfer.duration)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedTransfer.timestamp)}
                  </Text>
                </View>

                {selectedTransfer.type === 'sent' &&
                  selectedTransfer.recipient && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Recipient:</Text>
                      <Text style={styles.detailValue}>
                        {selectedTransfer.recipient}
                      </Text>
                    </View>
                  )}

                {selectedTransfer.type === 'received' &&
                  selectedTransfer.sender && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Sender:</Text>
                      <Text style={styles.detailValue}>
                        {selectedTransfer.sender}
                      </Text>
                    </View>
                  )}

                {selectedTransfer.filePath && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>File Path:</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {selectedTransfer.filePath}
                    </Text>
                  </View>
                )}

                {selectedTransfer.errorMessage && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Error:</Text>
                    <Text
                      style={[styles.detailValue, { color: '#F44336' }]}
                      numberOfLines={3}
                    >
                      {selectedTransfer.errorMessage}
                    </Text>
                  </View>
                )}

                {selectedTransfer.status === 'failed' && (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => handleRetryTransfer(selectedTransfer)}
                  >
                    <MaterialIcons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={styles.retryButtonText}>Retry Transfer</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  listContainer: {
    padding: 16,
  },
  transferItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transferTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  transferType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  transferContent: {
    gap: 4,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transferMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  fileSize: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  duration: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  timestamp: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  recipient: {
    fontSize: 12,
    color: '#F45303',
  },
  sender: {
    fontSize: 12,
    color: '#4CAF50',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8B8B8B',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 2,
    textAlign: 'right',
  },
  detailTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  retryButton: {
    backgroundColor: '#F45303',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TransferHistory;
