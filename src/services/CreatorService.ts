import { getDataJson, storeDataJson } from '../helpers/api/Asyncstorage';

export interface CreatorStats {
  uploadedVideos: number;
  subscribersCount: number;
  totalViews: number;
  totalDownloads: number;
  offlineShares: number;
  totalRevenue: number;
  monthlyRevenue: number;
  videoStats: VideoStat[];
}

export interface VideoStat {
  id: string;
  title: string;
  uploadDate: string;
  views: number;
  downloads: number;
  shares: number;
  revenue: number;
  watchTime: number; // in minutes
  videoType: 'video' | 'short' | 'livestream';
}

class CreatorService {
  private static instance: CreatorService;
  private readonly STORAGE_KEY = 'creator_stats';

  static getInstance(): CreatorService {
    if (!CreatorService.instance) {
      CreatorService.instance = new CreatorService();
    }
    return CreatorService.instance;
  }

  async getCreatorStats(): Promise<CreatorStats> {
    try {
      const stored = await getDataJson(this.STORAGE_KEY);
      if (stored && this.isValidCreatorStats(stored)) {
        return stored as CreatorStats;
      }
      return this.createEmptyStats();
    } catch (error) {
      return this.createEmptyStats();
    }
  }

  private isValidCreatorStats(data: any): boolean {
    return (
      data &&
      typeof data.uploadedVideos === 'number' &&
      typeof data.subscribersCount === 'number' &&
      typeof data.totalViews === 'number' &&
      typeof data.totalDownloads === 'number' &&
      typeof data.offlineShares === 'number' &&
      typeof data.totalRevenue === 'number' &&
      typeof data.monthlyRevenue === 'number' &&
      Array.isArray(data.videoStats)
    );
  }

  private createEmptyStats(): CreatorStats {
    return {
      uploadedVideos: 3,
      subscribersCount: 1250,
      totalViews: 45680,
      totalDownloads: 2340,
      offlineShares: 567,
      totalRevenue: 35750,
      monthlyRevenue: 8940,
      videoStats: [
        {
          id: '1',
          title: 'Family Hustle',
          uploadDate: '2024-01-15',
          views: 12500,
          downloads: 450,
          shares: 120,
          revenue: 5100,
          watchTime: 12500,
          videoType: 'video',
        },
        {
          id: '2',
          title: 'Money Fever',
          uploadDate: '2024-01-16',
          views: 32000,
          downloads: 890,
          shares: 250,
          revenue: 10200,
          watchTime: 3200,
          videoType: 'short',
        },
        {
          id: '3',
          title: 'Ogbanje Princess',
          uploadDate: '2024-01-17',
          views: 8900,
          downloads: 230,
          shares: 80,
          revenue: 2700,
          watchTime: 8900,
          videoType: 'livestream',
        },
        {
          id: '4',
          title: 'Life of Hadejia',
          uploadDate: '2024-01-14',
          views: 15600,
          downloads: 560,
          shares: 180,
          revenue: 6800,
          watchTime: 15600,
          videoType: 'video',
        },
        {
          id: '5',
          title: 'Ministry of Blood',
          uploadDate: '2024-01-13',
          views: 28700,
          downloads: 670,
          shares: 290,
          revenue: 8200,
          watchTime: 4300,
          videoType: 'short',
        },
      ],
    };
  }

  async trackVideoUpload(
    videoData: Partial<VideoStat>,
    videoType: 'video' | 'short' | 'livestream' = 'video',
  ): Promise<void> {
    const stats = await this.getCreatorStats();
    const newVideo: VideoStat = {
      id: Date.now().toString(),
      title: videoData.title || 'Untitled Video',
      uploadDate: new Date().toISOString().split('T')[0],
      views: 0,
      downloads: 0,
      shares: 0,
      revenue: 0,
      watchTime: 0,
      videoType: videoType,
    };

    stats.videoStats.unshift(newVideo);
    stats.uploadedVideos = stats.videoStats.length;
    await this.saveStats(stats);
  }

  async trackVideoDownload(videoId: string): Promise<void> {
    const stats = await this.getCreatorStats();
    const video = stats.videoStats.find(v => v.id === videoId);
    if (video) {
      video.downloads += 1;
      video.revenue += 10; // 10 tokens per download
      stats.totalDownloads += 1;
      stats.totalRevenue += 10;
      await this.saveStats(stats);
    }
  }

  async trackOfflineShare(videoId: string): Promise<void> {
    const stats = await this.getCreatorStats();
    const video = stats.videoStats.find(v => v.id === videoId);
    if (video) {
      video.shares += 1;
      video.revenue += 5; // 5 tokens per share
      stats.offlineShares += 1;
      stats.totalRevenue += 5;
      await this.saveStats(stats);
    }
  }

  async trackVideoView(
    videoId: string,
    watchTimeMinutes: number,
  ): Promise<void> {
    const stats = await this.getCreatorStats();
    const video = stats.videoStats.find(v => v.id === videoId);
    if (video) {
      video.views += 1;
      video.watchTime += watchTimeMinutes;
      stats.totalViews += 1;
      await this.saveStats(stats);
    }
  }

  private async saveStats(stats: CreatorStats): Promise<void> {
    try {
      await storeDataJson(this.STORAGE_KEY, stats);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error saving creator stats:', error);
    }
  }
}

export default CreatorService;
