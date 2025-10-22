import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainParamsList } from '../../../@types/navigation';

type AccountNavigationProp = NativeStackNavigationProp<MainParamsList>;
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getDataJson, storeDataJson } from '../../helpers/api/Asyncstorage';
import axios from 'axios';
import { api } from '../../helpers/api/api';
import CustomText from '../../components/CustomText/CustomText';
import CustomButton from '../../components/CustomButton/CustomButton';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import { UserMetricsService } from '../../services/UserMetricsService';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { logout } from '../../store/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 380;
const isMediumScreen = SCREEN_WIDTH < 600;

// Responsive helpers
const getResponsiveFontSize = (baseSize: number) => {
  if (isSmallScreen) {
    return baseSize * 0.85;
  }
  if (isMediumScreen) {
    return baseSize * 0.9;
  }
  return baseSize;
};

const getResponsiveSpacing = (baseSpacing: number) => {
  if (isSmallScreen) {
    return baseSpacing * 0.8;
  }
  if (isMediumScreen) {
    return baseSpacing * 0.9;
  }
  return baseSpacing;
};

const getAvatarSize = () => {
  if (isSmallScreen) {
    return 80;
  }
  if (isMediumScreen) {
    return 90;
  }
  return 100;
};

const getAvatarBorderWidth = () => {
  if (isSmallScreen) {
    return 3;
  }
  return 4;
};

const Account = () => {
  const navigation = useNavigation<AccountNavigationProp>();
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  // Get user data from Redux state as fallback
  const authUser = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User metrics state
  const [userMetrics, setUserMetrics] = useState({
    videosWatched: 0,
    watchTime: 0, // in minutes
    dayStreak: 0,
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    bio: '',
  });

  useEffect(() => {
    loadUserData();
    loadUserMetrics();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('🔍 Loading user data for Account screen...');
      const userData = await getDataJson('User');
      const userInfoData = (await getDataJson('UserInfo')) as {
        firstName?: string;
        lastName?: string;
        emailAddress?: string;
        username?: string;
        bio?: string;
      } | null;

      console.log('📊 User data loaded:', !!userData);
      console.log('📊 UserInfo data loaded:', !!userInfoData);

      // Use Redux state as fallback if AsyncStorage data is not available
      const finalUserData = userData || authUser;
      console.log('📊 Final user data:', !!finalUserData);

      setUser(finalUserData);
      setUserInfo(userInfoData);

      if (userInfoData) {
        setEditForm({
          firstName: userInfoData.firstName || '',
          lastName: userInfoData.lastName || '',
          email: userInfoData.emailAddress || '',
          username: userInfoData.username || '',
          bio: userInfoData.bio || 'Welcome to Spred!',
        });
      } else if (finalUserData) {
        // Use Redux user data for form if UserInfo is not available
        setEditForm({
          firstName: finalUserData.firstName || '',
          lastName: finalUserData.lastName || '',
          email: finalUserData.email || '',
          username: finalUserData.username || '',
          bio: finalUserData.bio || 'Welcome to Spred!',
        });
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);

      // Use Redux state as fallback
      if (authUser) {
        console.log('🔄 Using Redux user data as fallback');
        setUser(authUser);
        setEditForm({
          firstName: authUser.firstName || '',
          lastName: authUser.lastName || '',
          email: authUser.email || '',
          username: authUser.username || '',
          bio: authUser.bio || 'Welcome to Spred!',
        });
      } else {
        setError('Failed to load user data');
      }
    }
  };

  const loadUserMetrics = async () => {
    try {
      const metrics = await UserMetricsService.getUserMetrics();
      setUserMetrics(metrics);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading user metrics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    await loadUserMetrics();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    setEditModalVisible(true);
  };

  const handleImageUpload = () => {
    Alert.alert('Change Profile Picture', 'This feature is coming soon!');
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        username: editForm.username,
      };

      const response = await axios.put(
        `${api.getUserDetails}/${user?.id}/edit-user-detail`,
        payload,
        {
          headers: {
            mobileAppByPassIVAndKey:
              'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
            username: 'SpredMediaAdmin',
            password: 'SpredMediaLoveSpreding@2023',
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      await storeDataJson('UserInfo', { ...userInfo, ...payload });
      setUserInfo({ ...userInfo, ...payload });

      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error updating profile:', error);
      setError(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // Clear AsyncStorage data
          storeDataJson('User', null);
          storeDataJson('UserInfo', null);
          storeDataJson('Profile', null);

          // Dispatch Redux logout action
          dispatch(logout());

          // Navigate to SignIn
          navigation.navigate('SignIn');
        },
      },
    ]);
  };

  const getInitials = name => {
    if (!name || typeof name !== 'string') {
      return 'U';
    }

    // Clean the name and split by spaces
    const cleanName = name.trim();
    if (!cleanName) {
      return 'U';
    }

    const names = cleanName.split(' ').filter(n => n.length > 0);

    if (names.length === 0) {
      return 'U';
    }

    if (names.length === 1) {
      // Single name - take first two characters
      return names[0].substring(0, 2).toUpperCase();
    }

    // Multiple names - take first character of first and last name
    const firstInitial = names[0].charAt(0);
    const lastInitial = names[names.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase().slice(0, 2);
  };

  const menuItems = [
    { icon: 'edit', title: 'Edit Profile', onPress: handleEditProfile },
    {
      icon: 'dashboard',
      title: 'Creator Dashboard',
      onPress: () => navigation.navigate('CreatorDashboard'),
    },
    // SpredWallet temporarily disabled
    // {
    //   icon: 'wallet',
    //   title: 'Spred Wallet',
    //   onPress: () => navigation.navigate('SpredWallet'),
    // },
    {
      icon: 'download',
      title: 'Downloads',
      onPress: () => navigation.navigate('Download'),
    },
    {
      icon: 'notification',
      title: 'Notifications',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      icon: 'setting',
      title: 'Settings',
      onPress: () => navigation.navigate('Settings'),
    },

    {
      icon: 'refresh',
      title: 'Refresh Metrics',
      onPress: loadUserMetrics,
    },
    {
      icon: 'share',
      title: 'Real File Share Test',
      onPress: () => navigation.navigate('RealFileShareTest'),
    },
    {
      icon: 'questioncircleo',
      title: 'Help & Support',
      onPress: () => navigation.navigate('Help'),
    },
    {
      icon: 'logout',
      title: 'Logout',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <MaterialIcons
          name="person"
          size={64}
          color={colors.interactive.primary}
        />
        <CustomText
          fontSize={16}
          color={colors.text.primary}
          style={{ marginTop: spacing.md }}
        >
          Loading profile...
        </CustomText>
        {error && (
          <CustomText
            fontSize={14}
            color={colors.status.error}
            style={{ marginTop: spacing.sm, textAlign: 'center' }}
          >
            {error}
          </CustomText>
        )}
        <CustomButton
          title="Retry"
          onPress={loadUserData}
          style={{ marginTop: spacing.md }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.coverPhoto, { backgroundColor: '#F45303' }]}>
            <View style={styles.coverOverlay} />
          </View>

          <View
            style={[styles.profileContent, { paddingHorizontal: spacing.lg }]}
          >
            <View
              style={[
                styles.avatarSection,
                {
                  marginTop: isSmallScreen ? -30 : -40,
                  marginBottom: isSmallScreen ? 12 : 16,
                },
              ]}
            >
              <TouchableOpacity
                onPress={handleImageUpload}
                style={[
                  styles.avatarContainer,
                  {
                    marginBottom: isSmallScreen ? 12 : 16,
                  },
                ]}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={[
                      styles.avatar,
                      {
                        borderColor: '#1A1A1A',
                        width: getAvatarSize(),
                        height: getAvatarSize(),
                        borderRadius: getAvatarSize() / 2,
                        borderWidth: getAvatarBorderWidth(),
                      },
                    ]}
                    resizeMode="cover"
                    onError={error => {
                      // DISABLED FOR PERFORMANCE
                      // console.log('Avatar image load error:', error);
                      // Could add fallback logic here if needed
                    }}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      {
                        backgroundColor: '#F45303',
                        borderColor: '#1A1A1A',
                        width: getAvatarSize(),
                        height: getAvatarSize(),
                        borderRadius: getAvatarSize() / 2,
                        borderWidth: getAvatarBorderWidth(),
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <CustomText
                      fontSize={isSmallScreen ? 28 : 32}
                      fontWeight="700"
                      color="#FFFFFF"
                      style={{
                        textAlign: 'center',
                        lineHeight: isSmallScreen ? 34 : 38,
                        paddingHorizontal: isSmallScreen ? 4 : 6,
                      }}
                    >
                      {getInitials(
                        (userInfo?.firstName || userInfo?.username || 'User') +
                        ' ' +
                        (userInfo?.lastName || ''),
                      )}
                    </CustomText>
                  </View>
                )}
                <View
                  style={[
                    styles.avatarEditButton,
                    {
                      backgroundColor: '#F45303',
                      borderColor: '#1A1A1A',
                      width: isSmallScreen ? 20 : 24,
                      height: isSmallScreen ? 20 : 24,
                      borderRadius: isSmallScreen ? 10 : 12,
                      borderWidth: getAvatarBorderWidth() - 1,
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <MaterialIcons
                    name="camera-alt"
                    size={isSmallScreen ? 12 : 14}
                    color="#FFFFFF"
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.userInfo}>
                <CustomText
                  fontSize={getResponsiveFontSize(22)}
                  fontWeight="700"
                  color="#FFFFFF"
                  style={{ marginBottom: 4 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userInfo?.firstName || userInfo?.username || 'User'}
                  {userInfo?.lastName && ` ${userInfo.lastName}`}
                </CustomText>
                <CustomText
                  fontSize={getResponsiveFontSize(14)}
                  color="#CCCCCC"
                  style={{
                    textAlign: 'center',
                    marginBottom: 12,
                    paddingHorizontal: isSmallScreen ? 10 : 20,
                  }}
                  numberOfLines={isSmallScreen ? 2 : 3}
                  ellipsizeMode="tail"
                >
                  {editForm.bio ||
                    'Welcome to Spred! Enjoy streaming your favorite content.'}
                </CustomText>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View
          style={[
            styles.statsContainer,
            {
              paddingHorizontal: getResponsiveSpacing(spacing.lg),
              marginBottom: getResponsiveSpacing(spacing.xl),
            },
          ]}
        >
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: '#2A2A2A',
                borderColor: 'rgba(244, 83, 3, 0.2)',
                padding: getResponsiveSpacing(16),
                marginHorizontal: isSmallScreen ? 2 : 6,
              },
            ]}
          >
            <MaterialIcons
              name="play-circle-outline"
              size={getResponsiveFontSize(24)}
              color="#F45303"
            />
            <CustomText
              fontSize={getResponsiveFontSize(20)}
              fontWeight="700"
              color="#FFFFFF"
              style={{
                marginTop: getResponsiveSpacing(8),
                marginBottom: 4,
              }}
            >
              {userMetrics.videosWatched}
            </CustomText>
            <CustomText
              fontSize={getResponsiveFontSize(12)}
              color="#CCCCCC"
              style={{ textAlign: 'center' }}
              numberOfLines={1}
            >
              Videos Watched
            </CustomText>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: '#2A2A2A',
                borderColor: 'rgba(244, 83, 3, 0.2)',
                padding: getResponsiveSpacing(16),
                marginHorizontal: isSmallScreen ? 2 : 6,
              },
            ]}
          >
            <MaterialIcons
              name="schedule"
              size={getResponsiveFontSize(24)}
              color="#F45303"
            />
            <CustomText
              fontSize={getResponsiveFontSize(20)}
              fontWeight="700"
              color="#FFFFFF"
              style={{
                marginTop: getResponsiveSpacing(8),
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {Math.floor(userMetrics.watchTime / 60)}h{' '}
              {userMetrics.watchTime % 60}m
            </CustomText>
            <CustomText
              fontSize={getResponsiveFontSize(12)}
              color="#CCCCCC"
              style={{ textAlign: 'center' }}
              numberOfLines={1}
            >
              Watch Time
            </CustomText>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: '#2A2A2A',
                borderColor: 'rgba(244, 83, 3, 0.2)',
                padding: getResponsiveSpacing(16),
                marginHorizontal: isSmallScreen ? 2 : 6,
              },
            ]}
          >
            <MaterialIcons
              name="whatshot"
              size={getResponsiveFontSize(24)}
              color="#F45303"
            />
            <CustomText
              fontSize={getResponsiveFontSize(20)}
              fontWeight="700"
              color="#FFFFFF"
              style={{
                marginTop: getResponsiveSpacing(8),
                marginBottom: 4,
              }}
            >
              {userMetrics.dayStreak}
            </CustomText>
            <CustomText
              fontSize={getResponsiveFontSize(12)}
              color="#CCCCCC"
              style={{ textAlign: 'center' }}
              numberOfLines={1}
            >
              Day Streak
            </CustomText>
          </View>
        </View>

        {/* Account Information */}
        <View
          style={[
            styles.accountInfoContainer,
            { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
          ]}
        >
          <CustomText
            fontSize={18}
            fontWeight="700"
            color="#FFFFFF"
            style={{ marginBottom: spacing.md }}
          >
            Account Information
          </CustomText>
          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: '#2A2A2A',
                borderColor: 'rgba(244, 83, 3, 0.2)',
              },
            ]}
          >
            <View style={[styles.infoRow, { paddingVertical: spacing.md }]}>
              <CustomText fontSize={14} fontWeight="500" color="#8B8B8B">
                First Name
              </CustomText>
              <CustomText
                fontSize={14}
                fontWeight="600"
                color="#FFFFFF"
                style={styles.infoValue}
              >
                {userInfo?.firstName || 'N/A'}
              </CustomText>
            </View>
            <View
              style={[
                styles.infoDivider,
                { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              ]}
            />
            <View style={[styles.infoRow, { paddingVertical: spacing.md }]}>
              <CustomText fontSize={14} fontWeight="500" color="#8B8B8B">
                Last Name
              </CustomText>
              <CustomText
                fontSize={14}
                fontWeight="600"
                color="#FFFFFF"
                style={styles.infoValue}
              >
                {userInfo?.lastName || 'N/A'}
              </CustomText>
            </View>
            <View
              style={[
                styles.infoDivider,
                { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              ]}
            />
            <View style={[styles.infoRow, { paddingVertical: spacing.md }]}>
              <CustomText fontSize={14} fontWeight="500" color="#8B8B8B">
                Username
              </CustomText>
              <CustomText
                fontSize={14}
                fontWeight="600"
                color="#FFFFFF"
                style={styles.infoValue}
              >
                {userInfo?.username || 'N/A'}
              </CustomText>
            </View>
            <View
              style={[
                styles.infoDivider,
                { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              ]}
            />
            <View style={[styles.infoRow, { paddingVertical: spacing.md }]}>
              <CustomText fontSize={14} fontWeight="500" color="#8B8B8B">
                Email
              </CustomText>
              <CustomText
                fontSize={14}
                fontWeight="600"
                color="#FFFFFF"
                style={styles.infoValue}
              >
                {userInfo?.emailAddress || user?.email || 'N/A'}
              </CustomText>
            </View>
            <View
              style={[
                styles.infoDivider,
                { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              ]}
            />
            <View style={[styles.infoRow, { paddingVertical: spacing.md }]}>
              <CustomText fontSize={14} fontWeight="500" color="#8B8B8B">
                Member Since
              </CustomText>
              <CustomText
                fontSize={14}
                fontWeight="600"
                color="#FFFFFF"
                style={styles.infoValue}
              >
                {new Date().getFullYear()}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View
          style={[
            styles.quickActionsContainer,
            { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
          ]}
        >
          <CustomText
            fontSize={18}
            fontWeight="700"
            color="#FFFFFF"
            style={{ marginBottom: spacing.md }}
          >
            Quick Actions
          </CustomText>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                {
                  backgroundColor: '#2A2A2A',
                  borderColor: 'rgba(244, 83, 3, 0.2)',
                },
              ]}
              onPress={() => navigation.navigate('Download')}
            >
              <MaterialIcons name="download" size={20} color="#F45303" />
              <CustomText
                fontSize={12}
                fontWeight="600"
                color="#FFFFFF"
                style={{ marginTop: 8 }}
              >
                Downloads
              </CustomText>
            </TouchableOpacity>
            {/* SpredWallet temporarily disabled */}
            {/* <TouchableOpacity
              style={[
                styles.quickActionButton,
                {
                  backgroundColor: '#2A2A2A',
                  borderColor: 'rgba(244, 83, 3, 0.2)',
                },
              ]}
              onPress={() => navigation.navigate('SpredWallet')}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={20}
                color="#F45303"
              />
              <CustomText
                fontSize={12}
                fontWeight="600"
                color="#FFFFFF"
                style={{ marginTop: 8 }}
              >
                Wallet
              </CustomText>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                {
                  backgroundColor: '#2A2A2A',
                  borderColor: 'rgba(244, 83, 3, 0.2)',
                },
              ]}
              onPress={handleEditProfile}
            >
              <MaterialIcons name="edit" size={20} color="#F45303" />
              <CustomText
                fontSize={12}
                fontWeight="600"
                color="#FFFFFF"
                style={{ marginTop: 8 }}
              >
                Edit Profile
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View
          style={[
            styles.menuContainer,
            { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
          ]}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                {
                  backgroundColor: item.isDestructive
                      ? 'rgba(255, 68, 68, 0.1)'
                      : '#2A2A2A',
                  borderColor: item.isDestructive
                      ? 'rgba(255, 68, 68, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                  borderWidth: 1,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.md,
                  marginBottom: 8,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    {
                      backgroundColor: item.isDestructive
                          ? 'rgba(255, 68, 68, 0.2)'
                          : 'rgba(244, 83, 3, 0.2)',
                      marginRight: spacing.md,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={
                      item.icon === 'edit'
                        ? 'edit'
                        : item.icon === 'dashboard'
                          ? 'dashboard'
                          : item.icon === 'wallet'
                            ? 'account-balance-wallet'
                            : item.icon === 'sharealt'
                              ? 'share'
                              : item.icon === 'share'
                                ? 'share'
                                : item.icon === 'download'
                                  ? 'download'
                                  : item.icon === 'notification'
                                    ? 'notifications'
                                    : item.icon === 'setting'
                                      ? 'settings'
                                      : item.icon === 'questioncircleo'
                                        ? 'help-outline'
                                        : item.icon === 'logout'
                                          ? 'logout'
                                          : item.icon
                    }
                    size={20}
                    color={
                      item.isDestructive
                          ? '#FF4444'
                          : '#F45303'
                    }
                  />
                </View>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={
                    item.isDestructive
                        ? '#FF4444'
                        : '#FFFFFF'
                  }
                >
                  {item.title}
                </CustomText>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color="#8B8B8B" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View
          style={[
            styles.appInfoContainer,
            { paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
          ]}
        >
          <CustomText fontSize={14} color="#8B8B8B" style={{ marginBottom: 4 }}>
            Spred v1.0.0
          </CustomText>
          <CustomText
            fontSize={12}
            color="#8B8B8B"
            style={{ textAlign: 'center' }}
          >
            © 2024 Spred Media. All rights reserved.
          </CustomText>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: '#1A1A1A' }]}>
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: '#2A2A2A', padding: spacing.lg },
            ]}
          >
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <CustomText fontSize={16} color="#8B8B8B">
                Cancel
              </CustomText>
            </TouchableOpacity>
            <CustomText fontSize={18} fontWeight="700" color="#FFFFFF">
              Edit Profile
            </CustomText>
            <TouchableOpacity onPress={saveProfile}>
              <CustomText fontSize={16} fontWeight="700" color="#F45303">
                Save
              </CustomText>
            </TouchableOpacity>
          </View>

          <ScrollView style={[styles.modalContent, { padding: spacing.lg }]}>
            <View style={[styles.inputGroup, { marginBottom: spacing.lg }]}>
              <CustomText
                fontSize={16}
                fontWeight="500"
                color="#FFFFFF"
                style={{ marginBottom: 8 }}
              >
                First Name
              </CustomText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: '#2A2A2A',
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    padding: 15,
                  },
                ]}
                value={editForm.firstName}
                onChangeText={text =>
                  setEditForm({ ...editForm, firstName: text })
                }
                placeholder="Enter your first name"
                placeholderTextColor="#8B8B8B"
              />
            </View>

            <View style={[styles.inputGroup, { marginBottom: spacing.lg }]}>
              <CustomText
                fontSize={16}
                fontWeight="500"
                color="#FFFFFF"
                style={{ marginBottom: 8 }}
              >
                Last Name
              </CustomText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: '#2A2A2A',
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    padding: 15,
                  },
                ]}
                value={editForm.lastName}
                onChangeText={text =>
                  setEditForm({ ...editForm, lastName: text })
                }
                placeholder="Enter your last name"
                placeholderTextColor="#8B8B8B"
              />
            </View>

            <View style={[styles.inputGroup, { marginBottom: spacing.lg }]}>
              <CustomText
                fontSize={16}
                fontWeight="500"
                color="#FFFFFF"
                style={{ marginBottom: 8 }}
              >
                Username
              </CustomText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: '#2A2A2A',
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    padding: 15,
                  },
                ]}
                value={editForm.username}
                onChangeText={text =>
                  setEditForm({ ...editForm, username: text })
                }
                placeholder="Enter your username"
                placeholderTextColor="#8B8B8B"
              />
            </View>

            <View style={[styles.inputGroup, { marginBottom: spacing.lg }]}>
              <CustomText
                fontSize={16}
                fontWeight="500"
                color="#FFFFFF"
                style={{ marginBottom: 8 }}
              >
                Email
              </CustomText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: '#2A2A2A',
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    padding: 15,
                  },
                ]}
                value={editForm.email}
                onChangeText={text => setEditForm({ ...editForm, email: text })}
                placeholder="Enter your email"
                placeholderTextColor="#8B8B8B"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, { marginBottom: spacing.lg }]}>
              <CustomText
                fontSize={16}
                fontWeight="500"
                color="#FFFFFF"
                style={{ marginBottom: 8 }}
              >
                Bio
              </CustomText>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: '#2A2A2A',
                    color: '#FFFFFF',
                    borderColor: '#333333',
                    padding: 15,
                    height: 100,
                  },
                ]}
                value={editForm.bio}
                onChangeText={text => setEditForm({ ...editForm, bio: text })}
                placeholder="Tell us about yourself"
                placeholderTextColor="#8B8B8B"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {error ? (
              <CustomText
                fontSize={14}
                color="#FF4444"
                style={{ marginBottom: spacing.md, textAlign: 'center' }}
              >
                {error}
              </CustomText>
            ) : null}

            {loading ? (
              <View
                style={[
                  styles.loadingContainer,
                  { padding: spacing.md, alignItems: 'center' },
                ]}
              >
                <ActivityIndicator size="small" color="#F45303" />
              </View>
            ) : (
              <CustomButton
                title="Save Changes"
                onPress={saveProfile}
                disabled={
                  !editForm.firstName || !editForm.lastName || !editForm.email
                }
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 20,
  },
  coverPhoto: {
    height: 120,
    position: 'relative',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  profileContent: {
    marginTop: -40,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  userInfo: {
    alignItems: 'center',
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  accountInfoContainer: {},
  infoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    flex: 1,
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
  },
  quickActionsContainer: {},
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 2,
    borderWidth: 1,
    minWidth: 70,
  },
  menuContainer: {},
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfoContainer: {
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  modalContent: {
    flex: 1,
  },
  inputGroup: {},
  textInput: {
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
  },
  loadingContainer: {
    alignItems: 'center',
  },
});

export default Account;
