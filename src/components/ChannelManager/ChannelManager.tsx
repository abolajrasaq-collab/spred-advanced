import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';
import { useNavigation } from '@react-navigation/native';

interface StreamChannel {
  id: string;
  channelName: string;
  category:
    | 'News'
    | 'Sports'
    | 'Entertainment'
    | 'Gaming'
    | 'Music'
    | 'Talk Show';
  streamUrl: string; // HLS or DASH URL
  isLive: boolean;
  description: string;
  estimatedViewers: number;
  createdAt: string;
  // Provider Information
  providerName: string;
  providerLogo?: string;
  providerWebsite?: string;
  establishedYear?: string;
  headquarters?: string;
  providerDescription?: string;
}

interface ChannelManagerProps {
  onClose?: () => void;
  onChannelSaved?: () => void;
  navigation?: any;
}

const ChannelManager: React.FC<ChannelManagerProps> = ({
  onClose,
  onChannelSaved,
  navigation: navProp,
}) => {
  const navigation = useNavigation<any>();
  const [channels, setChannels] = useState<StreamChannel[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [channelName, setChannelName] = useState('');
  const [category, setCategory] = useState<StreamChannel['category']>('News');
  const [streamUrl, setStreamUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [estimatedViewers, setEstimatedViewers] = useState('0');

  // Provider Information
  const [providerName, setProviderName] = useState('');
  const [providerLogo, setProviderLogo] = useState('');
  const [providerWebsite, setProviderWebsite] = useState('');
  const [establishedYear, setEstablishedYear] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [providerDescription, setProviderDescription] = useState('');

  const categories: StreamChannel['category'][] = [
    'News',
    'Sports',
    'Entertainment',
    'Gaming',
    'Music',
    'Talk Show',
  ];

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const savedChannels = await getDataJson('broadcaster_channels');
      if (savedChannels && Array.isArray(savedChannels)) {
        setChannels(savedChannels);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading channels:', error);
    }
  };

  const saveChannels = async (updatedChannels: StreamChannel[]) => {
    try {
      await storeDataJson('broadcaster_channels', updatedChannels);
      setChannels(updatedChannels);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving channels:', error);
      Alert.alert('Error', 'Failed to save channel data');
    }
  };

  const validateStreamUrl = (url: string): boolean => {
    // Basic validation for HLS/DASH URLs
    const hlsPattern = /\.(m3u8)(\?.*)?$/i;
    const dashPattern = /\.(mpd)(\?.*)?$/i;
    const httpPattern = /^https?:\/\//i;

    return (
      httpPattern.test(url) && (hlsPattern.test(url) || dashPattern.test(url))
    );
  };

  const handleAddChannel = () => {
    if (!channelName.trim()) {
      Alert.alert('Error', 'Please enter a channel name');
      return;
    }

    if (!streamUrl.trim()) {
      Alert.alert('Error', 'Please enter a stream URL');
      return;
    }

    if (!validateStreamUrl(streamUrl)) {
      Alert.alert(
        'Invalid Stream URL',
        'Please enter a valid HLS (.m3u8) or DASH (.mpd) stream URL starting with http:// or https://',
      );
      return;
    }

    const newChannel: StreamChannel = {
      id: `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channelName: channelName.trim(),
      category,
      streamUrl: streamUrl.trim(),
      isLive,
      description: description.trim(),
      estimatedViewers: parseInt(estimatedViewers) || 0,
      createdAt: new Date().toISOString(),
      // Provider Information
      providerName: providerName.trim(),
      providerLogo: providerLogo.trim() || undefined,
      providerWebsite: providerWebsite.trim() || undefined,
      establishedYear: establishedYear.trim() || undefined,
      headquarters: headquarters.trim() || undefined,
      providerDescription: providerDescription.trim() || undefined,
    };

    const updatedChannels = [...channels, newChannel];
    saveChannels(updatedChannels);

    // Reset form
    setChannelName('');
    setStreamUrl('');
    setDescription('');
    setEstimatedViewers('0');
    setIsLive(false);
    setProviderName('');
    setProviderLogo('');
    setProviderWebsite('');
    setEstablishedYear('');
    setHeadquarters('');
    setProviderDescription('');
    setShowAddForm(false);

    Alert.alert('Success', 'Channel added successfully!');
    if (onChannelSaved) {
      onChannelSaved();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleToggleLive = async (channelId: string) => {
    const updatedChannels = channels.map(channel =>
      channel.id === channelId
        ? { ...channel, isLive: !channel.isLive }
        : channel,
    );
    await saveChannels(updatedChannels);
  };

  const handleDeleteChannel = (channelId: string) => {
    Alert.alert(
      'Delete Channel',
      'Are you sure you want to delete this channel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedChannels = channels.filter(c => c.id !== channelId);
            await saveChannels(updatedChannels);
            onChannelSaved();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - only show when used as modal */}
      {onClose && (
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Channel Manager</Text>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            <Icon name="add" size={24} color="#F45303" />
          </TouchableOpacity>
        </View>
      )}

      {/* Standalone screen header */}
      {!onClose && (
        <View style={styles.standaloneHeader}>
          <TouchableOpacity
            onPress={() => setShowAddForm(!showAddForm)}
            style={styles.addButton}
          >
            <Icon name="add" size={24} color="#F45303" />
            <Text style={styles.addButtonText}>Add New Channel</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {/* Add Channel Form */}
        {showAddForm && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add New Channel</Text>

            <TextInput
              style={styles.input}
              placeholder="Channel Name (e.g., CNN Sports Live)"
              placeholderTextColor="#8B8B8B"
              value={channelName}
              onChangeText={setChannelName}
            />

            <View style={styles.categoryContainer}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Stream URL (HLS .m3u8 or DASH .mpd)"
              placeholderTextColor="#8B8B8B"
              value={streamUrl}
              onChangeText={setStreamUrl}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#8B8B8B"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <TextInput
              style={styles.input}
              placeholder="Estimated Viewers (optional)"
              placeholderTextColor="#8B8B8B"
              value={estimatedViewers}
              onChangeText={setEstimatedViewers}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Go Live Immediately</Text>
              <Switch
                value={isLive}
                onValueChange={setIsLive}
                trackColor={{ false: '#2A2A2A', true: '#F45303' }}
                thumbColor={isLive ? '#FFFFFF' : '#8B8B8B'}
              />
            </View>

            {/* Provider Information Section */}
            <View style={styles.sectionHeader}>
              <Icon name="business" size={20} color="#F45303" />
              <Text style={styles.sectionHeaderTitle}>
                Provider Information
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Provider/Company Name (e.g., CNN, BBC Sports)"
              placeholderTextColor="#8B8B8B"
              value={providerName}
              onChangeText={setProviderName}
            />

            <TextInput
              style={styles.input}
              placeholder="Provider Logo URL (optional)"
              placeholderTextColor="#8B8B8B"
              value={providerLogo}
              onChangeText={setProviderLogo}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TextInput
              style={styles.input}
              placeholder="Website (optional)"
              placeholderTextColor="#8B8B8B"
              value={providerWebsite}
              onChangeText={setProviderWebsite}
              autoCapitalize="none"
              keyboardType="url"
            />

            <TextInput
              style={styles.input}
              placeholder="Established Year (optional)"
              placeholderTextColor="#8B8B8B"
              value={establishedYear}
              onChangeText={setEstablishedYear}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Headquarters (e.g., New York, USA)"
              placeholderTextColor="#8B8B8B"
              value={headquarters}
              onChangeText={setHeadquarters}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="About Your Organization (optional)"
              placeholderTextColor="#8B8B8B"
              value={providerDescription}
              onChangeText={setProviderDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddChannel}
              >
                <Text style={styles.saveButtonText}>Add Channel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Channels List */}
        <Text style={styles.sectionTitle}>
          Your Channels ({channels.length})
        </Text>

        {channels.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="tv" size={48} color="#8B8B8B" />
            <Text style={styles.emptyTitle}>No Channels Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first broadcast channel to start streaming on Spred
            </Text>
          </View>
        ) : (
          channels.map(channel => (
            <View key={channel.id} style={styles.channelCard}>
              <View style={styles.channelHeader}>
                <View style={styles.channelInfo}>
                  <Text style={styles.channelName}>{channel.channelName}</Text>
                  <Text style={styles.channelCategory}>{channel.category}</Text>
                  {channel.isLive && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteChannel(channel.id)}
                >
                  <Icon name="delete" size={20} color="#8B8B8B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.streamUrl} numberOfLines={1}>
                📡 {channel.streamUrl}
              </Text>

              {channel.description && (
                <Text style={styles.channelDescription}>
                  {channel.description}
                </Text>
              )}

              <View style={styles.channelFooter}>
                <Text style={styles.viewerCount}>
                  👥 {channel.estimatedViewers} viewers
                </Text>
                <View style={styles.liveToggle}>
                  <Text style={styles.toggleLabel}>Live</Text>
                  <Switch
                    value={channel.isLive}
                    onValueChange={() => handleToggleLive(channel.id)}
                    trackColor={{ false: '#2A2A2A', true: '#F45303' }}
                    thumbColor={channel.isLive ? '#FFFFFF' : '#8B8B8B'}
                  />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  addForm: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  categoryContainer: {
    marginBottom: 12,
  },
  categoryButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#F45303',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#8B8B8B',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#8B8B8B',
  },
  cancelButtonText: {
    color: '#8B8B8B',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#F45303',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 20,
  },
  channelCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  channelCategory: {
    fontSize: 12,
    color: '#D69E2E',
    marginBottom: 4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F45303',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F45303',
    letterSpacing: 1,
  },
  deleteButton: {
    padding: 4,
  },
  streamUrl: {
    fontSize: 12,
    color: '#8B8B8B',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  channelDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 18,
    marginBottom: 12,
  },
  channelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewerCount: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  liveToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  standaloneHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    alignItems: 'flex-end',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ChannelManager;
