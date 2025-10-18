import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { getDataJson } from '../../helpers/api/Asyncstorage';

interface LiveStream {
  id: string;
  title: string;
  imageUrl: string;
  isLive: boolean;
  viewerCount: number;
  category: string;
  streamUrl: string;
  description: string;
  tags: string[];
  provider: {
    name: string;
    logo: string;
    description: string;
    establishedYear: number;
    headquarters: string;
    type: 'News' | 'Entertainment' | 'Music' | 'Kids';
  };
  streamingDetails: {
    quality: string;
    protocol: 'HLS' | 'MP4';
    bitrate: string;
    resolution: string;
    codec: string;
    startTime: Date;
    duration: string;
  };
}

const LiveCategory: React.FC = () => {
  const navigation = useNavigation<any>();
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'News', 'Entertainment', 'Music', 'Kids'];

  useEffect(() => {
    loadLiveStreams();
  }, []);

  const loadLiveStreams = async () => {
    try {
      // Load custom broadcaster channels
      const broadcasterChannels = await getDataJson('broadcaster_channels');
      const customStreams =
        broadcasterChannels?.filter((channel: any) => channel.isLive) || [];

      // Demo live content with rich provider information - Updated to match Homepage
      const demoLiveContent: LiveStream[] = [
        {
          id: 'live-1',
          title: 'Super Simple Songs TV',
          imageUrl:
            'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=225&fit=crop',
          isLive: true,
          viewerCount: 8540,
          category: 'Kids',
          streamUrl:
            'https://janson-supersimplesongs-1-us.roku.wurl.tv/playlist.m3u8',
          description:
            'Educational children\'s content featuring fun songs, nursery rhymes, and learning activities for kids.',
          tags: ['live', 'kids', 'educational', 'songs', 'nursery rhymes'],
          provider: {
            name: 'Super Simple Learning',
            logo: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=100&h=100&fit=crop&crop=center',
            description:
              'Leading children\'s educational content provider creating fun and engaging learning experiences.',
            establishedYear: 2006,
            headquarters: 'Vancouver, Canada',
            type: 'Kids' as const,
          },
          streamingDetails: {
            quality: '720p HD',
            protocol: 'HLS' as const,
            bitrate: '3000 kbps',
            resolution: '1280x720',
            codec: 'H.264',
            startTime: new Date(),
            duration: 'LIVE',
          },
        },
        {
          id: 'live-2',
          title: 'MBC 4 Live',
          imageUrl:
            'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=400&h=225&fit=crop',
          isLive: true,
          viewerCount: 34200,
          category: 'Entertainment',
          streamUrl:
            'https://shd-gcp-live.edgenextcdn.net/live/bitmovin-mbc-4/24f134f1cd63db9346439e96b86ca6ed/index.m3u8',
          description:
            'Middle East Broadcasting Center offering diverse entertainment programming including movies, series, and variety shows.',
          tags: ['live', 'entertainment', 'movies', 'series', 'variety'],
          provider: {
            name: 'MBC 4',
            logo: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=100&h=100&fit=crop&crop=center',
            description:
              'Leading Middle Eastern entertainment network providing quality programming across the region.',
            establishedYear: 2005,
            headquarters: 'Dubai, UAE',
            type: 'Entertainment' as const,
          },
          streamingDetails: {
            quality: '1080p HD',
            protocol: 'HLS' as const,
            bitrate: '5000 kbps',
            resolution: '1920x1080',
            codec: 'H.264',
            startTime: new Date(),
            duration: 'LIVE',
          },
        },
        {
          id: 'live-3',
          title: 'News Central Nigeria',
          imageUrl:
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop',
          isLive: true,
          viewerCount: 15600,
          category: 'News',
          streamUrl: 'https://wf.newscentral.ng:8443/hls/stream.m3u8',
          description:
            'Nigerian news network providing comprehensive coverage of local and international news, politics, and current affairs.',
          tags: ['live', 'news', 'nigeria', 'africa', 'politics'],
          provider: {
            name: 'News Central Nigeria',
            logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&h=100&fit=crop&crop=center',
            description:
              'Nigeria\'s leading news organization delivering accurate reporting on African and global events.',
            establishedYear: 2018,
            headquarters: 'Lagos, Nigeria',
            type: 'News' as const,
          },
          streamingDetails: {
            quality: '720p HD',
            protocol: 'HLS' as const,
            bitrate: '3500 kbps',
            resolution: '1280x720',
            codec: 'H.264',
            startTime: new Date(),
            duration: 'LIVE',
          },
        },
        {
          id: 'live-8',
          title: 'Al Jazeera English Live',
          imageUrl:
            'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=225&fit=crop',
          isLive: true,
          viewerCount: 45200,
          category: 'News',
          streamUrl: 'https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8',
          description:
            'Breaking news and current affairs from Al Jazeera English with comprehensive global coverage and analysis.',
          tags: [
            'live',
            'news',
            'breaking',
            'international',
            'current affairs',
          ],
          provider: {
            name: 'Al Jazeera English',
            logo: 'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=100&h=100&fit=crop&crop=center',
            description:
              'International news network providing comprehensive coverage of global events with Middle Eastern perspective.',
            establishedYear: 2006,
            headquarters: 'Doha, Qatar',
            type: 'News' as const,
          },
          streamingDetails: {
            quality: '720p HD',
            protocol: 'HLS' as const,
            bitrate: '4500 kbps',
            resolution: '1280x720',
            codec: 'H.264',
            startTime: new Date(),
            duration: 'LIVE',
          },
        },
        {
          id: 'live-9',
          title: 'B4U Music Live',
          imageUrl:
            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
          isLive: true,
          viewerCount: 12800,
          category: 'Music',
          streamUrl: 'https://cdnb4u.wiseplayout.com/B4U_Music/master.m3u8',
          description:
            'Live Bollywood and Indian music channel featuring latest hits, classic songs, and exclusive music content.',
          tags: ['live', 'music', 'bollywood', 'indian', 'entertainment'],
          provider: {
            name: 'B4U Music',
            logo: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center',
            description:
              'Leading Bollywood music channel bringing the best of Indian music and entertainment.',
            establishedYear: 1999,
            headquarters: 'Mumbai, India',
            type: 'Music' as const,
          },
          streamingDetails: {
            quality: '720p HD',
            protocol: 'HLS' as const,
            bitrate: '3500 kbps',
            resolution: '1280x720',
            codec: 'H.264',
            startTime: new Date(),
            duration: 'LIVE',
          },
        },
        {
          id: 'live-11',
          title: 'Bloomberg TV Asia',
          imageUrl:
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop',
          isLive: true,
          viewerCount: 28400,
          category: 'News',
          streamUrl: 'https://bloomberg.com/media-manifest/streams/asia.m3u8',
          description:
            'Bloomberg Television Asia providing live financial news, market analysis, and business coverage for the Asian markets.',
          tags: ['live', 'business', 'finance', 'markets', 'asia'],
          provider: {
            name: 'Bloomberg Television',
            logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop&crop=center',
            description:
              'Global business and financial information network providing real-time market data and analysis.',
            establishedYear: 1994,
            headquarters: 'New York, USA',
            type: 'News' as const,
          },
          streamingDetails: {
            quality: '720p HD',
            protocol: 'HLS' as const,
            bitrate: '4000 kbps',
            resolution: '1280x720',
            codec: 'H.264',
            startTime: new Date(),
            duration: 'LIVE',
          },
        },
      ];

      // Convert custom streams to match our interface
      const convertedCustomStreams: LiveStream[] = customStreams.map(
        (stream: any) => ({
          id: stream.id,
          title: stream.channelName,
          imageUrl:
            stream.providerLogo ||
            'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
          isLive: stream.isLive,
          viewerCount: stream.estimatedViewers || 0,
          category: stream.category,
          streamUrl: stream.streamUrl,
          description: stream.description || 'Live broadcast stream',
          tags: [stream.category.toLowerCase(), 'live'],
          provider: {
            name: stream.providerName,
            logo: stream.providerLogo || '',
            description: stream.providerDescription || 'Broadcasting provider',
            establishedYear:
              parseInt(stream.establishedYear) || new Date().getFullYear(),
            headquarters: stream.headquarters || 'Unknown',
            type: stream.category as any,
          },
          streamingDetails: {
            quality: 'HD',
            protocol: stream.streamUrl.includes('.m3u8')
              ? ('HLS' as const)
              : ('MP4' as const),
            bitrate: 'Variable',
            resolution: 'HD',
            codec: 'H.264',
            startTime: new Date(stream.createdAt),
            duration: 'LIVE',
          },
        }),
      );

      // Combine demo and custom streams
      const allStreams = [...convertedCustomStreams, ...demoLiveContent];
      setLiveStreams(allStreams);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading live streams:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLiveStreams();
    setRefreshing(false);
  };

  const handleStreamPress = (stream: LiveStream) => {
    if (stream.isLive) {
      navigation.navigate('LiveStream', {
        streamUrl: stream.streamUrl,
        channelInfo: {
          id: stream.id,
          title: stream.title,
          category: stream.category,
          viewerCount: stream.viewerCount,
          isLive: stream.isLive,
          description: stream.description,
          tags: stream.tags,
          provider: stream.provider,
          streamingDetails: stream.streamingDetails
            ? {
                ...stream.streamingDetails,
                // Serialize Date objects to ISO strings for navigation
                startTime:
                  stream.streamingDetails.startTime instanceof Date
                    ? stream.streamingDetails.startTime.toISOString()
                    : stream.streamingDetails.startTime,
                endTime:
                  stream.streamingDetails.endTime instanceof Date
                    ? stream.streamingDetails.endTime.toISOString()
                    : stream.streamingDetails.endTime,
              }
            : undefined,
        },
      });
    } else {
      Alert.alert('Stream Offline', 'This channel is currently offline.');
    }
  };

  const filteredStreams =
    selectedCategory === 'all'
      ? liveStreams
      : liveStreams.filter(stream => stream.category === selectedCategory);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1A1A1A" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>LIVE Channels</Text>
          <Text style={styles.headerSubtitle}>
            {filteredStreams.length} channels broadcasting
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('ChannelManager')}
          style={styles.addButton}
        >
          <Icon name="add" size={24} color="#F45303" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category &&
                    styles.categoryButtonTextActive,
                ]}
              >
                {category === 'all' ? 'All Channels' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Live Streams Grid */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F45303"
            colors={['#F45303']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredStreams.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="tv" size={64} color="#8B8B8B" />
            <Text style={styles.emptyTitle}>No Live Channels</Text>
            <Text style={styles.emptySubtitle}>
              {selectedCategory === 'all'
                ? 'No channels are currently broadcasting live'
                : `No ${selectedCategory} channels are currently live`}
            </Text>
            <TouchableOpacity
              style={styles.addChannelButton}
              onPress={() => navigation.navigate('ChannelManager')}
            >
              <Icon name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addChannelButtonText}>Add New Channel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.streamsGrid}>
            {filteredStreams.map(stream => (
              <TouchableOpacity
                key={stream.id}
                style={styles.streamCard}
                onPress={() => handleStreamPress(stream)}
                activeOpacity={0.8}
              >
                <View style={styles.streamImageContainer}>
                  <Image
                    source={{ uri: stream.imageUrl }}
                    style={styles.streamImage}
                    resizeMode="cover"
                  />

                  {/* Live Badge */}
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>

                  {/* Viewer Count */}
                  <View style={styles.viewerBadge}>
                    <Text style={styles.viewerCount}>
                      {stream.viewerCount.toLocaleString()} watching
                    </Text>
                  </View>

                  {/* Quality Badge */}
                  <View style={styles.qualityBadge}>
                    <Text style={styles.qualityText}>
                      {stream.streamingDetails.quality}
                    </Text>
                  </View>
                </View>

                <View style={styles.streamInfo}>
                  <Text style={styles.streamTitle} numberOfLines={2}>
                    {stream.title}
                  </Text>
                  <Text style={styles.streamCategory}>{stream.category}</Text>

                  {/* Provider Info */}
                  <View style={styles.providerInfo}>
                    {stream.provider.logo ? (
                      <Image
                        source={{ uri: stream.provider.logo }}
                        style={styles.providerLogo}
                      />
                    ) : (
                      <View
                        style={[
                          styles.providerLogo,
                          styles.providerLogoPlaceholder,
                        ]}
                      >
                        <Text style={styles.providerLogoText}>
                          {stream.provider.name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.providerName} numberOfLines={1}>
                      {stream.provider.name}
                    </Text>
                  </View>

                  <Text style={styles.streamDescription} numberOfLines={2}>
                    {stream.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom spacing for navigation */}
        <View style={styles.bottomSpacing} />
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
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
  },
  addButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoryFilter: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: '#F45303',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B8B8B',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  addChannelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addChannelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  streamsGrid: {
    padding: 16,
  },
  streamCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  streamImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  streamImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333333',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#E53E3E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  viewerBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewerCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  qualityBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(244, 83, 3, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  streamInfo: {
    padding: 16,
  },
  streamTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 24,
  },
  streamCategory: {
    fontSize: 12,
    color: '#D69E2E',
    marginBottom: 12,
    fontWeight: '500',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  providerLogoPlaceholder: {
    backgroundColor: '#F45303',
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerLogoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  providerName: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
    flex: 1,
  },
  streamDescription: {
    fontSize: 14,
    color: '#8B8B8B',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default LiveCategory;
