import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { api } from '../../helpers/api/api';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';
import { cleanMovieTitle } from '../../helpers/utils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with padding

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

interface Category {
  _ID: string;
  name: string;
}

interface User {
  token?: string;
  id?: string;
}

type CategoryScreenRouteProps = {
  CategoryScreen: {
    categoryName: string;
    categoryId?: string;
  };
};

const CategoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<CategoryScreenRouteProps, 'CategoryScreen'>>();
  const { categoryName, categoryId } = route.params || {};

  const [content, setContent] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User>({});

  const token = user?.token;

  useEffect(() => {
    getStoredUserData();
  }, []);

  useEffect(() => {
    if (token) {
      loadContent();
      loadCategories();
    }
  }, [token, selectedCategory]);

  const getStoredUserData = async () => {
    try {
      const userData = (await getDataJson('User')) as User | null;
      setUser(userData || {});
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading user data:', error);
    }
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

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(api.getAllMovies, config);
      let allContent = response?.data?.data || [];

      // Filter content based on the category
      if (categoryName && categoryName !== 'all') {
        // If we have a specific categoryId, use that for filtering
        if (categoryId) {
          allContent = allContent.filter(
            (item: ContentItem) => item.categoryId === categoryId,
          );
        } else {
          // Otherwise, find the category by name and filter
          const cachedCategories = (await getDataJson('categories')) as
            | Category[]
            | null;
          if (cachedCategories) {
            const targetCategory = cachedCategories.find(
              cat => cat.name.toLowerCase() === categoryName.toLowerCase(),
            );
            if (targetCategory) {
              allContent = allContent.filter(
                (item: ContentItem) => item.categoryId === targetCategory._ID,
              );
            }
          }
        }
      }

      // Further filter by selected subcategory if needed
      if (selectedCategory !== 'all') {
        const targetCategory = categories.find(
          cat => cat.name.toLowerCase() === selectedCategory.toLowerCase(),
        );
        if (targetCategory) {
          allContent = allContent.filter(
            (item: ContentItem) => item.categoryId === targetCategory._ID,
          );
        }
      }

      setContent(allContent);

      // Cache the data
      await storeDataJson('category_content', allContent);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading content:', error);
      // Try to load cached data
      try {
        const cached = (await getDataJson('category_content')) as
          | ContentItem[]
          | null;
        if (cached) {
          setContent(cached);
        }
      } catch (cacheError) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error loading cached content:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await axios.get(api.getAllCategories, config);
      setCategories(response?.data?.data || []);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading categories:', error);
      // Try to load cached categories
      try {
        const cached = (await getDataJson('categories')) as Category[] | null;
        if (cached) {
          setCategories(cached);
        }
      } catch (cacheError) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error loading cached categories:', cacheError);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadContent(), loadCategories()]);
    setRefreshing(false);
  };

  const handleContentPress = (item: ContentItem) => {
    navigation.navigate('PlayVideos', { item });
  };

  const getSubcategories = () => {
    // For now, we'll show all categories as potential subcategories
    // In a real app, you might want to have a hierarchical category system
    const subcategories = ['all'];

    if (categories.length > 0) {
      // Add categories that are related or similar to the main category
      categories.forEach(cat => {
        if (cat.name.toLowerCase() !== categoryName?.toLowerCase()) {
          subcategories.push(cat.name);
        }
      });
    }

    return subcategories.slice(0, 6); // Limit to 6 subcategories
  };

  const renderContentItem = ({ item }: { item: ContentItem }) => (
    <TouchableOpacity
      style={styles.contentItem}
      onPress={() => handleContentPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.thumbnail}
          resizeMode="cover"
        />

        {/* Premium Badge */}
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <MaterialIcons name="star" size={12} color="#FFD700" />
          </View>
        )}

        {/* Duration */}
        {item.duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.contentInfo}>
        <Text style={styles.contentTitle} numberOfLines={2}>
          {cleanMovieTitle(item.title)}
        </Text>
        <View style={styles.contentMeta}>
          {item.year && <Text style={styles.metaText}>{item.year}</Text>}
          {item.rating && (
            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="movie" size={64} color="#666666" />
      <Text style={styles.emptyTitle}>No Content Available</Text>
      <Text style={styles.emptyText}>
        We couldn't find any content in this category. Try refreshing or check
        back later.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <MaterialIcons name="refresh" size={20} color="#F45303" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F45303" />
        <Text style={styles.loadingText}>
          Loading {categoryName} content...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            {content.length} {content.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {/* Subcategory Filter */}
      {getSubcategories().length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {getSubcategories().map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === category &&
                    styles.filterButtonTextActive,
                ]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content Grid */}
      <FlatList
        data={content}
        renderItem={renderContentItem}
        keyExtractor={item => item._ID}
        numColumns={2}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F45303"
            colors={['#F45303']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        columnWrapperStyle={styles.row}
      />
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B8B8B',
  },
  filterContainer: {
    maxHeight: 60,
    backgroundColor: '#1A1A1A',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#F45303',
    borderColor: '#F45303',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#8B8B8B',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  contentItem: {
    width: CARD_WIDTH,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333333',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  contentInfo: {
    padding: 12,
  },
  contentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 8,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#8B8B8B',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#FFD700',
    marginLeft: 2,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    fontSize: 16,
    color: '#8B8B8B',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F45303',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#F45303',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CategoryScreen;
