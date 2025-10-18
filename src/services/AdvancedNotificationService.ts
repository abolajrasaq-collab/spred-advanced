import { Platform, PermissionsAndroid, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationConfig {
  enablePushNotifications: boolean;
  enableLocalNotifications: boolean;
  enableSmartAlerts: boolean;
  enableQuietHours: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  enableVibration: boolean;
  enableSound: boolean;
  enableBadge: boolean;
  enablePreview: boolean;
  maxNotifications: number;
  notificationTimeout: number;
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

interface SmartAlertRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  cooldown: number; // in minutes
  lastTriggered?: number;
}

interface NotificationStats {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Record<string, number>;
  notificationsByCategory: Record<string, number>;
  averageResponseTime: number;
  clickThroughRate: number;
}

class AdvancedNotificationService {
  private static instance: AdvancedNotificationService;
  private config: NotificationConfig;
  private notifications: NotificationData[] = [];
  private smartAlertRules: SmartAlertRule[] = [];
  private isInitialized: boolean = false;
  private readonly STORAGE_KEY = 'notification_config';
  private readonly NOTIFICATIONS_KEY = 'notifications';
  private readonly RULES_KEY = 'smart_alert_rules';
  private readonly MAX_NOTIFICATIONS = 1000;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeSmartAlertRules();
  }

  public static getInstance(): AdvancedNotificationService {
    if (!AdvancedNotificationService.instance) {
      AdvancedNotificationService.instance = new AdvancedNotificationService();
    }
    return AdvancedNotificationService.instance;
  }

  private getDefaultConfig(): NotificationConfig {
    return {
      enablePushNotifications: true,
      enableLocalNotifications: true,
      enableSmartAlerts: true,
      enableQuietHours: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      enableVibration: true,
      enableSound: true,
      enableBadge: true,
      enablePreview: true,
      maxNotifications: 100,
      notificationTimeout: 5000,
    };
  }

  private initializeSmartAlertRules(): void {
    this.smartAlertRules = [
      {
        id: 'download_complete',
        name: 'Download Complete',
        condition: 'download_status === "completed"',
        action: 'show_notification',
        enabled: true,
        priority: 'normal',
        cooldown: 0,
      },
      {
        id: 'share_success',
        name: 'Share Success',
        condition: 'share_status === "success"',
        action: 'show_notification',
        enabled: true,
        priority: 'normal',
        cooldown: 0,
      },
      {
        id: 'security_alert',
        name: 'Security Alert',
        condition: 'security_event_severity === "critical"',
        action: 'show_urgent_notification',
        enabled: true,
        priority: 'urgent',
        cooldown: 0,
      },
      {
        id: 'performance_warning',
        name: 'Performance Warning',
        condition: 'performance_score < 70',
        action: 'show_warning_notification',
        enabled: true,
        priority: 'high',
        cooldown: 30,
      },
      {
        id: 'storage_warning',
        name: 'Storage Warning',
        condition: 'storage_usage > 85',
        action: 'show_warning_notification',
        enabled: true,
        priority: 'high',
        cooldown: 60,
      },
    ];
  }

  public async initialize(): Promise<boolean> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🔔 Initializing Advanced Notification Service...');

      // Load existing configuration
      await this.loadConfiguration();

      // Load notifications
      await this.loadNotifications();

      // Load smart alert rules
      await this.loadSmartAlertRules();

      // Request notification permissions
      await this.requestNotificationPermissions();

      this.isInitialized = true;

      // Track service initialization
      // DISABLED FOR PERFORMANCE
      // // DISABLED FOR PERFORMANCE - AnalyticsService.trackEvent('notification_service_initialized', {
      //   enablePushNotifications: this.config.enablePushNotifications,
      //   enableLocalNotifications: this.config.enableLocalNotifications,
      //   enableSmartAlerts: this.config.enableSmartAlerts,
      // });

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Advanced Notification Service initialized');
      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '❌ Failed to initialize Advanced Notification Service:',
      //   error,
      // );
      return false;
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (data) {
        this.config = { ...this.config, ...JSON.parse(data) };
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load notification configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save notification configuration:', error);
    }
  }

  private async loadNotifications(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      if (data) {
        this.notifications = JSON.parse(data);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load notifications:', error);
    }
  }

  private async saveNotifications(): Promise<void> {
    try {
      // Keep only the most recent notifications
      if (this.notifications.length > this.MAX_NOTIFICATIONS) {
        this.notifications = this.notifications.slice(-this.MAX_NOTIFICATIONS);
      }

      await AsyncStorage.setItem(
        this.NOTIFICATIONS_KEY,
        JSON.stringify(this.notifications),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save notifications:', error);
    }
  }

  private async loadSmartAlertRules(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.RULES_KEY);
      if (data) {
        this.smartAlertRules = JSON.parse(data);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load smart alert rules:', error);
    }
  }

  private async saveSmartAlertRules(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.RULES_KEY,
        JSON.stringify(this.smartAlertRules),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save smart alert rules:', error);
    }
  }

  private async requestNotificationPermissions(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      const permissions = [PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS];

      const granted = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(granted).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED,
      );

      if (!allGranted) {
        // Only show warning in development mode
        if (__DEV__) {
          // DISABLED FOR PERFORMANCE
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '...',
          // );
        }
      }
    } catch (error) {
      // Only log errors in development mode
      if (__DEV__) {
        // DISABLED FOR PERFORMANCE
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );
      }
    }
  }

  public async sendNotification(
    title: string,
    body: string,
    type: NotificationData['type'] = 'info',
    priority: NotificationData['priority'] = 'normal',
    category: NotificationData['category'] = 'system',
    data?: Record<string, any>,
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Notification service not initialized');
      }

      // Check if we're in quiet hours
      if (this.config.enableQuietHours && this.isInQuietHours()) {
        // DISABLED FOR PERFORMANCE
        // console.log('🔇 Notification suppressed due to quiet hours');
        return false;
      }

      // Create notification data
      const notification: NotificationData = {
        id: this.generateNotificationId(),
        title,
        body,
        type,
        priority,
        category,
        timestamp: Date.now(),
        read: false,
        data,
      };

      // Add to notifications array
      this.notifications.push(notification);
      await this.saveNotifications();

      // Send local notification
      if (this.config.enableLocalNotifications) {
        await this.sendLocalNotification(notification);
      }

      // Send push notification if enabled
      if (this.config.enablePushNotifications) {
        await this.sendPushNotification(notification);
      }

      // DISABLED FOR PERFORMANCE
      // // DISABLED FOR PERFORMANCE - AnalyticsService.trackEvent('notification_sent', {
      //   type,
      //   priority,
      //   category,
      //   title: title.substring(0, 50),
      // });

      // DISABLED FOR PERFORMANCE
      // console.log(`✅ Notification sent: ${title}`);
      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to send notification:', error);
      return false;
    }
  }

  private async sendLocalNotification(
    notification: NotificationData,
  ): Promise<void> {
    try {
      // Use React Native's built-in Alert for now (since no notification library is installed)
      const { Alert } = require('react-native');

      // Show a more prominent notification using Alert
      Alert.alert(
        notification.title,
        notification.body,
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {
              // Mark as read when user acknowledges
              this.markNotificationAsRead(notification.id);
            },
          },
        ],
        { cancelable: true },
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to send local notification:', error);
    }
  }

  private async sendPushNotification(
    notification: NotificationData,
  ): Promise<void> {
    try {
      // This would integrate with Firebase Cloud Messaging or similar
      // For now, just simulate the push notification
      // DISABLED FOR PERFORMANCE
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to send push notification:', error);
    }
  }

  public async markNotificationAsRead(
    notificationId: string,
  ): Promise<boolean> {
    try {
      const notification = this.notifications.find(
        n => n.id === notificationId,
      );
      if (notification) {
        notification.read = true;
        await this.saveNotifications();

        // DISABLED FOR PERFORMANCE
        // // DISABLED FOR PERFORMANCE - AnalyticsService.trackEvent('notification_read', {
        //   notificationId,
        //   type: notification.type,
        //   category: notification.category,
        // });

        return true;
      }
      return false;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to mark notification as read:', error);
      return false;
    }
  }

  public async markAllNotificationsAsRead(): Promise<void> {
    try {
      this.notifications.forEach(notification => {
        notification.read = true;
      });

      await this.saveNotifications();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('all_notifications_read', {
      //   totalNotifications: this.notifications.length,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to mark all notifications as read:', error);
    }
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        this.notifications.splice(index, 1);
        await this.saveNotifications();

        // DISABLED FOR PERFORMANCE
        // AnalyticsService.trackEvent('notification_deleted', {
        //   notificationId,
        // });

        return true;
      }
      return false;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to delete notification:', error);
      return false;
    }
  }

  public async clearAllNotifications(): Promise<void> {
    try {
      this.notifications = [];
      await this.saveNotifications();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('all_notifications_cleared');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to clear all notifications:', error);
    }
  }

  public async processSmartAlerts(context: Record<string, any>): Promise<void> {
    try {
      if (!this.config.enableSmartAlerts) {
        return;
      }

      for (const rule of this.smartAlertRules) {
        if (!rule.enabled) {
          continue;
        }

        // Check cooldown
        if (
          rule.lastTriggered &&
          Date.now() - rule.lastTriggered < rule.cooldown * 60000
        ) {
          continue;
        }

        // Evaluate condition
        if (this.evaluateCondition(rule.condition, context)) {
          await this.executeSmartAlert(rule, context);
          rule.lastTriggered = Date.now();
        }
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to process smart alerts:', error);
    }
  }

  private evaluateCondition(
    condition: string,
    context: Record<string, any>,
  ): boolean {
    try {
      // Simple condition evaluation
      // In a real implementation, you'd use a proper expression evaluator
      const conditions = condition.split(' ');

      if (conditions.length === 3) {
        const [variable, operator, value] = conditions;
        const contextValue = context[variable];

        switch (operator) {
          case '===':
            return contextValue === value;
          case '>':
            return Number(contextValue) > Number(value);
          case '<':
            return Number(contextValue) < Number(value);
          case '>=':
            return Number(contextValue) >= Number(value);
          case '<=':
            return Number(contextValue) <= Number(value);
          default:
            return false;
        }
      }

      return false;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to evaluate condition:', error);
      return false;
    }
  }

  private async executeSmartAlert(
    rule: SmartAlertRule,
    context: Record<string, any>,
  ): Promise<void> {
    try {
      let title = '';
      let body = '';
      let type: NotificationData['type'] = 'info';
      let priority: NotificationData['priority'] = 'normal';

      switch (rule.id) {
        case 'download_complete':
          title = 'Download Complete';
          body = 'Your download has finished successfully';
          type = 'success';
          priority = 'normal';
          break;
        case 'share_success':
          title = 'Share Successful';
          body = 'Your content has been shared successfully';
          type = 'success';
          priority = 'normal';
          break;
        case 'security_alert':
          title = 'Security Alert';
          body = 'A critical security event has been detected';
          type = 'error';
          priority = 'urgent';
          break;
        case 'performance_warning':
          title = 'Performance Warning';
          body = 'App performance is below optimal levels';
          type = 'warning';
          priority = 'high';
          break;
        case 'storage_warning':
          title = 'Storage Warning';
          body = 'Device storage is running low';
          type = 'warning';
          priority = 'high';
          break;
        default:
          title = 'Smart Alert';
          body = 'A smart alert has been triggered';
          type = 'info';
          priority = 'normal';
      }

      await this.sendNotification(title, body, type, priority, 'system', {
        ruleId: rule.id,
        context,
      });

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('smart_alert_triggered', {
      //   ruleId: rule.id,
      //   ruleName: rule.name,
      //   priority: rule.priority,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to execute smart alert:', error);
    }
  }

  public getNotifications(
    limit: number = 50,
    unreadOnly: boolean = false,
  ): NotificationData[] {
    let filteredNotifications = [...this.notifications];

    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }

    return filteredNotifications
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public getNotificationStats(): NotificationStats {
    const totalNotifications = this.notifications.length;
    const unreadNotifications = this.notifications.filter(n => !n.read).length;

    const notificationsByType: Record<string, number> = {};
    const notificationsByCategory: Record<string, number> = {};

    this.notifications.forEach(notification => {
      notificationsByType[notification.type] =
        (notificationsByType[notification.type] || 0) + 1;
      notificationsByCategory[notification.category] =
        (notificationsByCategory[notification.category] || 0) + 1;
    });

    return {
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      notificationsByCategory,
      averageResponseTime: 0, // This would be calculated from actual data
      clickThroughRate: 0, // This would be calculated from actual data
    };
  }

  public getSmartAlertRules(): SmartAlertRule[] {
    return [...this.smartAlertRules];
  }

  public async updateSmartAlertRule(
    ruleId: string,
    updates: Partial<SmartAlertRule>,
  ): Promise<void> {
    try {
      const ruleIndex = this.smartAlertRules.findIndex(r => r.id === ruleId);
      if (ruleIndex !== -1) {
        this.smartAlertRules[ruleIndex] = {
          ...this.smartAlertRules[ruleIndex],
          ...updates,
        };
        await this.saveSmartAlertRules();

        // DISABLED FOR PERFORMANCE
        // AnalyticsService.trackEvent('smart_alert_rule_updated', {
        //   ruleId,
        //   updates,
        // });
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update smart alert rule:', error);
    }
  }

  public async addSmartAlertRule(rule: SmartAlertRule): Promise<void> {
    try {
      this.smartAlertRules.push(rule);
      await this.saveSmartAlertRules();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('smart_alert_rule_added', {
      //   ruleId: rule.id,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to add smart alert rule:', error);
    }
  }

  public async removeSmartAlertRule(ruleId: string): Promise<void> {
    try {
      this.smartAlertRules = this.smartAlertRules.filter(r => r.id !== ruleId);
      await this.saveSmartAlertRules();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('smart_alert_rule_removed', { ruleId });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to remove smart alert rule:', error);
    }
  }

  public async updateNotificationConfig(
    updates: Partial<NotificationConfig>,
  ): Promise<void> {
    try {
      this.config = { ...this.config, ...updates };
      await this.saveConfiguration();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('notification_config_updated', updates);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update notification configuration:', error);
    }
  }

  public getNotificationConfig(): NotificationConfig {
    return { ...this.config };
  }

  private isInQuietHours(): boolean {
    if (!this.config.enableQuietHours) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const startTime = this.parseTime(this.config.quietHoursStart);
    const endTime = this.parseTime(this.config.quietHoursEnd);

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private generateNotificationId(): string {
    return `notification_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }

  // Clear all notifications from storage
  public async clearAllNotifications(): Promise<boolean> {
    try {
      this.notifications = [];
      await AsyncStorage.removeItem(this.NOTIFICATIONS_KEY);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ All notifications cleared from storage');
      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to clear notifications:', error);
      return false;
    }
  }
}

export default AdvancedNotificationService.getInstance();
