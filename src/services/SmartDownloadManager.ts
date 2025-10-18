import RNFS from 'react-native-fs';
import { Platform, Alert } from 'react-native';

interface DownloadTask {
  id: string;
  url: string;
  title: string;
  destination: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  totalSize: number;
  downloadedSize: number;
  speed: number;
  eta: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  quality: 'low' | 'medium' | 'high';
  priority: 'low' | 'normal' | 'high';
}

interface DownloadQueue {
  active: DownloadTask[];
  pending: DownloadTask[];
  completed: DownloadTask[];
  failed: DownloadTask[];
}

class SmartDownloadManager {
  private static instance: SmartDownloadManager;
  private queue: DownloadQueue = {
    active: [],
    pending: [],
    completed: [],
    failed: [],
  };
  private maxConcurrentDownloads = 2;
  private downloadSpeed = 0;
  private isProcessing = false;
  private listeners: Map<string, (task: DownloadTask) => void> = new Map();

  private constructor() {
    this.loadQueueFromStorage();
  }

  static getInstance(): SmartDownloadManager {
    if (!SmartDownloadManager.instance) {
      SmartDownloadManager.instance = new SmartDownloadManager();
    }
    return SmartDownloadManager.instance;
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueFile = `${RNFS.ExternalDirectoryPath}/download_queue.json`;
      if (await RNFS.exists(queueFile)) {
        const queueData = await RNFS.readFile(queueFile, 'utf8');
        this.queue = JSON.parse(queueData);
        // DISABLED FOR PERFORMANCE
        // console.log('📦 Loaded download queue from storage');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to load download queue:', error);
    }
  }

  private async saveQueueToStorage(): Promise<void> {
    try {
      const queueFile = `${RNFS.ExternalDirectoryPath}/download_queue.json`;
      await RNFS.writeFile(queueFile, JSON.stringify(this.queue), 'utf8');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to save download queue:', error);
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Start new downloads if we have capacity
      while (
        this.queue.active.length < this.maxConcurrentDownloads &&
        this.queue.pending.length > 0
      ) {
        const task = this.queue.pending.shift();
        if (task) {
          this.queue.active.push(task);
          this.startDownload(task);
        }
      }

      await this.saveQueueToStorage();
    } finally {
      this.isProcessing = false;
    }
  }

  private async startDownload(task: DownloadTask): Promise<void> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log(`🚀 Starting download: ${task.title}`);

      task.status = 'downloading';
      task.startedAt = Date.now();
      this.notifyListeners(task);

      // Simulate download progress (in real implementation, use actual download)
      await this.simulateDownload(task);

      task.status = 'completed';
      task.progress = 100;
      task.completedAt = Date.now();

      // Move to completed queue
      this.queue.active = this.queue.active.filter(t => t.id !== task.id);
      this.queue.completed.push(task);

      this.notifyListeners(task);
      await this.saveQueueToStorage();

      // Continue processing queue
      setTimeout(() => this.processQueue(), 1000);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(`❌ Download failed: ${task.title}`, error);

      task.status = 'failed';
      task.error = error.message;

      this.queue.active = this.queue.active.filter(t => t.id !== task.id);
      this.queue.failed.push(task);

      this.notifyListeners(task);
      await this.saveQueueToStorage();
    }
  }

  private async simulateDownload(task: DownloadTask): Promise<void> {
    const totalSteps = 100;
    const stepDuration = 100; // 100ms per step

    for (let i = 0; i <= totalSteps; i++) {
      if (task.status === 'paused') {
        return; // Pause download
      }

      task.progress = i;
      task.downloadedSize = (task.totalSize * i) / 100;

      // Calculate speed and ETA
      const elapsed = Date.now() - (task.startedAt || Date.now());
      if (elapsed > 0) {
        task.speed = (task.downloadedSize / elapsed) * 1000; // bytes per second
        const remaining = task.totalSize - task.downloadedSize;
        task.eta = remaining / task.speed;
      }

      this.notifyListeners(task);

      if (i < totalSteps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }

  private notifyListeners(task: DownloadTask): void {
    for (const [id, listener] of this.listeners.entries()) {
      try {
        listener(task);
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log(`❌ Listener error for ${id}:`, error);
      }
    }
  }

  async addDownload(
    url: string,
    title: string,
    quality: 'low' | 'medium' | 'high' = 'medium',
    priority: 'low' | 'normal' | 'high' = 'normal',
  ): Promise<string> {
    try {
      const taskId = this.generateTaskId();
      const destination = `${RNFS.ExternalDirectoryPath}/SpredVideos/${title}.mp4`;

      const task: DownloadTask = {
        id: taskId,
        url,
        title,
        destination,
        status: 'pending',
        progress: 0,
        totalSize: 100 * 1024 * 1024, // 100MB default
        downloadedSize: 0,
        speed: 0,
        eta: 0,
        createdAt: Date.now(),
        quality,
        priority,
      };

      // Add to pending queue based on priority
      if (priority === 'high') {
        this.queue.pending.unshift(task);
      } else {
        this.queue.pending.push(task);
      }

      await this.saveQueueToStorage();
      this.processQueue();

      // DISABLED FOR PERFORMANCE - console.(`📥 Added download: ${title} (${quality} quality)`);
      return taskId;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to add download:', error);
      throw error;
    }
  }

  async pauseDownload(taskId: string): Promise<void> {
    const task = this.queue.active.find(t => t.id === taskId);
    if (task) {
      task.status = 'paused';
      this.queue.active = this.queue.active.filter(t => t.id !== taskId);
      this.queue.pending.unshift(task);

      this.notifyListeners(task);
      await this.saveQueueToStorage();

      // DISABLED FOR PERFORMANCE
      // console.log(`⏸️ Paused download: ${task.title}`);
    }
  }

  async resumeDownload(taskId: string): Promise<void> {
    const task = this.queue.pending.find(t => t.id === taskId);
    if (task) {
      task.status = 'pending';
      this.notifyListeners(task);
      await this.saveQueueToStorage();
      this.processQueue();

      // DISABLED FOR PERFORMANCE
      // console.log(`▶️ Resumed download: ${task.title}`);
    }
  }

  async cancelDownload(taskId: string): Promise<void> {
    // Remove from all queues
    this.queue.active = this.queue.active.filter(t => t.id !== taskId);
    this.queue.pending = this.queue.pending.filter(t => t.id !== taskId);
    this.queue.completed = this.queue.completed.filter(t => t.id !== taskId);
    this.queue.failed = this.queue.failed.filter(t => t.id !== taskId);

    await this.saveQueueToStorage();
    // DISABLED FOR PERFORMANCE
    // console.log(`❌ Cancelled download: ${taskId}`);
  }

  async retryFailedDownload(taskId: string): Promise<void> {
    const task = this.queue.failed.find(t => t.id === taskId);
    if (task) {
      task.status = 'pending';
      task.error = undefined;
      task.progress = 0;
      task.downloadedSize = 0;

      this.queue.failed = this.queue.failed.filter(t => t.id !== taskId);
      this.queue.pending.push(task);

      this.notifyListeners(task);
      await this.saveQueueToStorage();
      this.processQueue();

      // DISABLED FOR PERFORMANCE
      // console.log(`🔄 Retrying download: ${task.title}`);
    }
  }

  getQueue(): DownloadQueue {
    return { ...this.queue };
  }

  getTask(taskId: string): DownloadTask | undefined {
    const allTasks = [
      ...this.queue.active,
      ...this.queue.pending,
      ...this.queue.completed,
      ...this.queue.failed,
    ];
    return allTasks.find(t => t.id === taskId);
  }

  addListener(id: string, listener: (task: DownloadTask) => void): void {
    this.listeners.set(id, listener);
  }

  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  async clearCompleted(): Promise<void> {
    this.queue.completed = [];
    await this.saveQueueToStorage();
    // DISABLED FOR PERFORMANCE
    // console.log('🗑️ Cleared completed downloads');
  }

  async clearFailed(): Promise<void> {
    this.queue.failed = [];
    await this.saveQueueToStorage();
    // DISABLED FOR PERFORMANCE
    // console.log('🗑️ Cleared failed downloads');
  }

  async getDownloadStats(): Promise<{
    totalDownloads: number;
    activeDownloads: number;
    pendingDownloads: number;
    completedDownloads: number;
    failedDownloads: number;
    totalSize: number;
    downloadedSize: number;
  }> {
    const allTasks = [
      ...this.queue.active,
      ...this.queue.pending,
      ...this.queue.completed,
      ...this.queue.failed,
    ];

    const totalSize = allTasks.reduce((sum, task) => sum + task.totalSize, 0);
    const downloadedSize = allTasks.reduce(
      (sum, task) => sum + task.downloadedSize,
      0,
    );

    return {
      totalDownloads: allTasks.length,
      activeDownloads: this.queue.active.length,
      pendingDownloads: this.queue.pending.length,
      completedDownloads: this.queue.completed.length,
      failedDownloads: this.queue.failed.length,
      totalSize,
      downloadedSize,
    };
  }

  setMaxConcurrentDownloads(max: number): void {
    this.maxConcurrentDownloads = Math.max(1, Math.min(5, max));
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '...',
    // );
  }

  async optimizeStorage(): Promise<void> {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🔧 Optimizing storage...');

      // Clear old completed downloads
      const cutoffDate = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
      this.queue.completed = this.queue.completed.filter(
        task => task.completedAt && task.completedAt > cutoffDate,
      );

      // Clear old failed downloads
      this.queue.failed = this.queue.failed.filter(
        task => task.createdAt > cutoffDate,
      );

      await this.saveQueueToStorage();
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Storage optimization completed');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Storage optimization failed:', error);
    }
  }
}

export default SmartDownloadManager;
