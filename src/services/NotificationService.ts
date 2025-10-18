import axios from 'axios';
import { getDataJson } from '../helpers/api/Asyncstorage';

const baseURL = 'https://www.spred.cc/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private userToken: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private liveDataEnabled: boolean = false;
  private listeners: Array<(notifications: Notification[]) => void> = [];

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Enable live data notifications
  enableLiveData(): void {
    if (this.liveDataEnabled) {
      return;
    }

    this.liveDataEnabled = true;
    this.startPolling();
  }

  // Disable live data notifications
  disableLiveData(): void {
    this.liveDataEnabled = false;
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Start polling for new notifications
  private startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll every 30 seconds for new notifications
    this.pollingInterval = setInterval(async () => {
      try {
        const notifications = await this.getNotifications();
        this.notifyListeners(notifications);
      } catch (error) {
        // Silently handle polling errors - notifications are not critical
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );
      }
    }, 30000);
  }

  // Add listener for notification updates
  addListener(callback: (notifications: Notification[]) => void): void {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback: (notifications: Notification[]) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  private notifyListeners(notifications: Notification[]): void {
    this.listeners.forEach(listener => listener(notifications));
  }

  // Check if live data is enabled
  isLiveDataEnabled(): boolean {
    return this.liveDataEnabled;
  }

  private async getUserToken(): Promise<void> {
    try {
      const user = await getDataJson('User');
      this.userToken = user?.token || null;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting user token:', error);
      this.userToken = null;
    }
  }

  private getCustomHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      mobileAppByPassIVAndKey:
        'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
      username: 'SpredMediaAdmin',
      password: 'SpredMediaLoveSpreding@2023',
    };
  }

  async getNotifications(): Promise<Notification[]> {
    await this.getUserToken();

    // First, get local notifications from storage
    let localNotifications: Notification[] = [];
    try {
      const localData = await getDataJson('notifications');
      if (localData && Array.isArray(localData)) {
        localNotifications = localData;
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '📱 Loaded local notifications:',
        //   localNotifications.length,
        // );
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading local notifications:', error);
    }

    // If no user token, return only local notifications
    if (!this.userToken) {
      return localNotifications;
    }

    try {
      // Fetch remote notifications (optional - don't fail if API is down)
      const config = { headers: this.getCustomHeaders(this.userToken) };
      const response = await axios.get(`${baseURL}/notifications`, config);
      const remoteNotifications = response.data.data || [];

      // Combine local and remote notifications, removing duplicates
      const allNotifications = [...localNotifications, ...remoteNotifications];
      const uniqueNotifications = allNotifications.filter(
        (notification, index, self) =>
          index === self.findIndex(n => n.id === notification.id),
      );

      // DISABLED FOR PERFORMANCE
      // console.log('📱 Combined notifications:', uniqueNotifications.length);
      return uniqueNotifications;
    } catch (error) {
      // Silently handle API errors - notifications are not critical for app functionality
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );
      // Return local notifications even if remote fetch fails
      return localNotifications;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.getUserToken();

    if (!this.userToken) {
      return;
    }

    try {
      const config = { headers: this.getCustomHeaders(this.userToken) };
      await axios.post(
        `${baseURL}/notifications/${notificationId}/read`,
        {},
        config,
      );
    } catch (error) {
      // Silently handle API errors - local notifications don't need remote sync
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Remote notification marking failed, continuing locally');
    }
  }

  async markAllAsRead(): Promise<void> {
    await this.getUserToken();

    if (!this.userToken) {
      return;
    }

    try {
      const config = { headers: this.getCustomHeaders(this.userToken) };
      await axios.post(`${baseURL}/notifications/read-all`, {}, config);
    } catch (error) {
      // Silently handle API errors - local notifications don't need remote sync
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.getUserToken();

    if (!this.userToken) {
      return;
    }

    try {
      const config = { headers: this.getCustomHeaders(this.userToken) };
      await axios.delete(`${baseURL}/notifications/${notificationId}`, config);
    } catch (error) {
      // Silently handle API errors - local notifications don't need remote sync
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Remote notification deletion failed, continuing locally');
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      // Get all notifications and count unread ones
      const notifications = await this.getNotifications();
      return notifications.filter(notification => !notification.isRead).length;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting unread count:', error);
      return 0; // Return 0 instead of throwing error for better UX
    }
  }

  // Clear all notifications from local storage
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('notifications');
      // DISABLED FOR PERFORMANCE
      // console.log('✅ All local notifications cleared');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to clear local notifications:', error);
    }
  }
}

export default NotificationService;
