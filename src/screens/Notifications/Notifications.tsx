import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getDataJson } from '../../helpers/api/Asyncstorage';
import axios from 'axios';
import { api } from '../../helpers/api/api';
import Icon from '../../components/Icon/Icon';
import { ICONS } from '../../constants/icons';
import NotificationService from '../../services/NotificationService';

const COLORS = {
  background: '#353535',
  surface: '#1E1E1E',
  primary: '#F45303',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#999999',
  border: '#333333',
  unread: '#2A2A2A',
  success: '#44FF44',
  warning: '#FFAA00',
  error: '#FF4444',
} as const;

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
} as const;

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const Notifications: React.FC = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);

  // Load user token
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

  // Load local notifications
  const loadLocalNotifications = async () => {
    try {
      setLoading(true);
      const notificationService = NotificationService.getInstance();
      let localNotifications = await notificationService.getNotifications();

      // If no local notifications exist, create some sample ones
      if (!localNotifications || localNotifications.length === 0) {
        // Create sample local notifications
        const sampleNotifications = [
          {
            id: 'local-1',
            title: 'Welcome to SPRED',
            message:
              'Thank you for joining our community! Start exploring amazing content.',
            type: 'info',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: 'local-2',
            title: 'Video Processing Complete',
            message:
              'Your recent upload has been processed and is now available.',
            type: 'success',
            isRead: false,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          },
          {
            id: 'local-3',
            title: 'New Follower',
            message:
              'You have a new follower! Check your profile for more details.',
            type: 'info',
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          },
        ];

        // For now, we'll just use the demo notifications as our local notifications
        localNotifications = sampleNotifications;
      }

      // Convert to the expected format
      const formattedNotifications = localNotifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        data: notification.data,
      }));

      setNotifications(formattedNotifications);
      setLiveDataEnabled(false); // Not using live data for local notifications
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading local notifications:', error);
      // Fallback to demo data if local loading fails
      setNotifications(demoNotifications);
    } finally {
      setLoading(false);
    }
  };

  // Static demo data as fallback
  const demoNotifications: NotificationItem[] = [
    {
      id: '1',
      title: 'New video uploaded successfully',
      message:
        'Your video "How to Create Amazing Content" has been processed and is now available on your profile.',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    {
      id: '2',
      title: 'Download milestone reached',
      message:
        'Congratulations! Your videos have been downloaded 1,000 times. Keep up the great work!',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
      id: '3',
      title: 'P2P share activity',
      message:
        'Your video was shared via P2P 5 times in the last 24 hours. Your content is trending!',
      type: 'success',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
      id: '4',
      title: 'New follower',
      message: 'John Doe started following you. Check out their profile!',
      type: 'info',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
    {
      id: '5',
      title: 'Revenue update',
      message:
        'You earned ₦250 from downloads this week. View your wallet for details.',
      type: 'success',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    },
  ];

  useEffect(() => {
    // Load local notifications
    loadLocalNotifications();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadLocalNotifications();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.markAsRead(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.markAllAsRead();

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.deleteNotification(notificationId);

      // Update local state
      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'warning':
        return COLORS.warning;
      case 'error':
        return COLORS.error;
      default:
        return COLORS.primary;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification,
      ]}
      onPress={() => {
        if (!item.isRead) {
          markAsRead(item.id);
        }
        // Handle navigation based on notification type
        if (item.data?.videoId) {
          navigation.navigate('PlayVideos', { item: item.data });
        }
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: COLORS.unread }]}>
        <Icon
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {formatTimeAgo(item.createdAt)}
        </Text>
      </View>

      <View style={styles.notificationActions}>
        {!item.isRead && <View style={styles.unreadDot} />}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(item.id)}
        >
          <Icon name={ICONS.CLOSE} size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name={ICONS.ARROW_LEFT} size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {liveDataEnabled && (
            <View style={styles.liveIndicator}>
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name={ICONS.INFO} size={64} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubText}>You're all caught up!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: 50,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  liveIndicator: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  markAllButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  markAllText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  unreadNotification: {
    backgroundColor: COLORS.unread,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  notificationMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  notificationActions: {
    alignItems: 'flex-start',
    paddingLeft: SPACING.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    marginTop: SPACING.md,
  },
  emptySubText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
});

export default Notifications;
