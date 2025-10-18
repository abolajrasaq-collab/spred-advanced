import { getDataJson, storeDataJson } from '../helpers/api/Asyncstorage';

export interface FollowData {
  userId: string;
  creatorId: string;
  creatorName: string;
  followedAt: string;
  avatar?: string;
}

export interface UserFollowing {
  following: FollowData[];
  followers: string[]; // Array of creator IDs who follow this user
}

export class FollowingService {
  private static readonly STORAGE_KEY = 'UserFollowing';
  private static readonly FOLLOWERS_STORAGE_KEY = 'UserFollowers';

  /**
   * Get user's following list
   */
  static async getUserFollowing(): Promise<UserFollowing> {
    try {
      const following = await getDataJson<UserFollowing>(this.STORAGE_KEY);
      return following || { following: [], followers: [] };
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting user following:', error);
      return { following: [], followers: [] };
    }
  }

  /**
   * Follow a creator
   */
  static async followCreator(
    creatorId: string,
    creatorName: string,
    avatar?: string,
  ): Promise<boolean> {
    try {
      const currentFollowing = await this.getUserFollowing();

      // Check if already following
      const isAlreadyFollowing = currentFollowing.following.some(
        follow => follow.creatorId === creatorId,
      );

      if (isAlreadyFollowing) {
        // DISABLED FOR PERFORMANCE
        // console.log('Already following this creator');
        return false;
      }

      // Add to following list
      const newFollow: FollowData = {
        userId: 'current-user', // In real app, get from user session
        creatorId,
        creatorName,
        followedAt: new Date().toISOString(),
        avatar,
      };

      const updatedFollowing = {
        ...currentFollowing,
        following: [...currentFollowing.following, newFollow],
      };

      await storeDataJson(this.STORAGE_KEY, updatedFollowing);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Successfully followed creator:', creatorName);

      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error following creator:', error);
      return false;
    }
  }

  /**
   * Unfollow a creator
   */
  static async unfollowCreator(creatorId: string): Promise<boolean> {
    try {
      const currentFollowing = await this.getUserFollowing();

      const updatedFollowing = {
        ...currentFollowing,
        following: currentFollowing.following.filter(
          follow => follow.creatorId !== creatorId,
        ),
      };

      await storeDataJson(this.STORAGE_KEY, updatedFollowing);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ Successfully unfollowed creator');

      return true;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error unfollowing creator:', error);
      return false;
    }
  }

  /**
   * Check if user is following a creator
   */
  static async isFollowingCreator(creatorId: string): Promise<boolean> {
    try {
      const userFollowing = await this.getUserFollowing();
      return userFollowing.following.some(
        follow => follow.creatorId === creatorId,
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error checking follow status:', error);
      return false;
    }
  }

  /**
   * Get following count
   */
  static async getFollowingCount(): Promise<number> {
    try {
      const userFollowing = await this.getUserFollowing();
      return userFollowing.following.length;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting following count:', error);
      return 0;
    }
  }

  /**
   * Get followers count (mock data for now)
   */
  static async getFollowersCount(): Promise<number> {
    try {
      const userFollowing = await this.getUserFollowing();
      return userFollowing.followers.length;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting followers count:', error);
      return 0;
    }
  }

  /**
   * Get list of creators user is following
   */
  static async getFollowingList(): Promise<FollowData[]> {
    try {
      const userFollowing = await this.getUserFollowing();
      return userFollowing.following;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error getting following list:', error);
      return [];
    }
  }
}
