import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from '../../components/Icon/Icon';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import CustomText from '../../components/CustomText/CustomText';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';
import { api } from '../../helpers/api/api';
import { customHeaders } from '../../helpers/api/apiConfig';
import axios from 'axios';

const { width: screenWidth } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
}

interface VideoItem {
  _ID?: string;
  id?: string;
  key?: string;
  videoKey?: string;
  title?: string;
  name?: string;
  description?: string;
  overview?: string;
  genreId?: string;
  genre?: string;
  year?: string;
  thumbnailUrl?: string;
  posterUrl?: string;
  duration?: string;
  views?: number;
  downloads?: number;
  spredShares?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const Search: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchSuggestion[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<SearchSuggestion[]>(
    [],
  );
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  // Mock categories with Spred theme colors
  useEffect(() => {
    setCategories([
      {
        id: '1',
        name: 'Action Movies',
        icon: 'local-fire-department',
        color: '#F45303',
      },
      { id: '2', name: 'Comedy', icon: 'star', color: '#D69E2E' },
      { id: '3', name: 'Drama', icon: 'favorite', color: '#FF5722' },
      { id: '4', name: 'Horror', icon: 'visibility', color: '#8B8B8B' },
      { id: '5', name: 'Romance', icon: 'favorite', color: '#FF5722' },
      { id: '6', name: 'Thriller', icon: 'trending-up', color: '#4CAF50' },
      { id: '7', name: 'Documentary', icon: 'book', color: '#2196F3' },
      { id: '8', name: 'Sci-Fi', icon: 'rocket-launch', color: '#FF9800' },
    ]);
  }, []);

  // Mock trending searches
  useEffect(() => {
    setTrendingSearches([
      { id: '1', text: 'Action Movies', type: 'popular' },
      { id: '2', text: 'Comedy Shows', type: 'popular' },
      { id: '3', text: 'Romance Movies', type: 'popular' },
      { id: '4', text: 'Thriller Series', type: 'popular' },
      { id: '5', text: 'Documentary Films', type: 'popular' },
    ]);
  }, []);

  // Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const searches = await getDataJson('RecentSearches');
      if (searches) {
        setRecentSearches(searches);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const newSearch: SearchSuggestion = {
        id: Date.now().toString(),
        text: query,
        type: 'recent',
      };

      const updated = [newSearch, ...recentSearches.slice(0, 9)];
      setRecentSearches(updated);
      await storeDataJson('RecentSearches', updated);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await storeDataJson('RecentSearches', []);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error clearing recent searches:', error);
    }
  };

  // Get user token
  useEffect(() => {
    const getUserToken = async () => {
      try {
        const user = await getDataJson('User');
        setUserToken(user?.token || null);
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error getting user token:', error);
      }
    };
    getUserToken();
  }, []);

  // Search functionality
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowSuggestions(true);
        return;
      }

      setLoading(true);
      setShowSuggestions(false);

      try {
        const config = { headers: customHeaders(userToken || '') };
        const response = await axios.get(api.getAllMovies, config);
        let allMovies = response?.data?.data || [];

        // Filter by search query
        const filtered = allMovies.filter((item: VideoItem) => {
          const searchLower = query.toLowerCase();
          const title = (item.title || item.name || '').toLowerCase();
          const description = (
            item.description ||
            item.overview ||
            ''
          ).toLowerCase();
          const genre = (item.genreId || item.genre || '').toLowerCase();

          return (
            title.includes(searchLower) ||
            description.includes(searchLower) ||
            genre.includes(searchLower)
          );
        });

        setSearchResults(filtered);
        saveRecentSearch(query);
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Search error:', error);
        // Mock data for demo
        const mockResults: VideoItem[] = [
          {
            id: '1',
            title: 'Search Result Movie',
            description: 'A great movie found in search',
            genre: 'Action',
            year: '2023',
            views: 15420,
            downloads: 3200,
            spredShares: 850,
          },
        ];
        setSearchResults(mockResults);
      } finally {
        setLoading(false);
      }
    },
    [userToken],
  );

  // Effect to trigger search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setShowSuggestions(true);
    }
  }, [searchQuery, performSearch]);

  const handleSearchPress = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
  };

  const handleCategoryPress = (category: Category) => {
    setSearchQuery(category.name);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(true);
  };

  const handleMoviePress = (movie: VideoItem) => {
    navigation.navigate('PlayVideos', { item: movie });
  };

  const renderSearchItem = ({ item }: { item: VideoItem }) => (
    <TouchableOpacity
      style={[
        styles.searchItem,
        {
          backgroundColor: colors.legacy.surface,
          borderBottomColor: colors.legacy.border,
        },
      ]}
      onPress={() => handleMoviePress(item)}
    >
      <Image
        source={{
          uri:
            item.thumbnailUrl ||
            item.posterUrl ||
            'https://via.placeholder.com/100x150',
        }}
        style={styles.movieThumbnail}
      />
      <View style={styles.movieInfo}>
        <CustomText
          fontSize={16}
          fontWeight="600"
          color={colors.legacy.textPrimary}
          numberOfLines={2}
        >
          {item.title || item.name || 'Untitled'}
        </CustomText>
        <CustomText
          fontSize={14}
          color={colors.legacy.textSecondary}
          style={styles.movieDetails}
        >
          {item.year || 'N/A'} • {item.genreId || item.genre || 'N/A'}
        </CustomText>
        {item.duration && (
          <CustomText fontSize={12} color={colors.legacy.textSecondary}>
            Duration: {item.duration}
          </CustomText>
        )}
        <View style={styles.engagementMetrics}>
          <View style={styles.metric}>
            <Icon name="eye" size={14} color={colors.legacy.textSecondary} />
            <CustomText fontSize={12} color={colors.legacy.textSecondary}>
              {item.views?.toLocaleString() || '0'}
            </CustomText>
          </View>
          <View style={styles.metric}>
            <Icon
              name="download"
              size={14}
              color={colors.legacy.textSecondary}
            />
            <CustomText fontSize={12} color={colors.legacy.textSecondary}>
              {item.downloads?.toLocaleString() || '0'}
            </CustomText>
          </View>
          <View style={styles.metric}>
            <Icon
              name="sharealt"
              size={14}
              color={colors.legacy.textSecondary}
            />
            <CustomText fontSize={12} color={colors.legacy.textSecondary}>
              {item.spredShares?.toLocaleString() || '0'}
            </CustomText>
          </View>
        </View>
      </View>
      <Icon name="playcircleo" size={24} color="#F45303" />
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: colors.legacy.background }]}
    >
      {/* Search Header */}
      <View
        style={[
          styles.searchHeader,
          { backgroundColor: colors.legacy.surface },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.legacy.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: '#2A2A2A' }]}>
          <Icon name="search" size={20} color="#8B8B8B" />
          <TextInput
            style={[styles.searchInput, { color: colors.legacy.textPrimary }]}
            placeholder="Search movies, genres, actors..."
            placeholderTextColor="#8B8B8B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSuggestions(true)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch}>
              <Icon name="close" size={20} color="#8B8B8B" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F45303" />
          <CustomText fontSize={16} color={colors.legacy.textSecondary}>
            Searching...
          </CustomText>
        </View>
      ) : showSuggestions && searchQuery === '' ? (
        <ScrollView style={styles.suggestionsContainer}>
          {/* Categories */}
          <View style={styles.section}>
            <CustomText
              fontSize={18}
              fontWeight="600"
              color={colors.legacy.textPrimary}
              style={styles.sectionTitle}
            >
              Browse by Category
            </CustomText>
            <View style={styles.categoryGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress(category)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <MaterialIcons
                      name={category.icon}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <CustomText
                    fontSize={12}
                    fontWeight="500"
                    color={colors.legacy.textPrimary}
                    textAlign="center"
                    numberOfLines={2}
                  >
                    {category.name}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <CustomText
                  fontSize={18}
                  fontWeight="600"
                  color={colors.legacy.textPrimary}
                >
                  Recent Searches
                </CustomText>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <CustomText fontSize={14} color="#F45303">
                    Clear All
                  </CustomText>
                </TouchableOpacity>
              </View>
              {recentSearches.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSearchPress(item)}
                >
                  <Icon
                    name="clockcircleo"
                    size={20}
                    color={colors.legacy.textSecondary}
                  />
                  <CustomText
                    fontSize={16}
                    color={colors.legacy.textPrimary}
                    style={styles.suggestionText}
                  >
                    {item.text}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Trending Searches */}
          <View style={styles.section}>
            <CustomText
              fontSize={18}
              fontWeight="600"
              color={colors.legacy.textPrimary}
              style={styles.sectionTitle}
            >
              Trending Searches
            </CustomText>
            {trendingSearches.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => handleSearchPress(item)}
              >
                <Icon name="fire" size={20} color="#F45303" />
                <CustomText
                  fontSize={16}
                  color={colors.legacy.textPrimary}
                  style={styles.suggestionText}
                >
                  {item.text}
                </CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={item =>
            item._ID ||
            item.key ||
            item.videoKey ||
            item.id?.toString() ||
            Math.random().toString()
          }
          contentContainerStyle={styles.resultsContainer}
          ListEmptyComponent={
            searchQuery ? (
              <View style={styles.emptyContainer}>
                <Icon
                  name="search"
                  size={64}
                  color={colors.legacy.textSecondary}
                />
                <CustomText
                  fontSize={18}
                  fontWeight="600"
                  color={colors.legacy.textPrimary}
                  style={styles.emptyText}
                >
                  No results found
                </CustomText>
                <CustomText
                  fontSize={14}
                  color={colors.legacy.textSecondary}
                  style={styles.emptySubText}
                >
                  Try different keywords
                </CustomText>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryItem: {
    width: (screenWidth - 48) / 2 - 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryCard: {
    width: (screenWidth - 48) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    textAlign: 'center',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  suggestionText: {
    marginLeft: 12,
  },
  resultsContainer: {
    padding: 16,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  movieThumbnail: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
  },
  movieDetails: {
    marginTop: 4,
    marginBottom: 8,
  },
  engagementMetrics: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Search;
