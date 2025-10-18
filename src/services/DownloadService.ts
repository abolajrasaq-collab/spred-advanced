import { MMKV } from 'react-native-mmkv';
import {
  VideoQuality,
  VIDEO_QUALITIES,
  getRecommendedQualityForDevice,
  estimateFileSize,
} from '../types/video';
// DISABLED FOR PERFORMANCE - import { PurchaseService } from './PurchaseService';

export interface DownloadItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number;
  quality: VideoQuality;
  url: string;
  size: number;
  progress: number;
  status:
    | 'queued'
    | 'downloading'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  downloadPath?: string;
  startTime?: number;
  endTime?: number;
  error?: string;
  isP2P: boolean;
  sourceDeviceId?: string;
  price?: number;
  contentId: string;
  type: 'video' | 'short' | 'audio';
}

export interface DownloadOptions {
  quality: VideoQuality;
  downloadLocation: 'internal' | 'sdcard';
  wifiOnly: boolean;
  maxConcurrentDownloads: number;
}

export class DownloadService {
  private static instance: DownloadService;
  private storage: MMKV;
  private activeDownloads: Map<string, DownloadItem> = new Map();
  private downloadQueue: DownloadItem[] = [];
  private isDownloading = false;
  private maxConcurrent = 2;
  // DISABLED FOR PERFORMANCE - private purchaseService: PurchaseService | null = null;
  // P2P services removed

  private constructor() {
    this.storage = new MMKV();
    this.loadSavedDownloads();
    this.loadSettings();
  }

  static getInstance(): DownloadService {
    if (!DownloadService.instance) {
      DownloadService.instance = new DownloadService();
    }
    return DownloadService.instance;
  }

  // DISABLED FOR PERFORMANCE - Purchase service removed
  // private getPurchaseService(): PurchaseService {
  //   if (!this.purchaseService) {
  //     this.purchaseService = PurchaseService.getInstance();
  //   }
  //   return this.purchaseService;
  // }

  // P2P service method removed

  private loadSavedDownloads(): void {
    const downloadsData = this.storage.getString('downloads');
    if (downloadsData) {
      try {
        const downloads: DownloadItem[] = JSON.parse(downloadsData);
        downloads.forEach(download => {
          this.activeDownloads.set(download.id, download);
        });
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Failed to load saved downloads:', error);
      }
    }
  }

  private loadSettings(): void {
    const settings = this.storage.getString('download_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        this.maxConcurrent = parsed.maxConcurrentDownloads || 2;
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Failed to load download settings:', error);
      }
    }
  }

  private saveDownloads(): void {
    const downloads = Array.from(this.activeDownloads.values());
    this.storage.set('downloads', JSON.stringify(downloads));
  }

  async startDownload(
    videoData: {
      id: string;
      title: string;
      description?: string;
      thumbnail: string;
      duration: number;
      url: string;
      baseSize?: number;
      contentId: string;
      type: 'video' | 'short' | 'audio';
      price?: number;
    },
    options?: Partial<DownloadOptions>,
  ): Promise<string> {
    const defaultOptions: DownloadOptions = {
      quality: getRecommendedQualityForDevice(),
      downloadLocation: 'internal',
      wifiOnly: false,
      maxConcurrentDownloads: 2,
      ...options,
    };

    // DISABLED FOR PERFORMANCE - Purchase checking removed for free app
    // Check if content is purchased (for paid content)
    // if (videoData.price && videoData.price > 0) {
    //   const isPurchased = await this.getPurchaseService().isContentPurchased(
    //     videoData.contentId,
    //   );
    //   if (!isPurchased) {
    //     throw new Error('Content must be purchased before downloading');
    //   }
    // }

    const downloadId = `download_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const download: DownloadItem = {
      id: downloadId,
      title: videoData.title,
      description: videoData.description,
      thumbnail: videoData.thumbnail,
      duration: videoData.duration,
      quality: defaultOptions.quality,
      url: videoData.url,
      size: videoData.baseSize
        ? estimateFileSize(videoData.baseSize, defaultOptions.quality.id)
        : 0,
      progress: 0,
      status: 'queued',
      isP2P: false,
      contentId: videoData.contentId,
      type: videoData.type,
    };

    this.activeDownloads.set(downloadId, download);
    this.downloadQueue.push(download);
    this.saveDownloads();

    // Process queue
    this.processDownloadQueue();

    return downloadId;
  }

  // P2P download functionality removed
  async startP2PDownload(): Promise<string> {
    throw new Error('P2P download functionality has been removed');
  }

  private async processDownloadQueue(): Promise<void> {
    if (this.isDownloading) {
      return;
    }

    const activeDownloads = Array.from(this.activeDownloads.values()).filter(
      d => d.status === 'downloading',
    ).length;

    if (activeDownloads >= this.maxConcurrent) {
      return;
    }

    const nextDownload = this.downloadQueue.find(d => d.status === 'queued');
    if (!nextDownload) {
      return;
    }

    this.isDownloading = true;
    nextDownload.status = 'downloading';
    nextDownload.startTime = Date.now();
    this.saveDownloads();

    try {
      // Simulate download progress
      await this.simulateDownload(nextDownload);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Download failed:', error);
      nextDownload.status = 'failed';
      nextDownload.error = error.message;
    } finally {
      this.isDownloading = false;
      this.saveDownloads();

      // Process next in queue
      this.processDownloadQueue();
    }
  }

  private async simulateDownload(download: DownloadItem): Promise<void> {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        if (download.status === 'paused') {
          clearInterval(interval);
          return;
        }

        if (download.status === 'cancelled') {
          clearInterval(interval);
          this.activeDownloads.delete(download.id);
          this.saveDownloads();
          reject(new Error('Download cancelled'));
          return;
        }

        download.progress += Math.random() * 10;
        if (download.progress >= 100) {
          download.progress = 100;
          download.status = 'completed';
          download.endTime = Date.now();
          clearInterval(interval);

          // Deduct tokens if paid content
          if (download.price && download.price > 0) {
            const currentBalance = this.storage.getNumber('user_balance') || 0;
            this.storage.set('user_balance', currentBalance - download.price);

            // Record transaction
            this.recordTransaction({
              type: 'download',
              amount: download.price,
              contentId: download.contentId,
              downloadId: download.id,
              timestamp: Date.now(),
            });
          }

          this.saveDownloads();
          resolve();
        } else {
          this.saveDownloads();
        }
      }, 1000);

      // Simulate random failures
      if (Math.random() < 0.05) {
        clearInterval(interval);
        reject(new Error('Network error'));
      }
    });
  }

  pauseDownload(downloadId: string): boolean {
    const download = this.activeDownloads.get(downloadId);
    if (download && download.status === 'downloading') {
      download.status = 'paused';
      this.saveDownloads();
      return true;
    }
    return false;
  }

  resumeDownload(downloadId: string): boolean {
    const download = this.activeDownloads.get(downloadId);
    if (download && download.status === 'paused') {
      download.status = 'queued';
      this.downloadQueue.push(download);
      this.saveDownloads();
      this.processDownloadQueue();
      return true;
    }
    return false;
  }

  cancelDownload(downloadId: string): boolean {
    const download = this.activeDownloads.get(downloadId);
    if (
      download &&
      (download.status === 'queued' ||
        download.status === 'paused' ||
        download.status === 'downloading')
    ) {
      download.status = 'cancelled';
      this.saveDownloads();
      return true;
    }
    return false;
  }

  getDownload(downloadId: string): DownloadItem | undefined {
    return this.activeDownloads.get(downloadId);
  }

  getAllDownloads(): DownloadItem[] {
    return Array.from(this.activeDownloads.values()).sort(
      (a, b) => (b.startTime || 0) - (a.startTime || 0),
    );
  }

  getActiveDownloads(): DownloadItem[] {
    return this.getAllDownloads().filter(
      d =>
        d.status === 'queued' ||
        d.status === 'downloading' ||
        d.status === 'paused',
    );
  }

  getCompletedDownloads(): DownloadItem[] {
    return this.getAllDownloads().filter(d => d.status === 'completed');
  }

  getDownloadsByType(type: 'video' | 'short' | 'audio'): DownloadItem[] {
    return this.getAllDownloads().filter(d => d.type === type);
  }

  clearCompletedDownloads(): void {
    for (const [id, download] of this.activeDownloads) {
      if (download.status === 'completed') {
        this.activeDownloads.delete(id);
      }
    }
    this.saveDownloads();
  }

  getDownloadStats(): {
    totalDownloads: number;
    completedDownloads: number;
    failedDownloads: number;
    totalSize: number;
    savedData: number;
  } {
    const downloads = this.getAllDownloads();
    const completed = downloads.filter(d => d.status === 'completed');
    const failed = downloads.filter(d => d.status === 'failed');

    const totalSize = downloads.reduce((sum, d) => sum + d.size, 0);
    const savedData = downloads.reduce((sum, d) => {
      const hdSize = estimateFileSize(d.size, '1080p');
      return sum + (hdSize - d.size);
    }, 0);

    return {
      totalDownloads: downloads.length,
      completedDownloads: completed.length,
      failedDownloads: failed.length,
      totalSize,
      savedData,
    };
  }

  updateSettings(settings: Partial<DownloadOptions>): void {
    const currentSettings = this.storage.getString('download_settings');
    const parsed = currentSettings ? JSON.parse(currentSettings) : {};
    const newSettings = { ...parsed, ...settings };
    this.storage.set('download_settings', JSON.stringify(newSettings));

    if (settings.maxConcurrentDownloads) {
      this.maxConcurrent = settings.maxConcurrentDownloads;
    }
  }

  getSettings(): DownloadOptions {
    const settings = this.storage.getString('download_settings');
    if (settings) {
      return JSON.parse(settings);
    }

    return {
      quality: getRecommendedQualityForDevice(),
      downloadLocation: 'internal',
      wifiOnly: false,
      maxConcurrentDownloads: 2,
    };
  }

  private recordTransaction(transaction: any): void {
    const transactions = this.getStoredTransactions();
    transactions.push(transaction);
    this.storage.set('transactions', JSON.stringify(transactions));
  }

  private getStoredTransactions(): any[] {
    const transactionsData = this.storage.getString('transactions');
    return transactionsData ? JSON.parse(transactionsData) : [];
  }

  // Enhanced download methods using the new EnhancedDownloadManager
  async startEnhancedDownload(
    videoData: {
      id: string;
      title: string;
      description?: string;
      thumbnail: string;
      duration: number;
      url: string;
      baseSize?: number;
      contentId: string;
      type: 'video' | 'short' | 'audio';
      price?: number;
    },
    options?: Partial<DownloadOptions>,
  ): Promise<string> {
    // DISABLED FOR PERFORMANCE
    // console.log('🚀 Starting enhanced download:', videoData.title);

    try {
      // Dynamically import EnhancedDownloadManager to avoid circular dependency
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();

      // Create enhanced download with resume and background support
      const enhancedId = await enhancedManager.createDownload(
        videoData.url,
        videoData.title,
        {
          priority: 'high',
          backgroundDownload: true,
          wifiOnly: options?.wifiOnly || false,
          metadata: {
            contentType: 'video/mp4',
            quality: options?.quality?.id || '720p',
            duration: videoData.duration,
            thumbnail: videoData.thumbnail,
            contentId: videoData.contentId,
            type: videoData.type,
          },
        },
      );

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Enhanced download created:', enhancedId);
      return enhancedId;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Enhanced download failed:', error);
      throw error;
    }
  }

  // Enhanced resume functionality
  async resumeEnhancedDownload(downloadId: string): Promise<boolean> {
    // DISABLED FOR PERFORMANCE
    // console.log('▶️ Resuming enhanced download:', downloadId);
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      return enhancedManager.resumeDownload(downloadId);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to resume enhanced download:', error);
      return false;
    }
  }

  // Enhanced pause functionality
  async pauseEnhancedDownload(downloadId: string): Promise<boolean> {
    // DISABLED FOR PERFORMANCE
    // console.log('⏸️ Pausing enhanced download:', downloadId);
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      return enhancedManager.pauseDownload(downloadId);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to pause enhanced download:', error);
      return false;
    }
  }

  // Enhanced cancel functionality
  async cancelEnhancedDownload(downloadId: string): Promise<boolean> {
    // DISABLED FOR PERFORMANCE
    // console.log('❌ Cancelling enhanced download:', downloadId);
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      return enhancedManager.cancelDownload(downloadId);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to cancel enhanced download:', error);
      return false;
    }
  }

  // Get enhanced download details
  async getEnhancedDownload(downloadId: string) {
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      return enhancedManager.getDownload(downloadId);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get enhanced download:', error);
      return null;
    }
  }

  // Get all enhanced downloads
  async getAllEnhancedDownloads() {
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      return enhancedManager.getAllDownloads();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get enhanced downloads:', error);
      return [];
    }
  }

  // Get enhanced download statistics
  async getEnhancedStats() {
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      return enhancedManager.getStats();
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to get enhanced stats:', error);
      return {
        totalDownloads: 0,
        activeDownloads: 0,
        completedDownloads: 0,
        failedDownloads: 0,
        totalSize: 0,
        downloadedSize: 0,
        averageSpeed: 0,
      };
    }
  }

  // Update enhanced download settings
  async updateEnhancedSettings(options: {
    maxConcurrentDownloads?: number;
    wifiOnlyMode?: boolean;
    enableBackgroundDownloads?: boolean;
    storageCleanupThreshold?: number;
  }): Promise<void> {
    // DISABLED FOR PERFORMANCE
    // console.log('⚙️ Updating enhanced download settings:', options);
    try {
      const { default: EnhancedDownloadManager } = await import(
        './EnhancedDownloadManager'
      );
      const enhancedManager = EnhancedDownloadManager.getInstance();
      enhancedManager.updateOptions(options);

      // Also update local settings
      if (options.maxConcurrentDownloads) {
        this.maxConcurrent = options.maxConcurrentDownloads;
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to update enhanced settings:', error);
    }
  }
}

export default DownloadService;
