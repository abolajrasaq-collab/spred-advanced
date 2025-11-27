/* eslint-disable react-native/no-inline-styles */
import {
  StyleSheet,
  Text,
  ScrollView,
  Image,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Pressable,
  TouchableOpacity,
} from 'react-native';
// Import TouchableOpacity for optimized touch interactions
// import TouchableOpacity from '../../components/TouchableOpacity/TouchableOpacity';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import SimpleHeader from '../../components/Header/SimpleHeader';
import ModernNavigationTabs from '../../components/ModernNavigationTabs/ModernNavigationTabs';
import axios from 'axios';
import { api } from '../../helpers/api/api';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';
import { cleanMovieTitle } from '../../helpers/utils';
import logger from '../../utils/logger';

// Simple debounce function
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// TypeScript interfaces
interface User {
  token?: string;
  id?: string;
}

interface UserInfo {
  // Add user info properties as needed
  [key: string]: any;
}

interface Category {
  _ID: string;
  name: string;
}

interface ContentItem {
  _ID: string;
  title: string;
  categoryId: string;
  thumbnailUrl: string;
  rating?: number;
  year?: string;
  duration?: string;
  isLive?: boolean;
  isPremium?: boolean;
  isTrending?: boolean;
  views?: number;
  createdAt?: string;
  releaseDate?: string;
  contentTypeId?: string;
}

type RootStackParamList = {
  PlayVideos: { item: ContentItem };
  LiveStream: {
    streamUrl: string;
    channelInfo: any;
  };
  LiveCategory: undefined;
  CategoryScreen: {
    categoryName: string;
    categoryId?: string;
  };
  [key: string]: any;
};
import SimpleHeroCarousel from '../../components/SimpleHeroCarousel/SimpleHeroCarousel';
import CategorySection from '../../components/CategorySection/CategorySection';

import SleekButton from '../../components/SleekButton/SleekButton';

interface HeroItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  isLive?: boolean;
}
import {
  MemoryManager,
  ArrayUtils,
  performDebounced,
} from '../../utils/memoryUtils';
import PerformanceManager from '../../services/PerformanceManager';

const Homepage = ({ route }: { route: any }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isAuthenticated, token, user } = useSelector(
    (state: RootState) => state.auth,
  );

  // Debug logging
  logger.info('🔍 Homepage Auth State:', {
    isAuthenticated,
    token: !!token,
    user: !!user,
  });
  const [moviearray, setMovieArray] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [category, setCategory] = useState('all');
  const [contentType, setContentType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
    const id = user?.id;

  // Initialize performance optimization
  React.useEffect(() => {
    const performanceManager = PerformanceManager.getInstance();
    performanceManager.optimizeForHeavyComponent('Homepage');

    // Memory cleanup on unmount
    return () => {
      MemoryManager.performCleanup();
    };
  }, []);

  useEffect(() => {
    // OPTIMIZED: Load cached data first for instant display, then fetch fresh data
    loadCachedDataFirst();

    // Only make API calls if we are authenticated
    if (isAuthenticated && token) {
      // OPTIMIZED: Remove artificial delays for better performance
      get();
      getAllCategories();
      getAllContentTypes();
      getWalletDetails();
    } else {
      // If not authenticated, stop loading after a reasonable timeout
      const timer = setTimeout(() => {
        setLoading(false);
        setCategoriesLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, token]);

  const loadCachedDataFirst = async () => {
    try {
      // Load user data immediately
      await getStoredUserData();

      // Load cached content for instant display
      const cachedContent = (await getDataJson('homepage_content')) as
        | ContentItem[]
        | null;
      const cachedCategories = (await getDataJson('categories')) as
        | Category[]
        | null;

      if (cachedContent && cachedContent.length > 0) {
        setMovieArray(cachedContent);
        setLoading(false);
        // DISABLED FOR PERFORMANCE
        // logger.info('✅ Loaded cached content for instant display');
      }

      if (cachedCategories && cachedCategories.length > 0) {
        setCats(cachedCategories);
        setCategoriesLoading(false);
        // DISABLED FOR PERFORMANCE
        // logger.info('✅ Loaded cached categories for instant display');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.warn('Error loading cached data:', error);
    }
  };

  const getStoredUserData = async () => {
    const gotten = (await getDataJson('User')) as User | null;
    const gotten2 = (await getDataJson('UserInfo')) as UserInfo | null;
    // Note: setUser is not defined in this component, using user from Redux
    setUserInfo(gotten2);
  };

  const config = {
    headers: {
      mobileAppByPassIVAndKey:
        'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
      username: 'SpredMediaAdmin',
      password: 'SpredMediaLoveSpreding@2023',
      Authorization: `Bearer ${token}`,
    },
  };

  const getWalletDetails = async () => {
    try {
      // Make wallet call non-blocking and with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000),
      );

      const walletPromise = axios.get(
        `${api.getWalletDetails}/${id && id}`,
        config,
      );

      const response = await Promise.race([walletPromise, timeoutPromise]);
      storeDataJson('WalletDetails', (response as any)?.data?.data);
      // DISABLED FOR PERFORMANCE
      // logger.info('✅ Wallet details loaded');
    } catch (error) {
      // DISABLED FOR PERFORMANCE - logger.warn('⚠️ Wallet details skipped (non-critical):', error.message || error);
    }
  };
  const getAllCategories = async () => {
    try {
      // Only set loading if we don't have cached data
      if (cats.length === 0) {
        setCategoriesLoading(true);
      }

      let response = await axios.get(`${api.getAllCategories}`, config);
      setCats(response?.data?.data || []);
      // Cache the data
      await storeDataJson('categories', response?.data?.data || []);
      // DISABLED FOR PERFORMANCE
      // logger.info('✅ Fresh categories loaded and cached');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.warn('Error fetching categories:', error);
      // Try to get cached data
      const cached = (await getDataJson('categories')) as Category[] | null;
      if (cached && cached.length > 0) {
        setCats(cached);
        // DISABLED FOR PERFORMANCE
        // logger.info('✅ Using cached categories due to API error');
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  const getAllContentTypes = async () => {
    try {
      let response = await axios.get(`${api.getAllContentTypes}`, config);
      setContentTypes(response?.data?.data);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.warn('Error fetching content types:', error);
    }
  };

  const get = async () => {
    try {
      // Only set loading if we don't have cached data
      if (moviearray.length === 0) {
        setLoading(true);
      }

      let response = await axios.get(api.getAllMovies, config);
      const movies = response?.data?.data || [];
      
      // Debug: Log first few movies to check thumbnailUrl
      console.log('🎬 Movies data sample:', movies.slice(0, 3).map(m => ({
        title: m.title,
        thumbnailUrl: m.thumbnailUrl,
        hasThumbnail: !!m.thumbnailUrl,
        thumbnailUrlType: typeof m.thumbnailUrl,
        thumbnailUrlLength: m.thumbnailUrl?.length || 0
      })));
      
      // Validate and fix thumbnail URLs before setting
      const validatedMovies = movies.map(movie => ({
        ...movie,
        thumbnailUrl: movie.thumbnailUrl && movie.thumbnailUrl.trim() !== '' && movie.thumbnailUrl.startsWith('http')
          ? movie.thumbnailUrl
          : 'https://via.placeholder.com/400x250/333333/FFFFFF?text=No+Image'
      }));

      setMovieArray(validatedMovies);
      // Cache the validated data
      await storeDataJson('homepage_content', validatedMovies);
      // DISABLED FOR PERFORMANCE
      // logger.info('✅ Fresh content loaded and cached');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // logger.warn('Error fetching movies:', error);
      // Try to get cached data
      const cached = (await getDataJson('homepage_content')) as
        | ContentItem[]
        | null;
      if (cached && cached.length > 0) {
        setMovieArray(cached);
        // DISABLED FOR PERFORMANCE
        // logger.info('✅ Using cached content due to API error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Optimized debounced refresh callback to prevent excessive API calls
  const onRefresh = useCallback(
    performDebounced(async () => {
      setRefreshing(true);

      // Perform memory cleanup before refresh
      MemoryManager.checkMemoryUsage();

      await Promise.all([get(), getAllCategories()]);

      // Cleanup after refresh
      MemoryManager.performCleanup();
      setRefreshing(false);
    }, 1000),
    [get, getAllCategories],
  );

  // Prepare hero carousel data (featured content) - Prioritize specific titles
  const featuredTitles = ['AKITI', 'BEFORE SEVEN', 'COMPLETE DOSAGE'];

  const heroData = useMemo(() => {
    // Find featured movies first
    const featuredMovies = featuredTitles
      .map(title =>
        moviearray.find(item =>
          cleanMovieTitle(item.title)
            .toUpperCase()
            .includes(title.toUpperCase()),
        ),
      )
      .filter(Boolean) // Remove undefined entries
      .slice(0, 3); // Max 3 featured

    // Get remaining movies for hero section
    const remainingMovies = moviearray
      .filter(
        item =>
          !featuredTitles.some(title =>
            cleanMovieTitle(item.title)
              .toUpperCase()
              .includes(title.toUpperCase()),
          ),
      )
      .slice(0, 5 - featuredMovies.length);

    // Combine featured movies first, then remaining movies
    const heroItems = [...featuredMovies, ...remainingMovies].map(item => ({
      id: item._ID,
      title: cleanMovieTitle(item.title),
      subtitle: cats.find(c => c._ID === item.categoryId)?.name || 'Featured',
      imageUrl: item.thumbnailUrl || 'https://via.placeholder.com/400x250/333333/FFFFFF?text=No+Image',
      isLive: item.isLive,
      isFeatured: featuredTitles.some(title =>
        cleanMovieTitle(item.title).toUpperCase().includes(title.toUpperCase()),
      ),
    }));
    
    // Debug: Log hero data to check imageUrl
      console.log('🎯 Hero data sample:', heroItems.slice(0, 2).map(h => ({
        title: h.title,
        imageUrl: h.imageUrl,
        hasImage: !!h.imageUrl,
        imageUrlType: typeof h.imageUrl,
        imageUrlLength: h.imageUrl?.length || 0
      })));
    
    return heroItems;
  }, [moviearray, cats, featuredTitles]);

  // Memoized expensive content filtering operation with memory optimization
  const filteredContent = useMemo(() => {
    // Memory check before expensive operation
    MemoryManager.checkMemoryUsage();

    if (contentType === 'all' || currentTab === 0) {
      return moviearray;
    }

    // Use optimized filtering for large arrays
    return ArrayUtils.filterWithLimit(
      moviearray,
      (item: any) => {
        // Check if item matches the selected content type
        if (contentType === 'trending-now') {
          return item.isTrending || item.views > 1000; // Assuming these fields exist
        }
        if (contentType === 'new-releases') {
          const itemDate = new Date(item.createdAt || item.releaseDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return itemDate > thirtyDaysAgo;
        }
        if (contentType === 'top-rated') {
          return item.rating >= 4.5; // Assuming rating is out of 5
        }
        // For regular content types, check contentType field
        return item.contentTypeId === contentType;
      },
      100,
    ); // Limit results to prevent memory spikes
  }, [moviearray, contentType, currentTab]);

  // Memoized expensive categorized content calculation with memory optimization
  const categorizedContent = useMemo(() => {
    // Memory check before expensive operation
    MemoryManager.checkMemoryUsage();

    console.log('📂 Building categorized content...');
    console.log('📂 Available categories:', cats.length, cats.map(c => ({ name: c.name, _ID: c._ID })));
    console.log('📂 Filtered content length:', filteredContent.length);

    // Process categories in chunks to prevent memory spikes
    const categoryChunks = ArrayUtils.chunk(cats, 5);
    let allSections: any[] = [];

    for (const chunk of categoryChunks) {
      const chunkSections = chunk.map(category => {
        const categoryItems = ArrayUtils.filterWithLimit(
          filteredContent,
          (item: any) => item.categoryId === category._ID,
          10, // Limit to 10 items per category
        );

        console.log(`📂 Category "${category.name}" (${category._ID}): ${categoryItems.length} items`);

        return {
          title: category.name,
          data: categoryItems.map(item => {
            const imageUrl = item.thumbnailUrl || 'https://via.placeholder.com/120x200/333333/FFFFFF?text=No+Image';
            console.log(`  📂 Item "${item.title}": thumbnailUrl = ${imageUrl.substring(0, 50)}...`);
            return {
              id: item._ID,
              title: cleanMovieTitle(item.title),
              imageUrl: imageUrl,
              rating: item.rating,
              year: item.year,
              duration: item.duration,
              isLive: item.isLive,
              isPremium: item.isPremium,
            };
          }),
        };
      });

      allSections = [...allSections, ...chunkSections];
    }

    // Filter and sort with memory efficiency
    const finalSections = allSections
      .filter(section => section.data.length > 0)
      .sort((a, b) => {
        // Prioritize SHORT FILMS section to appear early (after trending content)
        if (
          a.title.toUpperCase().includes('SHORT') &&
          a.title.toUpperCase().includes('FILM')
        ) {
          return -1;
        }
        if (
          b.title.toUpperCase().includes('SHORT') &&
          b.title.toUpperCase().includes('FILM')
        ) {
          return 1;
        }

        // Keep other categories in their original order
        return 0;
      });

    console.log('📂 Final categorized sections:', finalSections.map(s => `${s.title}: ${s.data.length} items`));
    return finalSections;
  }, [cats, filteredContent]);

  // Create LIVE section with rich provider information
  const liveContent = [
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
        startTime: new Date().toISOString(),
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
        startTime: new Date().toISOString(),
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
        startTime: new Date().toISOString(),
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
      tags: ['live', 'news', 'breaking', 'international', 'current affairs'],
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
        startTime: new Date().toISOString(),
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
        startTime: new Date().toISOString(),
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
        startTime: new Date().toISOString(),
        duration: 'LIVE',
      },
    },
  ];

  const handleContentPress = useCallback(
    (id: string) => {
      const item = moviearray.find(m => m._ID === id);
      if (item) {
        console.log('🎬 Navigating to video:', item.title, 'Thumbnail:', item.thumbnailUrl);
        navigation.navigate('PlayVideos', { item });
      }
    },
    [moviearray, navigation],
  );

  const handleHeroItemPress = useCallback(
    (item: HeroItem) => {
      handleContentPress(item.id);
    },
    [handleContentPress],
  );

  const handleLivePress = useCallback(
    (liveId: string) => {
      const liveStream = liveContent.find(stream => stream.id === liveId);
      if (liveStream && liveStream.isLive) {
        navigation.navigate('LiveStream', {
          streamUrl: liveStream.streamUrl,
          channelInfo: {
            id: liveStream.id,
            title: liveStream.title,
            category: liveStream.category,
            viewerCount: liveStream.viewerCount,
            isLive: liveStream.isLive,
            description: liveStream.description,
            tags: liveStream.tags,
            provider: liveStream.provider,
            streamingDetails: liveStream.streamingDetails,
          },
        });
      } else {
        Alert.alert('Stream Offline', 'This channel is currently offline.');
      }
    },
    [liveContent, navigation],
  );

  const handleDownloadPress = useCallback(
    (heroItem: any) => {
      const item = moviearray.find(m => m._ID === heroItem.id);
      if (item) {
        // Navigate to the PlayVideos screen
        navigation.navigate('PlayVideos', { item });
      }
    },
    [moviearray, navigation],
  );

  const handleMorePress = useCallback(
    (categoryName: string) => {
      // Find the category ID from the categories array
      const category = cats.find(
        cat => cat.name.toLowerCase() === categoryName.toLowerCase(),
      );

      navigation.navigate('CategoryScreen', {
        categoryName,
        categoryId: category?._ID,
      });
    },
    [cats, navigation],
  );

  const handleModernNavChange = useCallback((current, catid) => {
    setCurrentTab(current);
    setContentType(catid);
  }, []);

  const handleLiveCategoryPress = useCallback(() => {
    navigation.navigate('LiveCategory');
  }, [navigation]);

  // OPTIMIZED: Only show loading if we have no cached data and are authenticated
  if (
    (loading && moviearray.length === 0 && isAuthenticated) ||
    (categoriesLoading && cats.length === 0 && isAuthenticated)
  ) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#353535',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={{ color: '#ffffff', marginTop: 10, fontSize: 16 }}>
          Loading content...
        </Text>
      </SafeAreaView>
    );
  }

  // Show login prompt if not authenticated and no cached data
  if (!isAuthenticated && moviearray.length === 0 && cats.length === 0) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#353535',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
        }}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 18,
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          Welcome to Spred
        </Text>
        <Text
          style={{
            color: '#cccccc',
            fontSize: 14,
            marginBottom: 30,
            textAlign: 'center',
          }}
        >
          Please sign in to access content
        </Text>
        <SleekButton
          title="Sign In"
          onPress={() => navigation.navigate('SignIn')}
          backgroundColor="#F45303"
          textColor="#FFFFFF"
          size="medium"
          variant="primary"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: '#353535' }}
      edges={['bottom']}
    >
      {/* Simple Header */}
      <SimpleHeader />

      <ScrollView
        style={{ flex: 1, backgroundColor: '#353535' }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F45303"
          />
        }
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        bouncesZoom={false}
        overScrollMode="never"
      >
        {/* Modern Navigation Tabs */}
        <ModernNavigationTabs
          contentTypes={contentTypes}
          currentTab={currentTab}
          onChange={handleModernNavChange}
          cats={cats}
          changeCat={cat => {
            setCategory(cat);
          }}
        />

        {/* Hero Carousel */}
        {heroData.length > 0 && (
          <SimpleHeroCarousel
            data={heroData}
            onItemPress={handleHeroItemPress}
            onDownloadPress={handleDownloadPress}
          />
        )}

        
        {/* SHORT FILMS Section - Prioritized after hero content */}
        {(() => {
          const shortFilmsSection = categorizedContent.find(
            section =>
              section.title.toUpperCase().includes('SHORT') &&
              section.title.toUpperCase().includes('FILM'),
          );
          return shortFilmsSection ? (
            <CategorySection
              key="short-films-priority"
              title={shortFilmsSection.title}
              data={shortFilmsSection.data}
              onContentPress={handleContentPress}
              onMorePress={() => handleMorePress(shortFilmsSection.title)}
            />
          ) : null;
        })()}

        {/* LIVE Section - Moved to after SHORT FILMS */}
        <View style={{ marginTop: 4 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginBottom: 12,
              backgroundColor: '#1E1E1E',
              borderTopWidth: 1,
              borderTopColor: '#333333',
              borderBottomWidth: 1,
              borderBottomColor: '#333333',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 18,
                  fontWeight: 'bold',
                  marginRight: 8,
                }}
              >
                LIVE
              </Text>
              <View
                style={{
                  backgroundColor: '#F45303',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
              >
                <Text
                  style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}
                >
                  LIVE
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleLiveCategoryPress}
              style={{ paddingVertical: 4, paddingHorizontal: 8 }}
              accessibilityLabel="See all live channels"
              accessibilityHint="Navigate to live category screen"
            >
              <Text
                style={{ color: '#F45303', fontSize: 14, fontWeight: '600' }}
              >
                SEE ALL
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
            decelerationRate="fast"
            snapToInterval={292}
            snapToAlignment="start"
          >
            {liveContent.map(item => (
              <TouchableOpacity
                key={item.id}
                style={{ marginRight: 12, width: 280 }}
                onPress={() => handleLivePress(item.id)}
                accessibilityLabel={`Watch ${item.title} live stream`}
                accessibilityHint={`Open ${item.category} live channel`}
              >
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{
                      width: 280,
                      height: 160,
                      borderRadius: 12,
                      backgroundColor: '#2A2A2A',
                    }}
                  />
                  {/* Live Badge */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      backgroundColor: '#E53E3E',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#FFFFFF',
                        marginRight: 4,
                      }}
                    />
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      LIVE
                    </Text>
                  </View>
                  {/* Viewer Count */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 4,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                      {item.viewerCount.toLocaleString()} watching
                    </Text>
                  </View>
                  {/* Title Overlay */}
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: 12,
                      borderBottomLeftRadius: 12,
                      borderBottomRightRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 'bold',
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      style={{ color: '#CCCCCC', fontSize: 12, marginTop: 2 }}
                    >
                      {item.category}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Category Sections - Exclude SHORT FILMS as it's already shown above */}
        {(() => {
          const otherSections = categorizedContent.filter(
            section =>
              !(
                section.title.toUpperCase().includes('SHORT') &&
                section.title.toUpperCase().includes('FILM')
              ),
          );

          console.log('📂 Rendering category sections:', otherSections.map(s => `${s.title}: ${s.data.length} items`));

          return otherSections.map((section, index) => (
            <CategorySection
              key={index}
              title={section.title}
              data={section.data}
              onContentPress={handleContentPress}
              onMorePress={() => handleMorePress(section.title)}
            />
          ));
        })()}

        {/* Bottom padding for tab bar - increased to ensure content doesn't go behind tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>


      {/* Multi-Protocol P2P Test Modal */}
      
    </SafeAreaView>
  );
};

export default Homepage;
