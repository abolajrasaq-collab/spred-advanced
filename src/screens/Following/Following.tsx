import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainParamsList } from '../../../@types/navigation';

import CustomText from '../../components/CustomText/CustomText';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import { FollowingService, FollowData } from '../../services/FollowingService';

type FollowingNavigationProp = NativeStackNavigationProp<MainParamsList>;

const Following = () => {
  const navigation = useNavigation<FollowingNavigationProp>();
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  const [followingList, setFollowingList] = useState<FollowData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Responsive design helpers
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 380;
  const isMediumScreen = screenWidth < 600;

  // Responsive avatar size
  const getAvatarSize = () => {
    if (isSmallScreen) {
      return 40;
    }
    return 50;
  };

  // Responsive spacing adjustments
  const getResponsiveSpacing = (baseSpacing: number) => {
    if (isSmallScreen) {
      return baseSpacing * 0.8;
    }
    if (isMediumScreen) {
      return baseSpacing * 0.9;
    }
    return baseSpacing;
  };

  // Responsive text sizes
  const getResponsiveFontSize = (baseSize: number) => {
    if (isSmallScreen) {
      return baseSize * 0.85;
    }
    if (isMediumScreen) {
      return baseSize * 0.9;
    }
    return baseSize;
  };

  useEffect(() => {
    loadFollowingList();
  }, []);

  const loadFollowingList = async () => {
    try {
      setLoading(true);
      const following = await FollowingService.getFollowingList();
      setFollowingList(following);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading following list:', error);
      Alert.alert('Error', 'Failed to load following list');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (creatorId: string, creatorName: string) => {
    Alert.alert(
      'Unfollow Creator',
      `Are you sure you want to unfollow ${creatorName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfollow',
          style: 'destructive',
          onPress: async () => {
            const success = await FollowingService.unfollowCreator(creatorId);
            if (success) {
              // Remove from local state
              setFollowingList(prev =>
                prev.filter(item => item.creatorId !== creatorId),
              );
              Alert.alert('Success', `Unfollowed ${creatorName}`);
            } else {
              Alert.alert('Error', 'Failed to unfollow creator');
            }
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFollowingList();
    setRefreshing(false);
  };

  const renderFollowingItem = ({ item }: { item: FollowData }) => {
    const avatarSize = getAvatarSize();

    return (
      <View
        style={[
          styles.creatorItem,
          {
            backgroundColor: '#2A2A2A',
            padding: getResponsiveSpacing(16),
          },
        ]}
      >
        <View style={styles.creatorInfo}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image
                source={{ uri: item.avatar }}
                style={[
                  styles.avatar,
                  { width: avatarSize, height: avatarSize },
                ]}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: '#F45303',
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: avatarSize / 2,
                  },
                ]}
              >
                <CustomText
                  fontSize={getResponsiveFontSize(18)}
                  fontWeight="700"
                  color="#FFFFFF"
                >
                  {item.creatorName.charAt(0).toUpperCase()}
                </CustomText>
              </View>
            )}
          </View>

          <View style={styles.creatorDetails}>
            <CustomText
              fontSize={getResponsiveFontSize(16)}
              fontWeight="600"
              color="#FFFFFF"
              style={{ marginBottom: 4 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.creatorName}
            </CustomText>
            <CustomText
              fontSize={getResponsiveFontSize(12)}
              color="#CCCCCC"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Followed {new Date(item.followedAt).toLocaleDateString()}
            </CustomText>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.unfollowButton,
            {
              backgroundColor: 'rgba(244, 83, 3, 0.1)',
              paddingHorizontal: getResponsiveSpacing(12),
              paddingVertical: getResponsiveSpacing(8),
            },
          ]}
          onPress={() => handleUnfollow(item.creatorId, item.creatorName)}
        >
          <MaterialIcons
            name="person-remove"
            size={getResponsiveFontSize(16)}
            color="#F45303"
          />
          <CustomText
            fontSize={getResponsiveFontSize(12)}
            fontWeight="600"
            color="#F45303"
            style={{ marginLeft: getResponsiveSpacing(4) }}
          >
            Unfollow
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="people-outline" size={64} color="#666666" />
      <CustomText
        fontSize={18}
        fontWeight="600"
        color="#FFFFFF"
        style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}
      >
        No Following Yet
      </CustomText>
      <CustomText
        fontSize={14}
        color="#CCCCCC"
        style={{ textAlign: 'center', marginBottom: spacing.xl }}
      >
        Follow creators to see their latest content and get notified about new
        uploads.
      </CustomText>
      <TouchableOpacity
        style={[styles.exploreButton, { backgroundColor: '#F45303' }]}
        onPress={() => navigation.navigate('Home')}
      >
        <CustomText fontSize={16} fontWeight="600" color="#FFFFFF">
          Explore Creators
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <MaterialIcons name="people" size={32} color="#F45303" />
        <CustomText
          fontSize={14}
          color="#CCCCCC"
          style={{ marginTop: spacing.md }}
        >
          Loading following...
        </CustomText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <CustomText fontSize={20} fontWeight="700" color="#FFFFFF">
          Following
        </CustomText>
        <View style={styles.placeholder} />
      </View>

      {/* Following List */}
      <FlatList
        data={followingList}
        renderItem={renderFollowingItem}
        keyExtractor={item => item.creatorId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#F45303']}
            tintColor="#F45303"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          { paddingHorizontal: spacing.lg },
          followingList.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flex: 1,
  },
  creatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorDetails: {
    flex: 1,
  },
  unfollowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F45303',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});

export default Following;
