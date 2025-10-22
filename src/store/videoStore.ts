import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';

// Create MMKV instance for Zustand persistence
const mmkv = new MMKV({ id: 'video-store' });

const storage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.delete(name);
  },
};

interface VideoState {
  // Current video playback
  currentVideo: any | null;
  isPlaying: boolean;
  playbackPosition: number;
  playbackSpeed: number;
  volume: number;
  
  // Video quality and settings
  videoQuality: 'auto' | 'high' | 'medium' | 'low';
  autoPlay: boolean;
  
  // Download management
  downloadedVideos: any[];
  downloadProgress: Record<string, number>;
  downloadQueue: string[];
  
  // Watch later
  watchLater: any[];
  
  // Recently watched
  recentlyWatched: any[];
  
  // User preferences
  preferredLanguage: string;
  subtitlesEnabled: boolean;
  
  // UI state
  isFullscreen: boolean;
  showControls: boolean;
  
  // Network state
  isOffline: boolean;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

interface VideoActions {
  // Playback actions
  setCurrentVideo: (video: any) => void;
  setPlaybackState: (isPlaying: boolean, position?: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setVideoQuality: (quality: VideoState['videoQuality']) => void;
  
  // Download actions
  addToDownloadQueue: (videoKey: string) => void;
  removeFromDownloadQueue: (videoKey: string) => void;
  updateDownloadProgress: (videoKey: string, progress: number) => void;
  markAsDownloaded: (video: any) => void;
  removeDownloadedVideo: (videoKey: string) => void;
  
  // Watch later actions
  addToWatchLater: (video: any) => void;
  removeFromWatchLater: (videoKey: string) => void;
  clearWatchLater: () => void;
  
  // Recently watched actions
  addToRecentlyWatched: (video: any) => void;
  clearRecentlyWatched: () => void;
  
  // Settings actions
  setAutoPlay: (enabled: boolean) => void;
  setPreferredLanguage: (language: string) => void;
  setSubtitlesEnabled: (enabled: boolean) => void;
  
  // UI actions
  setFullscreen: (isFullscreen: boolean) => void;
  setShowControls: (show: boolean) => void;
  
  // Network actions
  setNetworkState: (isOffline: boolean, quality: VideoState['networkQuality']) => void;
  
  // Utility actions
  resetVideoState: () => void;
  getVideoById: (videoKey: string) => any | null;
  isVideoInWatchLater: (videoKey: string) => boolean;
  isVideoDownloaded: (videoKey: string) => boolean;
}

type VideoStore = VideoState & VideoActions;

const initialState: VideoState = {
  currentVideo: null,
  isPlaying: false,
  playbackPosition: 0,
  playbackSpeed: 1,
  volume: 1,
  videoQuality: 'auto',
  autoPlay: false,
  downloadedVideos: [],
  downloadProgress: {},
  downloadQueue: [],
  watchLater: [],
  recentlyWatched: [],
  preferredLanguage: 'en',
  subtitlesEnabled: false,
  isFullscreen: false,
  showControls: true,
  isOffline: false,
  networkQuality: 'excellent',
};

export const useVideoStore = create<VideoStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Playback actions
      setCurrentVideo: (video) => {
        set({ currentVideo: video });
        
        // Add to recently watched
        const state = get();
        const recentlyWatched = state.recentlyWatched.filter(
          v => (v.key || v.videoKey) !== (video.videoKey || video.key)
        );
        recentlyWatched.unshift(video);
        
        // Keep only last 50 recently watched
        set({ recentlyWatched: recentlyWatched.slice(0, 50) });
      },
      
      setPlaybackState: (isPlaying, position) => {
        set(state => ({
          isPlaying,
          ...(position !== undefined && { playbackPosition: position }),
        }));
      },
      
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      setVolume: (volume) => set({ volume }),
      setVideoQuality: (quality) => set({ videoQuality: quality }),
      
      // Download actions
      addToDownloadQueue: (videoKey) => {
        set(state => ({
          downloadQueue: state.downloadQueue.includes(videoKey) 
            ? state.downloadQueue 
            : [...state.downloadQueue, videoKey]
        }));
      },
      
      removeFromDownloadQueue: (videoKey) => {
        set(state => ({
          downloadQueue: state.downloadQueue.filter(key => key !== videoKey)
        }));
      },
      
      updateDownloadProgress: (videoKey, progress) => {
        set(state => ({
          downloadProgress: {
            ...state.downloadProgress,
            [videoKey]: progress
          }
        }));
      },
      
      markAsDownloaded: (video) => {
        set(state => ({
          downloadedVideos: state.downloadedVideos.find(
            v => (v.key || v.videoKey) === (video.videoKey || video.key)
          ) ? state.downloadedVideos : [...state.downloadedVideos, video],
          downloadQueue: state.downloadQueue.filter(
            key => key !== (video.videoKey || video.key)
          ),
          downloadProgress: {
            ...state.downloadProgress,
            [(video.videoKey || video.key)]: 100
          }
        }));
      },
      
      removeDownloadedVideo: (videoKey) => {
        set(state => ({
          downloadedVideos: state.downloadedVideos.filter(
            v => (v.key || v.videoKey) !== videoKey
          ),
          downloadProgress: Object.fromEntries(
            Object.entries(state.downloadProgress).filter(([key]) => key !== videoKey)
          )
        }));
      },
      
      // Watch later actions
      addToWatchLater: (video) => {
        set(state => ({
          watchLater: state.watchLater.find(
            v => (v.key || v.videoKey) === (video.videoKey || video.key)
          ) ? state.watchLater : [...state.watchLater, video]
        }));
      },
      
      removeFromWatchLater: (videoKey) => {
        set(state => ({
          watchLater: state.watchLater.filter(
            v => (v.key || v.videoKey) !== videoKey
          )
        }));
      },
      
      clearWatchLater: () => set({ watchLater: [] }),
      
      // Recently watched actions
      addToRecentlyWatched: (video) => {
        set(state => {
          const filtered = state.recentlyWatched.filter(
            v => (v.key || v.videoKey) !== (video.videoKey || video.key)
          );
          return {
            recentlyWatched: [video, ...filtered].slice(0, 50)
          };
        });
      },
      
      clearRecentlyWatched: () => set({ recentlyWatched: [] }),
      
      // Settings actions
      setAutoPlay: (enabled) => set({ autoPlay: enabled }),
      setPreferredLanguage: (language) => set({ preferredLanguage: language }),
      setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
      
      // UI actions
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      setShowControls: (show) => set({ showControls: show }),
      
      // Network actions
      setNetworkState: (isOffline, quality) => set({ isOffline, networkQuality: quality }),
      
      // Utility actions
      resetVideoState: () => set(initialState),
      
      getVideoById: (videoKey) => {
        const state = get();
        return state.downloadedVideos.find(
          v => (v.key || v.videoKey) === videoKey
        ) || state.watchLater.find(
          v => (v.key || v.videoKey) === videoKey
        ) || state.recentlyWatched.find(
          v => (v.key || v.videoKey) === videoKey
        ) || null;
      },
      
      isVideoInWatchLater: (videoKey) => {
        const state = get();
        return state.watchLater.some(v => (v.key || v.videoKey) === videoKey);
      },
      
      isVideoDownloaded: (videoKey) => {
        const state = get();
        return state.downloadedVideos.some(v => (v.key || v.videoKey) === videoKey);
      },
    }),
    {
      name: 'video-store',
      storage: createJSONStorage(() => storage),
      // Only persist important data, not UI state
      partialize: (state) => ({
        watchLater: state.watchLater,
        downloadedVideos: state.downloadedVideos,
        recentlyWatched: state.recentlyWatched,
        playbackPosition: state.playbackPosition,
        videoQuality: state.videoQuality,
        autoPlay: state.autoPlay,
        preferredLanguage: state.preferredLanguage,
        subtitlesEnabled: state.subtitlesEnabled,
        volume: state.volume,
        playbackSpeed: state.playbackSpeed,
      }),
    }
  )
);

// Selectors for better performance
export const videoSelectors = {
  currentVideo: (state: VideoStore) => state.currentVideo,
  isPlaying: (state: VideoStore) => state.isPlaying,
  watchLater: (state: VideoStore) => state.watchLater,
  downloadedVideos: (state: VideoStore) => state.downloadedVideos,
  recentlyWatched: (state: VideoStore) => state.recentlyWatched,
  downloadProgress: (state: VideoStore) => state.downloadProgress,
  isVideoInWatchLater: (videoKey: string) => (state: VideoStore) => 
    state.isVideoInWatchLater(videoKey),
  isVideoDownloaded: (videoKey: string) => (state: VideoStore) => 
    state.isVideoDownloaded(videoKey),
};

export default useVideoStore;