import { getDataJson, storeDataJson } from '../helpers/api/Asyncstorage';

export interface UserMetrics {
  videosWatched: number;
  watchTime: number; // in minutes
  dayStreak: number;
  lastWatchDate?: string;
  dailyWatchTime?: { [date: string]: number }; // Track watch time per day
}

export class UserMetricsService {
  private static readonly STORAGE_KEY = 'UserMetrics';

  /**
   * Get current user metrics from storage
   */
  static async getUserMetrics(): Promise<UserMetrics> {
    try {
      const metrics = await getDataJson<UserMetrics>(this.STORAGE_KEY);
      return (
        metrics || {
          videosWatched: 0,
          watchTime: 0,
          dayStreak: 0,
        }
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting user metrics:', error);
      return {
        videosWatched: 0,
        watchTime: 0,
        dayStreak: 0,
      };
    }
  }

  /**
   * Update metrics when a video is watched
   */
  static async updateVideoWatched(durationMinutes: number = 0): Promise<void> {
    try {
      const currentMetrics = await this.getUserMetrics();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Update videos watched count
      const newVideosWatched = currentMetrics.videosWatched + 1;

      // Update watch time
      const newWatchTime = currentMetrics.watchTime + durationMinutes;

      // Update daily watch time
      const dailyWatchTime = currentMetrics.dailyWatchTime || {};
      dailyWatchTime[today] = (dailyWatchTime[today] || 0) + durationMinutes;

      // Calculate day streak
      const newDayStreak = this.calculateDayStreak(dailyWatchTime, today);

      const updatedMetrics: UserMetrics = {
        videosWatched: newVideosWatched,
        watchTime: newWatchTime,
        dayStreak: newDayStreak,
        lastWatchDate: today,
        dailyWatchTime,
      };

      await storeDataJson(this.STORAGE_KEY, updatedMetrics);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ User metrics updated:', updatedMetrics);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error updating video watched metrics:', error);
    }
  }

  /**
   * Update watch time while video is playing
   */
  static async updateWatchTime(watchTimeMinutes: number): Promise<void> {
    try {
      const currentMetrics = await this.getUserMetrics();
      const today = new Date().toISOString().split('T')[0];

      // Update daily watch time
      const dailyWatchTime = currentMetrics.dailyWatchTime || {};
      dailyWatchTime[today] = Math.max(
        dailyWatchTime[today] || 0,
        watchTimeMinutes,
      );

      // Calculate new day streak
      const newDayStreak = this.calculateDayStreak(dailyWatchTime, today);

      const updatedMetrics: UserMetrics = {
        ...currentMetrics,
        watchTime: Math.max(currentMetrics.watchTime, watchTimeMinutes),
        dayStreak: newDayStreak,
        lastWatchDate: today,
        dailyWatchTime,
      };

      await storeDataJson(this.STORAGE_KEY, updatedMetrics);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error updating watch time:', error);
    }
  }

  /**
   * Calculate day streak based on daily watch time
   */
  private static calculateDayStreak(
    dailyWatchTime: { [date: string]: number },
    today: string,
  ): number {
    const dates = Object.keys(dailyWatchTime).sort();
    let streak = 0;
    let currentDate = new Date(today);

    // Count consecutive days with watch time
    for (let i = dates.length - 1; i >= 0; i--) {
      const dateStr = dates[i];
      const date = new Date(dateStr);

      // Check if this date is consecutive with currentDate
      const dayDiff = Math.floor(
        (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (dayDiff === streak) {
        // Check if user watched for at least 1 minute on this day
        if (dailyWatchTime[dateStr] >= 1) {
          streak++;
          currentDate = date;
        } else {
          break; // Break streak if no significant watch time
        }
      } else if (dayDiff === 0) {
        // Same day, continue
        currentDate = date;
      } else {
        break; // Gap in dates, break streak
      }
    }

    return streak;
  }

  /**
   * Reset metrics (for testing or user request)
   */
  static async resetMetrics(): Promise<void> {
    try {
      const emptyMetrics: UserMetrics = {
        videosWatched: 0,
        watchTime: 0,
        dayStreak: 0,
      };
      await storeDataJson(this.STORAGE_KEY, emptyMetrics);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ User metrics reset');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error resetting metrics:', error);
    }
  }
}
