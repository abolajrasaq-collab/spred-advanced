import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import AdvancedNotificationService from '../../services/AdvancedNotificationService';
import AnalyticsService from '../../services/AnalyticsService';

interface NotificationDashboardProps {
  onBack?: () => void;
}

interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'promotion' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category:
    | 'download'
    | 'share'
    | 'security'
    | 'performance'
    | 'update'
    | 'social';
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  imageUrl?: string;
  data?: Record<string, any>;
}

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Record<string, number>;
  notificationsByCategory: Record<string, number>;
  averageResponseTime: number;
  clickThroughRate: number;
}

const NotificationDashboard: React.FC<NotificationDashboardProps> = ({
  onBack,
}) => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'all' | 'unread' | 'settings' | 'stats'
  >('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      setLoading(true);

      const [notificationData, notificationStats, notificationConfig] =
        await Promise.all([
          AdvancedNotificationService.getNotifications(100),
          AdvancedNotificationService.getNotificationStats(),
          AdvancedNotificationService.getNotificationConfig(),
        ]);

      setNotifications(notificationData);
      setStats(notificationStats);
      setConfig(notificationConfig);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load notification data:', error);
      Alert.alert('Error', 'Failed to load notification data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotificationData();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await AdvancedNotificationService.markNotificationAsRead(
        notificationId,
      );
      if (success) {
        await loadNotificationData();
        AnalyticsService.trackEvent('notification_marked_read', {
          notificationId,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await AdvancedNotificationService.markAllNotificationsAsRead();
      await loadNotificationData();
      AnalyticsService.trackEvent('all_notifications_marked_read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const success = await AdvancedNotificationService.deleteNotification(
        notificationId,
      );
      if (success) {
        await loadNotificationData();
        AnalyticsService.trackEvent('notification_deleted', { notificationId });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'This will delete all notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AdvancedNotificationService.clearAllNotifications();
              await loadNotificationData();
              AnalyticsService.trackEvent('all_notifications_cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all notifications');
            }
          },
        },
      ],
    );
  };

  // Test notification function removed

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#FF4444';
      case 'info':
        return '#2196F3';
      case 'promotion':
        return '#9C27B0';
      case 'system':
        return '#607D8B';
      default:
        return '#CCCCCC';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      case 'promotion':
        return 'campaign';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#FF4444';
      case 'high':
        return '#FF9800';
      case 'normal':
        return '#2196F3';
      case 'low':
        return '#4CAF50';
      default:
        return '#CCCCCC';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'download':
        return 'download';
      case 'share':
        return 'share';
      case 'security':
        return 'security';
      case 'performance':
        return 'speed';
      case 'update':
        return 'update';
      case 'social':
        return 'people';
      default:
        return 'notifications';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) {
      // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) {
      // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFilteredNotifications = () => {
    let filtered = [...notifications];

    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  };

  const renderNotificationItem = (notification: NotificationData) => (
    <View key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <View style={styles.notificationLeft}>
          <MaterialIcons
            name={getTypeIcon(notification.type)}
            size={24}
            color={getTypeColor(notification.type)}
          />
          <View style={styles.notificationContent}>
            <Text
              style={[
                styles.notificationTitle,
                !notification.read && styles.unreadTitle,
              ]}
            >
              {notification.title}
            </Text>
            <Text style={styles.notificationBody}>{notification.body}</Text>
          </View>
        </View>

        <View style={styles.notificationRight}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: getPriorityColor(notification.priority) },
            ]}
          >
            <Text style={styles.priorityText}>
              {notification.priority.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.notificationTime}>
            {formatTimestamp(notification.timestamp)}
          </Text>
        </View>
      </View>

      <View style={styles.notificationFooter}>
        <View style={styles.notificationMeta}>
          <MaterialIcons
            name={getCategoryIcon(notification.category)}
            size={16}
            color="#CCCCCC"
          />
          <Text style={styles.notificationCategory}>
            {notification.category}
          </Text>
        </View>

        <View style={styles.notificationActions}>
          {!notification.read && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleMarkAsRead(notification.id)}
            >
              <MaterialIcons name="mark-email-read" size={16} color="#2196F3" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteNotification(notification.id)}
          >
            <MaterialIcons name="delete" size={16} color="#FF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderAllTab = () => {
    const filteredNotifications = getFilteredNotifications();

    return (
      <View style={styles.tabContent}>
        {/* Filter Controls */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Filters</Text>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                'all',
                'info',
                'success',
                'warning',
                'error',
                'promotion',
                'system',
              ].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterButton,
                    filterType === type && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterType(type)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterType === type && styles.filterButtonTextActive,
                    ]}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[
                'all',
                'download',
                'share',
                'security',
                'performance',
                'update',
                'social',
              ].map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterButton,
                    filterCategory === category && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterCategory(category)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterCategory === category &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {category.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Notifications ({filteredNotifications.length})
            </Text>

            <View style={styles.sectionActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleMarkAllAsRead}
              >
                <MaterialIcons
                  name="mark-email-read"
                  size={20}
                  color="#2196F3"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleClearAllNotifications}
              >
                <MaterialIcons name="clear-all" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(renderNotificationItem)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="notifications-none"
                size={48}
                color="#CCCCCC"
              />
              <Text style={styles.emptyStateText}>No notifications found</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderUnreadTab = () => {
    const unreadNotifications = notifications.filter(n => !n.read);

    return (
      <View style={styles.tabContent}>
        <View style={styles.unreadHeader}>
          <Text style={styles.sectionTitle}>Unread Notifications</Text>
          <Text style={styles.unreadCount}>
            {unreadNotifications.length} unread
          </Text>
        </View>

        {unreadNotifications.length > 0 ? (
          unreadNotifications.map(renderNotificationItem)
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="mark-email-read" size={48} color="#4CAF50" />
            <Text style={styles.emptyStateText}>All caught up!</Text>
            <Text style={styles.emptyStateSubtext}>
              No unread notifications
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSettingsTab = () => {
    if (!config) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Notification Settings</Text>

        {/* General Settings */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>General</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="notifications" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications from the app
                </Text>
              </View>
            </View>
            <Switch
              value={config.enablePushNotifications}
              onValueChange={value => {
                setConfig({ ...config, enablePushNotifications: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons
                name="notifications-active"
                size={24}
                color="#F45303"
              />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Local Notifications</Text>
                <Text style={styles.settingDescription}>
                  Show local notifications within the app
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableLocalNotifications}
              onValueChange={value => {
                setConfig({ ...config, enableLocalNotifications: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Smart Alerts */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Smart Alerts</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="smart-toy" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Smart Alerts</Text>
                <Text style={styles.settingDescription}>
                  Enable intelligent notification alerts
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableSmartAlerts}
              onValueChange={value => {
                setConfig({ ...config, enableSmartAlerts: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupTitle}>Quiet Hours</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="schedule" size={24} color="#F45303" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Enable Quiet Hours</Text>
                <Text style={styles.settingDescription}>
                  Suppress notifications during quiet hours
                </Text>
              </View>
            </View>
            <Switch
              value={config.enableQuietHours}
              onValueChange={value => {
                setConfig({ ...config, enableQuietHours: value });
              }}
              trackColor={{ false: '#666666', true: '#F45303' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Test Notifications */}
        <View style={styles.testSection}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStatsTab = () => {
    if (!stats) {
      return null;
    }

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Notification Statistics</Text>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <MaterialIcons name="notifications" size={24} color="#F45303" />
            <Text style={styles.metricValue}>{stats.totalNotifications}</Text>
            <Text style={styles.metricLabel}>Total</Text>
          </View>

          <View style={styles.metricCard}>
            <MaterialIcons name="mark-email-unread" size={24} color="#FF9800" />
            <Text style={styles.metricValue}>{stats.unreadNotifications}</Text>
            <Text style={styles.metricLabel}>Unread</Text>
          </View>

          <View style={styles.metricCard}>
            <MaterialIcons name="trending-up" size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>
              {stats.clickThroughRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>CTR</Text>
          </View>

          <View style={styles.metricCard}>
            <MaterialIcons name="timer" size={24} color="#2196F3" />
            <Text style={styles.metricValue}>
              {stats.averageResponseTime.toFixed(0)}ms
            </Text>
            <Text style={styles.metricLabel}>Avg Response</Text>
          </View>
        </View>

        {/* Notifications by Type */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Notifications by Type</Text>

          {Object.entries(stats.notificationsByType).map(([type, count]) => (
            <View key={type} style={styles.statItem}>
              <View style={styles.statLeft}>
                <MaterialIcons
                  name={getTypeIcon(type)}
                  size={20}
                  color={getTypeColor(type)}
                />
                <Text style={styles.statLabel}>{type.toUpperCase()}</Text>
              </View>
              <Text style={styles.statValue}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Notifications by Category */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Notifications by Category</Text>

          {Object.entries(stats.notificationsByCategory).map(
            ([category, count]) => (
              <View key={category} style={styles.statItem}>
                <View style={styles.statLeft}>
                  <MaterialIcons
                    name={getCategoryIcon(category)}
                    size={20}
                    color="#CCCCCC"
                  />
                  <Text style={styles.statLabel}>{category.toUpperCase()}</Text>
                </View>
                <Text style={styles.statValue}>{count}</Text>
              </View>
            ),
          )}
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
        return renderAllTab();
      case 'unread':
        return renderUnreadTab();
      case 'settings':
        return renderSettingsTab();
      case 'stats':
        return renderStatsTab();
      default:
        return renderAllTab();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F45303" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <MaterialIcons name="refresh" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        {[
          { key: 'all', label: 'All', icon: 'notifications' },
          { key: 'unread', label: 'Unread', icon: 'mark-email-unread' },
          { key: 'settings', label: 'Settings', icon: 'settings' },
          { key: 'stats', label: 'Stats', icon: 'analytics' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialIcons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#F45303' : '#CCCCCC'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 8,
  },
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  tabButtonActive: {
    backgroundColor: '#F45303',
  },
  tabText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  filterSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#333333',
  },
  filterButtonActive: {
    backgroundColor: '#F45303',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  notificationsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#333333',
  },
  notificationItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  notificationContent: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationBody: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  notificationRight: {
    alignItems: 'flex-end',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationTime: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationCategory: {
    fontSize: 12,
    color: '#CCCCCC',
    marginLeft: 4,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  unreadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  unreadCount: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  settingsGroup: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  testSection: {
    marginTop: 20,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F45303',
    borderRadius: 8,
    padding: 16,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    marginLeft: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 16,
  },
});

export default NotificationDashboard;
