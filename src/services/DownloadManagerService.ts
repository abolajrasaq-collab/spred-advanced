import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  title: string;
  thumbnail?: string;
  size?: number;
  downloadedSize: number;
  status:
    | 'pending'
    | 'downloading'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: number;
  speed: number;
  estimatedTime?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  localPath?: string;
  quality: 'low' | 'medium' | 'high';
  priority: 'low' | 'normal' | 'high';
}

export interface StorageInfo {
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  downloadsSize: number;
  availableForDownloads: number;
}

export interface DownloadSettings {
  maxConcurrentDownloads: number;
  autoDownloadQuality: 'low' | 'medium' | 'high';
  downloadOverWifiOnly: boolean;
  maxStorageUsage: number; // in MB
  autoDeleteCompleted: boolean;
  deleteAfterDays: number;
}

class DownloadManagerService {
  private static instance: DownloadManagerService;
  private activeDownloads: Map<string, { jobId: number; cancel: () => void }> =
    new Map();
  private downloadQueue: DownloadItem[] = [];
  private completedDownloads: DownloadItem[] = [];
  private failedDownloads: DownloadItem[] = [];
  private settings: DownloadSettings = {
    maxConcurrentDownloads: 3,
    autoDownloadQuality: 'medium',
    downloadOverWifiOnly: false,
    maxStorageUsage: 5000, // 5GB
    autoDeleteCompleted: false,
    deleteAfterDays: 30,
  };

  private constructor() {
    this.loadSettings();
    this.loadDownloads();
  }

  static getInstance(): DownloadManagerService {
    if (!DownloadManagerService.instance) {
      DownloadManagerService.instance = new DownloadManagerService();
    }
    return DownloadManagerService.instance;
  }

  // Settings management
  async updateSettings(newSettings: Partial<DownloadSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await AsyncStorage.setItem(
      'downloadSettings',
      JSON.stringify(this.settings),
    );
  }

  async getSettings(): Promise<DownloadSettings> {
    return { ...this.settings };
  }

  private async loadSettings(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('downloadSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Failed to load download settings:', error);
    }
  }

  // Storage management
  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const totalSpace = await RNFS.getFSInfo();
      const downloadsPath = RNFS.DocumentDirectoryPath + '/downloads';

      let downloadsSize = 0;
      try {
        const exists = await RNFS.exists(downloadsPath);
        if (exists) {
          const files = await RNFS.readDir(downloadsPath);
          for (const file of files) {
            if (file.isFile()) {
              downloadsSize += parseInt(file.size?.toString() || '0', 10);
            }
          }
        }
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error calculating downloads size:', error);
      }

      return {
        totalSpace: totalSpace.totalSpace || 0,
        freeSpace: totalSpace.freeSpace || 0,
        usedSpace: (totalSpace.totalSpace || 0) - (totalSpace.freeSpace || 0),
        downloadsSize,
        availableForDownloads: Math.min(
          totalSpace.freeSpace || 0,
          this.settings.maxStorageUsage * 1024 * 1024 - downloadsSize,
        ),
      };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting storage info:', error);
      return {
        totalSpace: 0,
        freeSpace: 0,
        usedSpace: 0,
        downloadsSize: 0,
        availableForDownloads: 0,
      };
    }
  }

  // Download queue management
  async addToQueue(
    downloadItem: Omit<
      DownloadItem,
      'id' | 'createdAt' | 'downloadedSize' | 'progress' | 'speed' | 'status'
    >,
  ): Promise<string> {
    const id = `download_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const newItem: DownloadItem = {
      ...downloadItem,
      id,
      createdAt: new Date(),
      downloadedSize: 0,
      progress: 0,
      speed: 0,
      status: 'pending',
    };

    this.downloadQueue.push(newItem);
    await this.saveDownloads();

    // Start download if slots available
    this.processQueue();

    return id;
  }

  private async processQueue(): Promise<void> {
    const activeCount = this.activeDownloads.size;
    const availableSlots = this.settings.maxConcurrentDownloads - activeCount;

    if (availableSlots <= 0 || this.downloadQueue.length === 0) {
      return;
    }

    const itemsToStart = this.downloadQueue
      .filter(item => item.status === 'pending')
      .slice(0, availableSlots);

    for (const item of itemsToStart) {
      await this.startDownload(item.id);
    }
  }

  private async startDownload(id: string): Promise<void> {
    const item = this.downloadQueue.find(d => d.id === id);
    if (!item) {
      return;
    }

    item.status = 'downloading';
    await this.saveDownloads();

    try {
      const downloadsPath = RNFS.DocumentDirectoryPath + '/downloads';
      await RNFS.mkdir(downloadsPath);

      const localPath = `${downloadsPath}/${item.filename}`;
      item.localPath = localPath;

      const options = {
        fromUrl: item.url,
        toFile: localPath,
        background: true,
        progress: (res: { bytesWritten: number; contentLength: number }) => {
          if (item) {
            item.downloadedSize = res.bytesWritten;
            item.progress = (res.bytesWritten / res.contentLength) * 100;
            item.speed =
              res.bytesWritten /
              ((Date.now() - item.createdAt.getTime()) / 1000);
            item.estimatedTime =
              (res.contentLength - res.bytesWritten) / item.speed;
          }
        },
      };

      const download = RNFS.downloadFile(options);
      const jobId = download.jobId;

      this.activeDownloads.set(id, {
        jobId,
        cancel: () => RNFS.stopDownload(jobId),
      });

      const result = await download.promise;

      if (result.statusCode === 200) {
        item.status = 'completed';
        item.progress = 100;
        item.completedAt = new Date();
        this.completedDownloads.push(item);
        this.downloadQueue = this.downloadQueue.filter(d => d.id !== id);
      } else {
        throw new Error(`Download failed with status ${result.statusCode}`);
      }
    } catch (error) {
      item.status = 'failed';
      item.error = error instanceof Error ? error.message : 'Unknown error';
      this.failedDownloads.push(item);
      this.downloadQueue = this.downloadQueue.filter(d => d.id !== id);
    }

    this.activeDownloads.delete(id);
    await this.saveDownloads();
    this.processQueue();
  }

  async pauseDownload(id: string): Promise<void> {
    const activeDownload = this.activeDownloads.get(id);
    if (activeDownload) {
      activeDownload.cancel();
      this.activeDownloads.delete(id);

      const item = this.downloadQueue.find(d => d.id === id);
      if (item) {
        item.status = 'paused';
        await this.saveDownloads();
      }
    }
  }

  async resumeDownload(id: string): Promise<void> {
    const item = this.downloadQueue.find(d => d.id === id);
    if (item && item.status === 'paused') {
      await this.startDownload(id);
    }
  }

  async cancelDownload(id: string): Promise<void> {
    const activeDownload = this.activeDownloads.get(id);
    if (activeDownload) {
      activeDownload.cancel();
      this.activeDownloads.delete(id);
    }

    const itemIndex = this.downloadQueue.findIndex(d => d.id === id);
    if (itemIndex !== -1) {
      this.downloadQueue[itemIndex].status = 'cancelled';
      this.failedDownloads.push(this.downloadQueue[itemIndex]);
      this.downloadQueue.splice(itemIndex, 1);
      await this.saveDownloads();
    }
  }

  async removeDownload(id: string): Promise<void> {
    // Remove from active downloads
    const activeDownload = this.activeDownloads.get(id);
    if (activeDownload) {
      activeDownload.cancel();
      this.activeDownloads.delete(id);
    }

    // Remove from queue
    this.downloadQueue = this.downloadQueue.filter(d => d.id !== id);

    // Remove from completed
    const completedIndex = this.completedDownloads.findIndex(d => d.id === id);
    if (completedIndex !== -1) {
      const item = this.completedDownloads[completedIndex];
      // Delete file if exists
      if (item.localPath) {
        try {
          (await RNFS.exists(item.localPath)) &&
            (await RNFS.unlink(item.localPath));
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log('Error deleting file:', error);
        }
      }
      this.completedDownloads.splice(completedIndex, 1);
    }

    // Remove from failed
    this.failedDownloads = this.failedDownloads.filter(d => d.id !== id);

    await this.saveDownloads();
  }

  async clearCompleted(): Promise<void> {
    for (const item of this.completedDownloads) {
      if (item.localPath) {
        try {
          (await RNFS.exists(item.localPath)) &&
            (await RNFS.unlink(item.localPath));
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log('Error deleting file:', error);
        }
      }
    }
    this.completedDownloads = [];
    await this.saveDownloads();
  }

  async clearFailed(): Promise<void> {
    this.failedDownloads = [];
    await this.saveDownloads();
  }

  // Getters
  getDownloadQueue(): DownloadItem[] {
    return [...this.downloadQueue];
  }

  getCompletedDownloads(): DownloadItem[] {
    return [...this.completedDownloads];
  }

  getFailedDownloads(): DownloadItem[] {
    return [...this.failedDownloads];
  }

  getActiveDownloads(): DownloadItem[] {
    return this.downloadQueue.filter(d => d.status === 'downloading');
  }

  private async saveDownloads(): Promise<void> {
    try {
      const data = {
        queue: this.downloadQueue,
        completed: this.completedDownloads,
        failed: this.failedDownloads,
      };
      await AsyncStorage.setItem('downloads', JSON.stringify(data));
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving downloads:', error);
    }
  }

  private async loadDownloads(): Promise<void> {
    try {
      const saved = await AsyncStorage.getItem('downloads');
      if (saved) {
        const data = JSON.parse(saved);
        this.downloadQueue = data.queue || [];
        this.completedDownloads = data.completed || [];
        this.failedDownloads = data.failed || [];
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error loading downloads:', error);
    }
  }
}

export default DownloadManagerService;
