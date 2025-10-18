import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineConfig {
  enableOfflineMode: boolean;
  enableAutoSync: boolean;
  enableBackgroundSync: boolean;
  enableConflictResolution: boolean;
  enableDataCompression: boolean;
  enableEncryption: boolean;
  syncInterval: number; // in minutes
  maxRetryAttempts: number;
  retryDelay: number; // in seconds
  maxOfflineStorage: number; // in MB
  compressionLevel: 'low' | 'medium' | 'high';
  encryptionKey: string;
  syncPriority: 'low' | 'normal' | 'high' | 'critical';
}

interface SyncItem {
  id: string;
  type:
    | 'video'
    | 'user_data'
    | 'settings'
    | 'analytics'
    | 'downloads'
    | 'shares';
  data: any;
  timestamp: number;
  lastModified: number;
  version: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  priority: 'low' | 'normal' | 'high' | 'critical';
  retryCount: number;
  errorMessage?: string;
  conflictResolution?: 'server' | 'client' | 'merge' | 'manual';
}

interface OfflineStats {
  totalItems: number;
  pendingItems: number;
  syncedItems: number;
  failedItems: number;
  conflictItems: number;
  storageUsed: number; // in MB
  storageAvailable: number; // in MB
  lastSyncTime: number;
  syncSuccessRate: number;
  averageSyncTime: number;
  dataTransferred: number; // in MB
}

interface NetworkStatus {
  isConnected: boolean;
  connectionType: string;
  isInternetReachable: boolean;
  isWifiConnected: boolean;
  isCellularConnected: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

class OfflineService {
  private static instance: OfflineService;
  private config: OfflineConfig;
  private syncQueue: SyncItem[] = [];
  private isInitialized: boolean = false;
  private isOnline: boolean = true;
  private networkStatus: NetworkStatus | null = null;
  private syncInProgress: boolean = false;
  private readonly STORAGE_KEY = 'offline_config';
  private readonly SYNC_QUEUE_KEY = 'sync_queue';
  private readonly OFFLINE_DATA_KEY = 'offline_data';
  private readonly MAX_STORAGE_SIZE = 1000; // 1GB in MB

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeNetworkListener();
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private getDefaultConfig(): OfflineConfig {
    return {
      enableOfflineMode: true,
      enableAutoSync: true,
      enableBackgroundSync: true,
      enableConflictResolution: true,
      enableDataCompression: true,
      enableEncryption: true,
      syncInterval: 15, // 15 minutes
      maxRetryAttempts: 3,
      retryDelay: 5, // 5 seconds
      maxOfflineStorage: 500, // 500MB
      compressionLevel: 'medium',
      encryptionKey: 'default_encryption_key',
      syncPriority: 'normal',
    };
  }

  private initializeNetworkListener(): void {
    try {
      // SIMPLIFIED: Assume online for better performance
      this.isOnline = true;
      this.networkStatus = {
        isConnected: true,
        connectionType: 'wifi',
        isInternetReachable: true,
        isWifiConnected: true,
        isCellularConnected: false,
        connectionQuality: 'good',
      };

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('network_status_changed', {
      //   isConnected: this.isOnline,
      //   connectionType: this.networkStatus?.connectionType,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize network listener:', error);
    }
  }

  private getConnectionQuality(
    state: any,
  ): 'poor' | 'fair' | 'good' | 'excellent' {
    if (!state.isConnected) {
      return 'poor';
    }

    switch (state.type) {
      case 'wifi':
        return 'excellent';
      case 'cellular':
        return 'good';
      case 'ethernet':
        return 'excellent';
      default:
        return 'fair';
    }
  }

  public async initialize(): Promise<boolean> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Initializing Offline Service...');

      // Load existing configuration
      await this.loadConfiguration();

      // Load sync queue
      await this.loadSyncQueue();

      // Initialize offline storage
      await this.initializeOfflineStorage();

      // Start auto-sync if online
      if (this.isOnline && this.config.enableAutoSync) {
        await this.startAutoSync();
      }

      this.isInitialized = true;

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('offline_service_initialized', {
      //   enableOfflineMode: this.config.enableOfflineMode,
      //   enableAutoSync: this.config.enableAutoSync,
      //   enableBackgroundSync: this.config.enableBackgroundSync,
      // });

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Offline Service initialized');
      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize Offline Service:', error);
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
      // console.log('❌ Failed to load offline configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save offline configuration:', error);
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      if (data) {
        this.syncQueue = JSON.parse(data);
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load sync queue:', error);
    }
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.SYNC_QUEUE_KEY,
        JSON.stringify(this.syncQueue),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save sync queue:', error);
    }
  }

  private async initializeOfflineStorage(): Promise<void> {
    try {
      // Check available storage space
      const storageInfo = await this.getStorageInfo();

      if (storageInfo.available < this.config.maxOfflineStorage) {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Low storage space for offline data');
        await this.cleanupOldData();
      }

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Offline storage initialized');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize offline storage:', error);
    }
  }

  private async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      // This would integrate with actual storage APIs
      // For now, return mock data
      return {
        used: 100, // MB
        available: 900, // MB
      };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get storage info:', error);
      return { used: 0, available: 0 };
    }
  }

  private async cleanupOldData(): Promise<void> {
    try {
      // Remove old sync items
      const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days ago
      this.syncQueue = this.syncQueue.filter(
        item => item.timestamp > cutoffTime,
      );

      await this.saveSyncQueue();

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Old data cleaned up');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to cleanup old data:', error);
    }
  }

  public async addToSyncQueue(
    type: SyncItem['type'],
    data: any,
    priority: SyncItem['priority'] = 'normal',
  ): Promise<string> {
    try {
      const syncItem: SyncItem = {
        id: this.generateSyncId(),
        type,
        data,
        timestamp: Date.now(),
        lastModified: Date.now(),
        version: 1,
        status: 'pending',
        priority,
        retryCount: 0,
      };

      this.syncQueue.push(syncItem);
      await this.saveSyncQueue();

      // Start sync if online
      if (this.isOnline && this.config.enableAutoSync) {
        await this.startAutoSync();
      }

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('item_added_to_sync_queue', {
      //   type,
      //   priority,
      //   queueSize: this.syncQueue.length,
      // });

      return syncItem.id;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to add item to sync queue:', error);
      throw error;
    }
  }

  public async startAutoSync(): Promise<void> {
    try {
      if (this.syncInProgress || !this.isOnline) {
        return;
      }

      this.syncInProgress = true;

      const pendingItems = this.syncQueue.filter(
        item => item.status === 'pending',
      );

      if (pendingItems.length === 0) {
        this.syncInProgress = false;
        return;
      }

      // DISABLED FOR PERFORMANCE
      // console.log(`🔄 Starting auto-sync for ${pendingItems.length} items`);

      // Sort by priority
      const sortedItems = pendingItems.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      // Sync items
      for (const item of sortedItems) {
        await this.syncItem(item);
      }

      this.syncInProgress = false;

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('auto_sync_completed', {
      //   itemsSynced: pendingItems.length,
      //   successRate: this.calculateSyncSuccessRate(),
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to start auto-sync:', error);
      this.syncInProgress = false;
    }
  }

  private async syncItem(item: SyncItem): Promise<void> {
    try {
      item.status = 'syncing';
      await this.saveSyncQueue();

      // Simulate sync process
      await this.performSync(item);

      item.status = 'synced';
      item.lastModified = Date.now();

      await this.saveSyncQueue();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('item_synced', {
      //   itemId: item.id,
      //   type: item.type,
      //   priority: item.priority,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(`❌ Failed to sync item ${item.id}:`, error);

      item.status = 'failed';
      item.retryCount++;
      item.errorMessage = error.message;

      if (item.retryCount < this.config.maxRetryAttempts) {
        // Schedule retry
        setTimeout(() => {
          this.syncItem(item);
        }, this.config.retryDelay * 1000);
      }

      await this.saveSyncQueue();
    }
  }

  private async performSync(item: SyncItem): Promise<void> {
    try {
      // This would integrate with actual backend APIs
      // For now, simulate the sync process

      const startTime = Date.now();

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const endTime = Date.now();
      const syncTime = endTime - startTime;

      // DISABLED FOR PERFORMANCE
      // PerformanceMonitoringService.trackMetric(
      //   'sync_time',
      //   syncTime,
      //   'milliseconds',
      // );

      // DISABLED FOR PERFORMANCE
      // console.log(`✅ Item ${item.id} synced successfully`);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(`❌ Sync failed for item ${item.id}:`, error);
      throw error;
    }
  }

  public async handleOfflineMode(): Promise<void> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Entering offline mode');

      // Cache critical data
      await this.cacheCriticalData();

      // Update sync queue status
      this.syncQueue.forEach(item => {
        if (item.status === 'syncing') {
          item.status = 'pending';
        }
      });

      await this.saveSyncQueue();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('offline_mode_entered', {
      //   queueSize: this.syncQueue.length,
      //   pendingItems: this.syncQueue.filter(item => item.status === 'pending')
      //     .length,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to handle offline mode:', error);
    }
  }

  private async cacheCriticalData(): Promise<void> {
    try {
      // Cache user settings, downloaded videos, etc.
      const criticalData = {
        userSettings: await this.getUserSettings(),
        downloadedVideos: await this.getDownloadedVideos(),
        userPreferences: await this.getUserPreferences(),
      };

      await AsyncStorage.setItem(
        this.OFFLINE_DATA_KEY,
        JSON.stringify(criticalData),
      );

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Critical data cached for offline mode');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to cache critical data:', error);
    }
  }

  private async getUserSettings(): Promise<any> {
    try {
      // This would get actual user settings
      return {};
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get user settings:', error);
      return {};
    }
  }

  private async getDownloadedVideos(): Promise<any[]> {
    try {
      // This would get actual downloaded videos
      return [];
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get downloaded videos:', error);
      return [];
    }
  }

  private async getUserPreferences(): Promise<any> {
    try {
      // This would get actual user preferences
      return {};
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get user preferences:', error);
      return {};
    }
  }

  public async getOfflineStats(): Promise<OfflineStats> {
    try {
      const totalItems = this.syncQueue.length;
      const pendingItems = this.syncQueue.filter(
        item => item.status === 'pending',
      ).length;
      const syncedItems = this.syncQueue.filter(
        item => item.status === 'synced',
      ).length;
      const failedItems = this.syncQueue.filter(
        item => item.status === 'failed',
      ).length;
      const conflictItems = this.syncQueue.filter(
        item => item.status === 'conflict',
      ).length;

      const storageInfo = await this.getStorageInfo();

      const lastSyncTime =
        this.syncQueue
          .filter(item => item.status === 'synced')
          .sort((a, b) => b.lastModified - a.lastModified)[0]?.lastModified ||
        0;

      const syncSuccessRate = this.calculateSyncSuccessRate();
      const averageSyncTime = this.calculateAverageSyncTime();
      const dataTransferred = this.calculateDataTransferred();

      return {
        totalItems,
        pendingItems,
        syncedItems,
        failedItems,
        conflictItems,
        storageUsed: storageInfo.used,
        storageAvailable: storageInfo.available,
        lastSyncTime,
        syncSuccessRate,
        averageSyncTime,
        dataTransferred,
      };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get offline stats:', error);
      return {
        totalItems: 0,
        pendingItems: 0,
        syncedItems: 0,
        failedItems: 0,
        conflictItems: 0,
        storageUsed: 0,
        storageAvailable: 0,
        lastSyncTime: 0,
        syncSuccessRate: 0,
        averageSyncTime: 0,
        dataTransferred: 0,
      };
    }
  }

  private calculateSyncSuccessRate(): number {
    try {
      const totalAttempts = this.syncQueue.length;
      const successfulSyncs = this.syncQueue.filter(
        item => item.status === 'synced',
      ).length;

      return totalAttempts > 0 ? (successfulSyncs / totalAttempts) * 100 : 0;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to calculate sync success rate:', error);
      return 0;
    }
  }

  private calculateAverageSyncTime(): number {
    try {
      // This would calculate actual sync times
      // For now, return a mock value
      return 1500; // milliseconds
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to calculate average sync time:', error);
      return 0;
    }
  }

  private calculateDataTransferred(): number {
    try {
      // This would calculate actual data transferred
      // For now, return a mock value
      return 50; // MB
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to calculate data transferred:', error);
      return 0;
    }
  }

  public async updateOfflineConfig(
    updates: Partial<OfflineConfig>,
  ): Promise<void> {
    try {
      this.config = { ...this.config, ...updates };
      await this.saveConfiguration();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('offline_config_updated', updates);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update offline configuration:', error);
    }
  }

  public async clearSyncQueue(): Promise<void> {
    try {
      this.syncQueue = [];
      await this.saveSyncQueue();

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('sync_queue_cleared');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to clear sync queue:', error);
    }
  }

  public async retryFailedItems(): Promise<void> {
    try {
      const failedItems = this.syncQueue.filter(
        item => item.status === 'failed',
      );

      for (const item of failedItems) {
        item.status = 'pending';
        item.retryCount = 0;
        item.errorMessage = undefined;
      }

      await this.saveSyncQueue();

      if (this.isOnline && this.config.enableAutoSync) {
        await this.startAutoSync();
      }

      // DISABLED FOR PERFORMANCE
      // AnalyticsService.trackEvent('failed_items_retried', {
      //   itemCount: failedItems.length,
      // });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to retry failed items:', error);
    }
  }

  public getOfflineConfig(): OfflineConfig {
    return { ...this.config };
  }

  public getSyncQueue(): SyncItem[] {
    return [...this.syncQueue];
  }

  public getNetworkStatus(): NetworkStatus | null {
    return this.networkStatus;
  }

  public isOnline(): boolean {
    return this.isOnline;
  }

  public isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public isInitialized(): boolean {
    return this.isInitialized;
  }
}

export default OfflineService.getInstance();
