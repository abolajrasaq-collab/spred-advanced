import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';
import { CustomText, Icon, VideoCard } from '../../components';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import { FollowingService } from '../../services/FollowingService';
import { getDataJson } from '../../../src/helpers/api/Asyncstorage';
import axios, { AxiosError } from 'axios';
import { api } from '../../../src/helpers/api/api';
import { customHeaders } from '../../../src/helpers/api/apiConfig';
import { cleanMovieTitle } from '../../../src/helpers/utils';

// Define User interface for type safety
interface User {
  token?: string;
  [key: string]: any;
}

interface CreatorInfo {
  name: string;
  subscribers: number;
  avatar?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    facebook?: string;
  };
  joinedDate?: string;
  totalVideos?: number;
  totalViews?: number;
}

// Text constants
const TEXT_CONSTANTS = {
  SUBSCRIBE: 'Subscribe',
  SUBSCRIBERS: 'Subscribers',
  VIDEOS: 'Videos',
  SHORTS: 'Shorts',
  LIVESTREAM: 'Live',
  ABOUT: 'About',
  FOLLOWING: 'Following',
  LOADING: 'Loading...',
  VIEWS: 'Views',
  JOINED: 'Joined',
  WEBSITE: 'Website',
  SHARE: 'Share',
  MORE: 'More',
  NO_VIDEOS: 'No videos yet',
  NO_SHORTS: 'No shorts yet',
  NO_LIVESTREAM: 'No live streams',
  ERROR_LOADING: 'Error loading creator profile',
  // Additional labels to avoid inline JSX strings
  RETRY: 'Retry',
  DONATE: 'Donate',
  LIVE_NOW: 'LIVE NOW',
  LIVE_STREAM_TITLE: 'Live Stream Title',
  VIEWERS_PLACEHOLDER: '1.2K viewers',
  CHANNEL_STATISTICS: 'Channel Statistics',
  TOTAL_VIDEOS_LABEL: 'Total Videos:',
  TOTAL_VIEWS_LABEL: 'Total Views:',
  JOINED_LABEL: 'Joined:',
} as const;

// Tab keys centralized to avoid raw string literals in JSX
const TAB_KEYS = {
  VIDEOS: 'videos',
  SHORTS: 'shorts',
  LIVESTREAM: 'livestream',
  ABOUT: 'about',
} as const;

const CreatorProfile = () => {
  const route = useRoute();
  const { creatorName, creatorId } = route.params as {
    creatorName: string;
    creatorId: string;
  };
  const navigation = useNavigation<NativeStackNavigationProp<MainParamsList>>();

  // Responsive design helpers
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth < 600;

  // Responsive spacing and font size helpers
  const getResponsiveSpacing = (baseSpacing: number) => {
    if (isSmallScreen) {
      return baseSpacing * 0.8;
    }
    if (isMediumScreen) {
      return baseSpacing * 0.9;
    }
    return baseSpacing;
  };

  const getResponsiveFontSize = (baseSize: number) => {
    if (isSmallScreen) {
      return baseSize * 0.85;
    }
    if (isMediumScreen) {
      return baseSize * 0.9;
    }
    return baseSize;
  };

  const colors = useThemeColors();
  const { spacing } = useSpacing();

  // State management
  const [creatorInfo, setCreatorInfo] = useState<CreatorInfo>({
    name: creatorName,
    subscribers: 0,
    avatar: undefined,
    bio: '',
    website: '',
    socialLinks: {},
    joinedDate: '',
    totalVideos: 0,
    totalViews: 0,
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    typeof TAB_KEYS[keyof typeof TAB_KEYS]
  >(TAB_KEYS.VIDEOS);
  const [creatorVideos, setCreatorVideos] = useState([]);
  const [creatorShorts, setCreatorShorts] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Tabs configuration moved out of JSX to avoid raw string literals inside JSX
  const TABS = [
    { key: TAB_KEYS.VIDEOS, label: TEXT_CONSTANTS.VIDEOS },
    { key: TAB_KEYS.SHORTS, label: TEXT_CONSTANTS.SHORTS },
    { key: TAB_KEYS.LIVESTREAM, label: TEXT_CONSTANTS.LIVESTREAM },
    { key: TAB_KEYS.ABOUT, label: TEXT_CONSTANTS.ABOUT },
  ];

  // Helper function to format subscriber count
  const formatSubscriberCount = (count: number | undefined): string => {
    if (!count || count === 0) {
      return '0 Subscribers';
    }
    if (count < 1000) {
      return `${count} Subscribers`;
    }
    if (count < 1000000) {
      return `${(count / 1000).toFixed(0)}K Subscribers`;
    }
    if (count < 1000000000) {
      return `${(count / 1000000).toFixed(1)}M Subscribers`;
    }
    return `${(count / 1000000000).toFixed(1)}B Subscribers`;
  };

  // Helper function to format view count
  const formatViewCount = (count: number | undefined): string => {
    if (!count || count === 0) {
      return '0 Views';
    }
    if (count < 1000) {
      return `${count} Views`;
    }
    if (count < 1000000) {
      return `${(count / 1000).toFixed(0)}K Views`;
    }
    if (count < 1000000000) {
      return `${(count / 1000000).toFixed(1)}M Views`;
    }
    return `${(count / 1000000000).toFixed(1)}B Views`;
  };

  // Helper function to get initials from name
  const getInitials = (name: string | undefined): string => {
    if (!name) {
      return '?';
    }
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (
      words[0].charAt(0) + words[words.length - 1].charAt(0)
    ).toUpperCase();
  };

  // Helper function to generate consistent avatar color based on name
  const getAvatarColor = (name: string | undefined): string => {
    if (!name) {
      return '#666666';
    }

    const colors = [
      '#F45303', // Spred orange
      '#D69E2E', // Deep amber
      '#8B8B8B', // Accent grey
      '#FF9800', // Orange
      '#4CAF50', // Green
      '#2196F3', // Blue
      '#795548', // Brown
      '#FF5722', // Deep Orange
      '#009688', // Teal
      '#333333', // Dark grey
    ];

    const firstLetter = name.charAt(0).toLowerCase();
    const nameLength = name.length;
    const colorIndex = (firstLetter.charCodeAt(0) + nameLength) % colors.length;

    return colors[colorIndex];
  };

  // Load creator profile data
  const loadCreatorProfile = async () => {
    try {
      setLoading(true);
      setError(false);

      // Generate creator info based on creator name
      const mockCreatorInfo: CreatorInfo = {
        name: creatorName,
        subscribers: Math.floor(Math.random() * 100000) + 1000, // Mock subscriber count
        avatar: undefined, // Would come from API
        bio: `Welcome to ${creatorName}'s channel! We create amazing content for the SPRED community.`,
        website: `https://${creatorName.toLowerCase().replace(/\s+/g, '')}.com`,
        socialLinks: {
          twitter: `https://twitter.com/${creatorName
            .toLowerCase()
            .replace(/\s+/g, '')}`,
          instagram: `https://instagram.com/${creatorName
            .toLowerCase()
            .replace(/\s+/g, '')}`,
          youtube: `https://youtube.com/@${creatorName
            .toLowerCase()
            .replace(/\s+/g, '')}`,
        },
        joinedDate: 'January 2023',
        totalVideos: Math.floor(Math.random() * 50) + 10,
        totalViews: Math.floor(Math.random() * 1000000) + 50000,
      };

      setCreatorInfo(mockCreatorInfo);

      // Check following status
      const isFollowingCreator = await FollowingService.isFollowingCreator(
        creatorId,
      );
      setIsFollowing(isFollowingCreator);

      // Load creator's videos (mock data for now)
      await loadCreatorVideos();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading creator profile:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Load creator's videos
  const loadCreatorVideos = async () => {
    try {
      const user = await getDataJson<User | null>('User');

      // If user is not logged in or no token, use mock data
      if (!user?.token) {
        // DISABLED FOR PERFORMANCE
        // console.log('No user token found, using mock data for creator videos');
        setCreatorVideos([]);
        setCreatorShorts([]);
        setLiveStreams([]);
        return;
      }

      const config = { headers: customHeaders(user.token) };

      const response = await axios.get(api.getAllMovies, config);

      // Filter videos by creator (mock filtering for now)
      const allVideos = response?.data?.data || [];
      const mockCreatorVideos = allVideos.slice(0, 8); // Take first 8 as creator's videos
      setCreatorVideos(mockCreatorVideos);

      // Mock shorts data
      setCreatorShorts(mockCreatorVideos.slice(0, 4));

      // Mock live streams (empty for now)
      setLiveStreams([]);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading creator videos:', error);

      // If API fails due to authentication, use mock data instead
      if (error instanceof AxiosError && error.response?.status === 401) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );
        setCreatorVideos([]);
        setCreatorShorts([]);
        setLiveStreams([]);
      } else {
        // For other errors, still show empty state
        setCreatorVideos([]);
        setCreatorShorts([]);
        setLiveStreams([]);
      }
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (followingLoading) {
      return;
    }

    try {
      setFollowingLoading(true);

      if (isFollowing) {
        const success = await FollowingService.unfollowCreator(creatorId);
        if (success) {
          setIsFollowing(false);
          setCreatorInfo(prev => ({
            ...prev,
            subscribers: Math.max(0, prev.subscribers - 1),
          }));
          Alert.alert('Success', `Unfollowed ${creatorInfo.name}`);
        } else {
          Alert.alert('Error', 'Failed to unfollow. Please try again.');
        }
      } else {
        const success = await FollowingService.followCreator(
          creatorId,
          creatorInfo.name,
          creatorInfo.avatar,
        );
        if (success) {
          setIsFollowing(true);
          setCreatorInfo(prev => ({
            ...prev,
            subscribers: prev.subscribers + 1,
          }));
          Alert.alert('Success', `Following ${creatorInfo.name}`);
        } else {
          Alert.alert('Error', 'Failed to follow. Please try again.');
        }
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status. Please try again.');
    } finally {
      setFollowingLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorProfile();
  }, [creatorName, creatorId]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#1A1A1A',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Icon name="account-circle" size={48} color="#F45303" />
        <CustomText
          fontSize={getResponsiveFontSize(16)}
          color="#CCCCCC"
          style={{ marginTop: spacing.md }}
        >
          {TEXT_CONSTANTS.LOADING}
        </CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#1A1A1A',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
        }}
      >
        <Icon name="error" size={48} color="#FF5722" />
        <CustomText
          fontSize={getResponsiveFontSize(16)}
          color="#CCCCCC"
          style={{ marginTop: spacing.md, textAlign: 'center' }}
        >
          {TEXT_CONSTANTS.ERROR_LOADING}
        </CustomText>
        <TouchableOpacity
          onPress={loadCreatorProfile}
          style={{
            marginTop: spacing.md,
            backgroundColor: '#F45303',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            borderRadius: 8,
          }}
        >
          <CustomText
            fontSize={getResponsiveFontSize(14)}
            fontWeight="600"
            color="#FFFFFF"
          >
            {TEXT_CONSTANTS.RETRY}
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
      >
        {/* Header with back button */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: '#2A2A2A',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ padding: spacing.sm }}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <CustomText
            fontSize={getResponsiveFontSize(18)}
            fontWeight="600"
            color="#FFFFFF"
            style={{ marginLeft: spacing.md }}
          >
            {creatorInfo.name}
          </CustomText>
        </View>

        {/* Creator Header Section */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.xl,
            backgroundColor: '#2A2A2A',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            {/* Creator Avatar */}
            <View
              style={{
                width: isSmallScreen ? 80 : 100,
                height: isSmallScreen ? 80 : 100,
                borderRadius: isSmallScreen ? 40 : 50,
                overflow: 'hidden',
                marginRight: spacing.lg,
                borderWidth: 3,
                borderColor: '#F45303',
              }}
            >
              {creatorInfo.avatar ? (
                <Image
                  source={{ uri: creatorInfo.avatar }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: getAvatarColor(creatorInfo.name),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <CustomText
                    fontSize={isSmallScreen ? 24 : 32}
                    fontWeight="700"
                    color="#FFFFFF"
                    style={{
                      textAlign: 'center',
                      lineHeight: isSmallScreen ? 30 : 38,
                      paddingHorizontal: isSmallScreen ? 4 : 6,
                    }}
                  >
                    {getInitials(creatorInfo.name)}
                  </CustomText>
                </View>
              )}
            </View>

            {/* Creator Info */}
            <View style={{ flex: 1 }}>
              <CustomText
                fontSize={getResponsiveFontSize(24)}
                fontWeight="700"
                color="#FFFFFF"
                style={{ marginBottom: spacing.xs }}
              >
                {creatorInfo.name}
              </CustomText>

              <CustomText
                fontSize={getResponsiveFontSize(16)}
                color="#CCCCCC"
                style={{ marginBottom: spacing.sm }}
              >
                {formatSubscriberCount(creatorInfo.subscribers)}
              </CustomText>

              <CustomText
                fontSize={getResponsiveFontSize(14)}
                color="#999999"
                style={{ marginBottom: spacing.md, lineHeight: 20 }}
                numberOfLines={3}
              >
                {creatorInfo.bio}
              </CustomText>

              {/* Action Buttons - Refactored to fit text properly, with SHARE button removed */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: getResponsiveSpacing(spacing.sm),
                }}
              >
                <TouchableOpacity
                  onPress={handleFollowToggle}
                  disabled={followingLoading}
                  style={{
                    backgroundColor: isFollowing ? '#333333' : '#F45303',
                    paddingHorizontal: getResponsiveSpacing(spacing.md),
                    paddingVertical: getResponsiveSpacing(spacing.sm),
                    borderRadius: 8,
                    opacity: followingLoading ? 0.6 : 1,
                    flex: 1, // SUBSCRIBE button now gets equal space
                  }}
                >
                  <CustomText
                    fontSize={getResponsiveFontSize(14)}
                    fontWeight="600"
                    color="#FFFFFF"
                    style={{ textAlign: 'center' }}
                  >
                    {followingLoading ? (
                        <CustomText fontSize={getResponsiveFontSize(14)} fontWeight="600" color="#FFFFFF" style={{ textAlign: 'center' }}>
                          {TEXT_CONSTANTS.LOADING}
                        </CustomText>
                      ) : isFollowing ? (
                        TEXT_CONSTANTS.FOLLOWING
                      ) : (
                        TEXT_CONSTANTS.SUBSCRIBE
                      )}
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    // Handle donate functionality
                    Alert.alert(
                      'Donate',
                      'Donate feature coming soon to support this creator!',
                      [{ text: 'OK', style: 'cancel' }],
                    );
                  }}
                  style={{
                    backgroundColor: '#4CAF50',
                    paddingHorizontal: getResponsiveSpacing(spacing.md),
                    paddingVertical: getResponsiveSpacing(spacing.sm),
                    borderRadius: 8,
                    flex: 1, // DONATE button now gets equal space
                  }}
                >
                  <CustomText
                    fontSize={getResponsiveFontSize(14)}
                    fontWeight="600"
                    color="#FFFFFF"
                    style={{ textAlign: 'center' }}
                  >
                    {TEXT_CONSTANTS.DONATE}
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            backgroundColor: '#2A2A2A',
            marginTop: 1,
          }}
        >
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              borderRightWidth: 1,
              borderRightColor: '#333333',
            }}
          >
            <CustomText
              fontSize={getResponsiveFontSize(18)}
              fontWeight="700"
              color="#FFFFFF"
            >
              {creatorInfo.totalVideos}
            </CustomText>
            <CustomText fontSize={getResponsiveFontSize(12)} color="#CCCCCC">
              {TEXT_CONSTANTS.VIDEOS}
            </CustomText>
          </View>

          <View
            style={{
              flex: 1,
              alignItems: 'center',
              borderRightWidth: 1,
              borderRightColor: '#333333',
            }}
          >
            <CustomText
              fontSize={getResponsiveFontSize(18)}
              fontWeight="700"
              color="#FFFFFF"
            >
              {formatViewCount(creatorInfo.totalViews).replace(' Views', '')}
            </CustomText>
            <CustomText fontSize={getResponsiveFontSize(12)} color="#CCCCCC">
              {TEXT_CONSTANTS.VIEWS}
            </CustomText>
          </View>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <CustomText
              fontSize={getResponsiveFontSize(18)}
              fontWeight="700"
              color="#FFFFFF"
            >
              {creatorInfo.joinedDate}
            </CustomText>
            <CustomText fontSize={getResponsiveFontSize(12)} color="#CCCCCC">
              {TEXT_CONSTANTS.JOINED}
            </CustomText>
          </View>
        </View>

        {/* Content Tabs */}
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
          }}
        >
          {/* Tab Headers */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: '#333333',
              marginBottom: spacing.lg,
            }}
          >
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  paddingBottom: spacing.sm,
                  borderBottomWidth: activeTab === tab.key ? 2 : 0,
                  borderBottomColor:
                    activeTab === tab.key ? '#F45303' : 'transparent',
                }}
              >
                <CustomText
                  fontSize={getResponsiveFontSize(14)}
                  fontWeight={activeTab === tab.key ? '600' : '400'}
                  color={activeTab === tab.key ? '#FFFFFF' : '#CCCCCC'}
                >
                  {tab.label}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === TAB_KEYS.VIDEOS && (
            <View>
              {creatorVideos.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: isSmallScreen
                      ? 'space-between'
                      : 'flex-start',
                    marginBottom: -spacing.md,
                  }}
                >
                  {creatorVideos.map((item, index) => (
                    <VideoCard
                      key={item.key || item.videoKey || item._ID || index}
                      title={cleanMovieTitle(item.title)}
                      thumbnail={item?.thumbnailUrl}
                      duration={item.duration}
                      variant="compact"
                      onPress={() =>
                        navigation.navigate('PlayVideos', { item })
                      }
                      style={{
                        width: isSmallScreen ? '48%' : '32%',
                        marginBottom: spacing.md,
                        marginRight: isSmallScreen ? 0 : spacing.sm,
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.xxl,
                  }}
                >
                  <Icon name="video" size={48} color="#666666" />
                  <CustomText
                    fontSize={getResponsiveFontSize(16)}
                    color="#666666"
                    style={{ marginTop: spacing.md, textAlign: 'center' }}
                  >
                    {TEXT_CONSTANTS.NO_VIDEOS}
                  </CustomText>
                </View>
              )}
            </View>
          )}

          {activeTab === TAB_KEYS.SHORTS && (
            <View>
              {creatorShorts.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: isSmallScreen
                      ? 'space-between'
                      : 'flex-start',
                    marginBottom: -spacing.md,
                  }}
                >
                  {creatorShorts.map((item, index) => (
                    <VideoCard
                      key={item.key || item.videoKey || item._ID || index}
                      title={cleanMovieTitle(item.title)}
                      thumbnail={item?.thumbnailUrl}
                      duration={item.duration}
                      variant="compact"
                      onPress={() => navigation.navigate('Shorts')}
                      style={{
                        width: isSmallScreen ? '48%' : '32%',
                        marginBottom: spacing.md,
                        marginRight: isSmallScreen ? 0 : spacing.sm,
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.xxl,
                  }}
                >
                  <Icon name="flash" size={48} color="#666666" />
                  <CustomText
                    fontSize={getResponsiveFontSize(16)}
                    color="#666666"
                    style={{ marginTop: spacing.md, textAlign: 'center' }}
                  >
                    {TEXT_CONSTANTS.NO_SHORTS}
                  </CustomText>
                </View>
              )}
            </View>
          )}

          {activeTab === TAB_KEYS.LIVESTREAM && (
            <View>
              {liveStreams.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: isSmallScreen
                      ? 'space-between'
                      : 'flex-start',
                    marginBottom: -spacing.md,
                  }}
                >
                  {liveStreams.map((item, index) => (
                    <TouchableOpacity
                      key={`live-${index}`}
                      style={{
                        backgroundColor: '#2A2A2A',
                        borderRadius: 8,
                        padding: spacing.md,
                        marginBottom: spacing.md,
                        borderWidth: 2,
                        borderColor: '#FF0000',
                        width: isSmallScreen ? '100%' : '48%',
                        marginRight: isSmallScreen ? 0 : spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: spacing.sm,
                        }}
                      >
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: '#FF0000',
                            marginRight: spacing.sm,
                          }}
                        />
                        <CustomText
                          fontSize={14}
                          fontWeight="600"
                          color="#FFFFFF"
                        >
                          {TEXT_CONSTANTS.LIVE_NOW}
                        </CustomText>
                      </View>
                      <CustomText
                        fontSize={16}
                        fontWeight="600"
                        color="#FFFFFF"
                        numberOfLines={2}
                      >
                        {TEXT_CONSTANTS.LIVE_STREAM_TITLE}
                      </CustomText>
                      <CustomText
                        fontSize={12}
                        color="#CCCCCC"
                        style={{ marginTop: 4 }}
                      >
                        {TEXT_CONSTANTS.VIEWERS_PLACEHOLDER}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.xxl,
                  }}
                >
                  <Icon name="live-tv" size={48} color="#666666" />
                  <CustomText
                    fontSize={getResponsiveFontSize(16)}
                    color="#666666"
                    style={{ marginTop: spacing.md, textAlign: 'center' }}
                  >
                    {TEXT_CONSTANTS.NO_LIVESTREAM}
                  </CustomText>
                </View>
              )}
            </View>
          )}

          {activeTab === TAB_KEYS.ABOUT && (
            <View style={{ paddingBottom: spacing.xl }}>
              <CustomText
                fontSize={getResponsiveFontSize(16)}
                fontWeight="600"
                color="#FFFFFF"
                style={{ marginBottom: spacing.md }}
              >
                {`${TEXT_CONSTANTS.ABOUT} ${creatorInfo.name}`}
              </CustomText>

              <CustomText
                fontSize={getResponsiveFontSize(14)}
                color="#CCCCCC"
                style={{ lineHeight: 22, marginBottom: spacing.lg }}
              >
                {creatorInfo.bio}
              </CustomText>

              <View
                style={{
                  backgroundColor: '#2A2A2A',
                  borderRadius: 8,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                }}
              >
                <CustomText
                  fontSize={getResponsiveFontSize(14)}
                  fontWeight="600"
                  color="#FFFFFF"
                  style={{ marginBottom: spacing.sm }}
                >
                  {TEXT_CONSTANTS.CHANNEL_STATISTICS}
                </CustomText>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: spacing.sm,
                  }}
                >
                  <CustomText fontSize={12} color="#CCCCCC">
                    {TEXT_CONSTANTS.TOTAL_VIDEOS_LABEL}
                  </CustomText>
                  <CustomText fontSize={12} color="#FFFFFF">
                    {creatorInfo.totalVideos}
                  </CustomText>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: spacing.sm,
                  }}
                >
                  <CustomText fontSize={12} color="#CCCCCC">
                    {TEXT_CONSTANTS.TOTAL_VIEWS_LABEL}
                  </CustomText>
                  <CustomText fontSize={12} color="#FFFFFF">
                    {formatViewCount(creatorInfo.totalViews)}
                  </CustomText>
                </View>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <CustomText fontSize={12} color="#CCCCCC">
                    {TEXT_CONSTANTS.JOINED_LABEL}
                  </CustomText>
                  <CustomText fontSize={12} color="#FFFFFF">
                    {creatorInfo.joinedDate}
                  </CustomText>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default CreatorProfile;
