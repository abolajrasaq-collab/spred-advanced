import { MMKV } from 'react-native-mmkv';
import * as RNFS from 'react-native-fs';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
// import NetInfo from '@react-native-community/netinfo';

export interface EnhancedDownloadItem {
  id: string;
  title: string;
  url: string;
  filePath: string;
  size: number;
  downloadedSize: number;
  progress: number;
  status:
    | 'queued'
    | 'downloading'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  lastProgressAt?: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  resumeSupported: boolean;
  canResumeFrom: number;
  error?: string;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
  backgroundDownload: boolean;
  wifiOnly: boolean;
  metadata?: {
    thumbnail?: string;
    duration?: number;
    quality?: string;
    contentType?: string;
    headers?: Record<string, string>;
  };
}

export interface DownloadManagerOptions {
  maxConcurrentDownloads: number;
  maxRetries: number;
  retryDelay: number;
  chunkSize: number;
  timeoutInterval: number;
  enableBackgroundDownloads: boolean;
  wifiOnlyMode: boolean;
  autoResumeOnNetworkReconnect: boolean;
  storageCleanupThreshold: number; // MB
}

export class EnhancedDownloadManager {
  private static instance: EnhancedDownloadManager;
  private storage: MMKV;
  private downloads: Map<string, EnhancedDownloadItem> = new Map();
  private activeDownloads: Map<string, any> = new Map();
  private downloadQueue: string[] = [];
  private isProcessingQueue = false;
  private appState: AppStateStatus = 'active';
  private networkInfo: any = null;

  private options: DownloadManagerOptions = {
    maxConcurrentDownloads: 3,
    maxRetries: 3,
    retryDelay: 2000,
    chunkSize: 1024 * 1024, // 1MB chunks
    timeoutInterval: 30000,
    enableBackgroundDownloads: true,
    wifiOnlyMode: false,
    autoResumeOnNetworkReconnect: true,
    storageCleanupThreshold: 500, // 500MB
  };

  private constructor() {
    this.storage = new MMKV({ id: 'enhanced-downloads' });
    this.loadDownloads();
    this.setupNetworkListener();
    this.setupAppStateListener();
    this.setupStorageCleanup();
  }

  static getInstance(): EnhancedDownloadManager {
    if (!EnhancedDownloadManager.instance) {
      EnhancedDownloadManager.instance = new EnhancedDownloadManager();
    }
    return EnhancedDownloadManager.instance;
  }

  // Load downloads from persistent storage
  private loadDownloads(): void {
    const downloadsData = this.storage.getString('downloads');
    if (downloadsData) {
      try {
        const downloads: EnhancedDownloadItem[] = JSON.parse(downloadsData);
        downloads.forEach(download => {
          this.downloads.set(download.id, download);
          if (download.status === 'downloading') {
            // Reset downloading status on app restart
            download.status = 'paused';
          }
        });
        // DISABLED FOR PERFORMANCE
        // console.log(`📥 Loaded ${downloads.length} downloads from storage`);
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Failed to load downloads:', error);
      }
    }
  }

  // Save downloads to persistent storage
  private saveDownloads(): void {
    const downloads = Array.from(this.downloads.values());
    this.storage.set('downloads', JSON.stringify(downloads));
  }

  // Network state monitoring
  private setupNetworkListener(): void {
    // NetInfo.addEventListener(state => {
    //   const wasConnected = this.networkInfo?.isConnected;
    //   this.networkInfo = state;
    //   if (!wasConnected && state.isConnected && this.options.autoResumeOnNetworkReconnect) {
    //     // DISABLED FOR PERFORMANCE
    // console.log('📶 Network reconnected - resuming paused downloads');
    //     this.resumeAllPausedDownloads();
    //   }
    //   if (this.options.wifiOnlyMode && state.type !== 'wifi' && state.isConnected) {
    //     // DISABLED FOR PERFORMANCE
    // console.log('📶 Non-WiFi connection detected - pausing WiFi-only downloads');
    //     this.pauseWifiOnlyDownloads();
    //   }
    // });
    // DISABLED FOR PERFORMANCE
    // console.log('⚠️ Network monitoring disabled - NetInfo not available');
  }

  // App state monitoring for background downloads
  private setupAppStateListener(): void {
    AppState.addEventListener('change', nextAppState => {
      this.appState = nextAppState;

      if (
        nextAppState === 'background' &&
        this.options.enableBackgroundDownloads
      ) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );
        this.enableBackgroundMode();
      } else if (nextAppState === 'active') {
        // DISABLED FOR PERFORMANCE
        // console.log('📱 App moved to foreground - resuming normal downloads');
        this.disableBackgroundMode();
      }
    });
  }

  // Storage cleanup
  private setupStorageCleanup(): void {
    setInterval(() => {
      this.performStorageCleanup();
    }, 60000 * 30); // Every 30 minutes
  }

  // Create new download
  async createDownload(
    url: string,
    title: string,
    options: {
      filePath?: string;
      priority?: 'high' | 'normal' | 'low';
      backgroundDownload?: boolean;
      wifiOnly?: boolean;
      metadata?: any;
    } = {},
  ): Promise<string> {
    const downloadId = `dl_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Generate file path if not provided
    const fileName = options.filePath || this.generateFileName(title, url);
    const downloadDir = `${RNFS.ExternalDirectoryPath}/SpredVideos`;
    await RNFS.mkdir(downloadDir);
    const fullPath = `${downloadDir}/${fileName}`;

    // Check if file already exists
    if (await RNFS.exists(fullPath)) {
      const stat = await RNFS.stat(fullPath);
      // DISABLED FOR PERFORMANCE - console.(`📁 File already exists: ${fullPath} (${stat.size} bytes)`);
    }

    // Get file size from server
    let fileSize = 0;
    let resumeSupported = false;
    let canResumeFrom = 0;

    try {
      const headResponse = await this.getFileInfo(url);
      fileSize = headResponse.size;
      resumeSupported = headResponse.acceptRanges;

      // Check if partial file exists for resume
      if (await RNFS.exists(fullPath)) {
        const stat = await RNFS.stat(fullPath);
        canResumeFrom = stat.size;
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Could not get file info:', error.message);
    }

    const download: EnhancedDownloadItem = {
      id: downloadId,
      title,
      url,
      filePath: fullPath,
      size: fileSize,
      downloadedSize: canResumeFrom,
      progress: fileSize > 0 ? (canResumeFrom / fileSize) * 100 : 0,
      status: 'queued',
      createdAt: Date.now(),
      speed: 0,
      estimatedTimeRemaining: 0,
      resumeSupported,
      canResumeFrom,
      retryCount: 0,
      maxRetries: this.options.maxRetries,
      priority: options.priority || 'normal',
      backgroundDownload: options.backgroundDownload || false,
      wifiOnly: options.wifiOnly || false,
      metadata: options.metadata,
    };

    this.downloads.set(downloadId, download);
    this.downloadQueue.push(downloadId);
    this.saveDownloads();

    // DISABLED FOR PERFORMANCE - console.(`📥 Created download: ${title} (${downloadId})`);
    this.processQueue();

    return downloadId;
  }

  // Get file information for resume support
  private async getFileInfo(
    url: string,
  ): Promise<{ size: number; acceptRanges: boolean }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('HEAD', url);
      xhr.timeout = this.options.timeoutInterval;

      xhr.onload = () => {
        const size = parseInt(
          xhr.getResponseHeader('content-length') || '0',
          10,
        );
        const acceptRanges = xhr.getResponseHeader('accept-ranges') === 'bytes';
        resolve({ size, acceptRanges });
      };

      xhr.onerror = () => reject(new Error('Failed to get file info'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      xhr.send();
    });
  }

  // Process download queue
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Check network conditions
      if (this.options.wifiOnlyMode && this.networkInfo?.type !== 'wifi') {
        // DISABLED FOR PERFORMANCE
        // console.log('📶 WiFi-only mode active, waiting for WiFi connection');
        return;
      }

      // Get active downloads count
      const activeCount = Array.from(this.downloads.values()).filter(
        d => d.status === 'downloading',
      ).length;

      if (activeCount >= this.options.maxConcurrentDownloads) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   `📥 Max concurrent downloads reached (${activeCount}/${this.options.maxConcurrentDownloads})`,
        // );
        return;
      }

      // Find next download to process (priority order)
      const queuedDownloads = this.downloadQueue
        .map(id => this.downloads.get(id))
        .filter(d => d && d.status === 'queued')
        .sort((a, b) => {
          const priorityOrder = { high: 0, normal: 1, low: 2 };
          return priorityOrder[a!.priority] - priorityOrder[b!.priority];
        });

      const nextDownload = queuedDownloads[0];
      if (nextDownload) {
        await this.startDownload(nextDownload.id);
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // Start individual download
  private async startDownload(downloadId: string): Promise<void> {
    const download = this.downloads.get(downloadId);
    if (!download) {
      return;
    }

    // DISABLED FOR PERFORMANCE
    // console.log(`🚀 Starting download: ${download.title}`);

    download.status = 'downloading';
    download.startedAt = Date.now();
    download.lastProgressAt = Date.now();
    this.saveDownloads();

    try {
      await this.performDownload(download);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(`❌ Download failed: ${download.title}`, error);
      await this.handleDownloadError(download, error);
    }
  }

  // Perform actual download with resume support
  private async performDownload(download: EnhancedDownloadItem): Promise<void> {
    const { url, filePath, canResumeFrom } = download;

    const downloadOptions: any = {
      fromUrl: url,
      toFile: filePath,
      connectionTimeout: this.options.timeoutInterval,
      readTimeout: this.options.timeoutInterval,
      progressDivider: 10,
    };

    // Add resume headers if supported
    if (download.resumeSupported && canResumeFrom > 0) {
      downloadOptions.headers = {
        Range: `bytes=${canResumeFrom}-`,
      };
      // DISABLED FOR PERFORMANCE
      // console.log(`🔄 Resuming download from byte ${canResumeFrom}`);
    }

    // Progress callback
    downloadOptions.progress = (res: any) => {
      const totalBytes = res.contentLength + canResumeFrom;
      const receivedBytes = res.bytesWritten + canResumeFrom;

      download.size = totalBytes;
      download.downloadedSize = receivedBytes;
      download.progress =
        totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0;

      // Calculate speed and ETA
      const now = Date.now();
      const timeDiff = (now - download.lastProgressAt!) / 1000;
      if (timeDiff > 0) {
        download.speed =
          (res.bytesWritten - (download.downloadedSize - canResumeFrom)) /
          timeDiff;
        const remainingBytes = totalBytes - receivedBytes;
        download.estimatedTimeRemaining =
          download.speed > 0 ? remainingBytes / download.speed : 0;
      }

      download.lastProgressAt = now;
      this.saveDownloads();
    };

    // Begin callback
    downloadOptions.begin = (res: any) => {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   `📊 Download started - Total size: ${(
      //     (res.contentLength + canResumeFrom) /
      //     1024 /
      //     1024
      //   ).toFixed(2)} MB`,
      // );
    };

    // Start download
    const result = await RNFS.downloadFile(downloadOptions).promise;

    if (result.statusCode === 200 || result.statusCode === 206) {
      // 206 for partial content
      download.status = 'completed';
      download.completedAt = Date.now();
      download.progress = 100;
      // DISABLED FOR PERFORMANCE
      // console.log(`✅ Download completed: ${download.title}`);
    } else {
      throw new Error(`HTTP ${result.statusCode}: Download failed`);
    }

    this.saveDownloads();
    this.processQueue(); // Start next download
  }

  // Handle download errors and retries
  private async handleDownloadError(
    download: EnhancedDownloadItem,
    error: any,
  ): Promise<void> {
    download.retryCount++;
    download.error = error.message;

    if (download.retryCount >= download.maxRetries) {
      download.status = 'failed';
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   `❌ Download failed permanently: ${download.title} (${download.retryCount}/${download.maxRetries} retries)`,
      // );
    } else {
      download.status = 'paused';
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   `⏸️ Download paused for retry: ${download.title} (${download.retryCount}/${download.maxRetries})`,
      // );

      // Schedule retry
      setTimeout(() => {
        if (download.status === 'paused') {
          this.resumeDownload(download.id);
        }
      }, this.options.retryDelay * download.retryCount);
    }

    this.saveDownloads();
    this.processQueue(); // Start next download
  }

  // Resume download
  resumeDownload(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    if (
      !download ||
      (download.status !== 'paused' && download.status !== 'failed')
    ) {
      return false;
    }

    // DISABLED FOR PERFORMANCE
    // console.log(`▶️ Resuming download: ${download.title}`);
    download.status = 'queued';

    if (!this.downloadQueue.includes(downloadId)) {
      this.downloadQueue.push(downloadId);
    }

    this.saveDownloads();
    this.processQueue();
    return true;
  }

  // Pause download
  pauseDownload(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    if (!download || download.status !== 'downloading') {
      return false;
    }

    // DISABLED FOR PERFORMANCE
    // console.log(`⏸️ Pausing download: ${download.title}`);
    download.status = 'paused';

    // Cancel active download
    const activeDownload = this.activeDownloads.get(downloadId);
    if (activeDownload && activeDownload.cancel) {
      activeDownload.cancel();
    }

    this.activeDownloads.delete(downloadId);
    this.saveDownloads();
    return true;
  }

  // Cancel download
  cancelDownload(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    if (!download) {
      return false;
    }

    // DISABLED FOR PERFORMANCE
    // console.log(`❌ Cancelling download: ${download.title}`);

    // Cancel active download
    const activeDownload = this.activeDownloads.get(downloadId);
    if (activeDownload && activeDownload.cancel) {
      activeDownload.cancel();
    }

    // Remove from queue
    const queueIndex = this.downloadQueue.indexOf(downloadId);
    if (queueIndex > -1) {
      this.downloadQueue.splice(queueIndex, 1);
    }

    // Delete partial file
    RNFS.unlink(download.filePath).catch(() => {});

    this.downloads.delete(downloadId);
    this.activeDownloads.delete(downloadId);
    this.saveDownloads();
    return true;
  }

  // Resume all paused downloads
  private resumeAllPausedDownloads(): void {
    Array.from(this.downloads.values())
      .filter(d => d.status === 'paused')
      .forEach(d => this.resumeDownload(d.id));
  }

  // Pause WiFi-only downloads when not on WiFi
  private pauseWifiOnlyDownloads(): void {
    Array.from(this.downloads.values())
      .filter(d => d.wifiOnly && d.status === 'downloading')
      .forEach(d => this.pauseDownload(d.id));
  }

  // Enable background download mode
  private enableBackgroundMode(): void {
    // DISABLED FOR PERFORMANCE
    // console.log('🌙 Enabling background download mode');
    // Reduce concurrent downloads and chunk sizes for background mode
    this.options.maxConcurrentDownloads = Math.min(
      2,
      this.options.maxConcurrentDownloads,
    );
  }

  // Disable background download mode
  private disableBackgroundMode(): void {
    // DISABLED FOR PERFORMANCE
    // console.log('☀️ Disabling background download mode');
    // Restore normal settings
    this.options.maxConcurrentDownloads = 3;
  }

  // Storage cleanup
  private async performStorageCleanup(): Promise<void> {
    try {
      const downloadsDir = `${RNFS.ExternalDirectoryPath}/SpredVideos`;
      const files = await RNFS.readDir(downloadsDir);

      let totalSize = 0;
      const fileList = [];

      for (const file of files) {
        const stat = await RNFS.stat(file.path);
        totalSize += stat.size;
        fileList.push({
          path: file.path,
          size: stat.size,
          modified: stat.mtime,
        });
      }

      const totalSizeMB = totalSize / 1024 / 1024;
      // DISABLED FOR PERFORMANCE - console.(`📊 Storage usage: ${totalSizeMB.toFixed(2)} MB`);

      if (totalSizeMB > this.options.storageCleanupThreshold) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );

        // Sort by modification date (oldest first)
        fileList.sort(
          (a, b) =>
            new Date(a.modified).getTime() - new Date(b.modified).getTime(),
        );

        // Remove oldest files until under threshold
        let sizeToRemove =
          (totalSizeMB - this.options.storageCleanupThreshold * 0.8) *
          1024 *
          1024;

        for (const file of fileList) {
          if (sizeToRemove <= 0) {
            break;
          }

          try {
            await RNFS.unlink(file.path);
            sizeToRemove -= file.size;
            // DISABLED FOR PERFORMANCE
            // console.log(`🗑️ Removed old file: ${file.path}`);
          } catch (error) {
            // DISABLED FOR PERFORMANCE
            // console.log(`⚠️ Could not remove file: ${file.path}`);
          }
        }
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Storage cleanup failed:', error);
    }
  }

  // Utility methods
  private generateFileName(title: string, url: string): string {
    const safeName = title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50);
    const extension = url.split('.').pop()?.split('?')[0] || 'mp4';
    return `${safeName || 'download'}.${extension}`;
  }

  // Public getters
  getDownload(downloadId: string): EnhancedDownloadItem | undefined {
    return this.downloads.get(downloadId);
  }

  getAllDownloads(): EnhancedDownloadItem[] {
    return Array.from(this.downloads.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }

  getActiveDownloads(): EnhancedDownloadItem[] {
    return this.getAllDownloads().filter(d =>
      ['queued', 'downloading', 'paused'].includes(d.status),
    );
  }

  getCompletedDownloads(): EnhancedDownloadItem[] {
    return this.getAllDownloads().filter(d => d.status === 'completed');
  }

  // Configuration
  updateOptions(newOptions: Partial<DownloadManagerOptions>): void {
    this.options = { ...this.options, ...newOptions };
    // DISABLED FOR PERFORMANCE
    // console.log('⚙️ Download manager options updated:', newOptions);
  }

  getOptions(): DownloadManagerOptions {
    return { ...this.options };
  }

  // Statistics
  getStats(): {
    totalDownloads: number;
    activeDownloads: number;
    completedDownloads: number;
    failedDownloads: number;
    totalSize: number;
    downloadedSize: number;
    averageSpeed: number;
  } {
    const all = this.getAllDownloads();
    const active = all.filter(d =>
      ['queued', 'downloading'].includes(d.status),
    );
    const completed = all.filter(d => d.status === 'completed');
    const failed = all.filter(d => d.status === 'failed');

    const totalSize = all.reduce((sum, d) => sum + d.size, 0);
    const downloadedSize = all.reduce((sum, d) => sum + d.downloadedSize, 0);
    const averageSpeed =
      active.length > 0
        ? active.reduce((sum, d) => sum + d.speed, 0) / active.length
        : 0;

    return {
      totalDownloads: all.length,
      activeDownloads: active.length,
      completedDownloads: completed.length,
      failedDownloads: failed.length,
      totalSize,
      downloadedSize,
      averageSpeed,
    };
  }
}

export default EnhancedDownloadManager;
