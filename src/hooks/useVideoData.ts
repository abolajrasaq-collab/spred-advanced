import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../services/QueryClient';
import FastStorage from '../services/FastStorage';
import { getDataJson } from '../helpers/api/Asyncstorage';
import { customHeaders } from '../helpers/api/apiConfig';
import { api } from '../helpers/api/api';
import axios from 'axios';

/**
 * Optimized hooks for video data fetching with caching
 */

interface User {
  token?: string;
  id?: string;
  [key: string]: any;
}

/**
 * Hook to fetch video URL with caching
 */
export const useVideoUrl = (trailerKey: string) => {
  const fastStorage = FastStorage.getInstance();
  
  return useQuery({
    queryKey: queryKeys.video.url(trailerKey),
    queryFn: async () => {
      // Check FastStorage cache first
      const cachedUrl = fastStorage.getVideoUrl(trailerKey);
      if (cachedUrl) {
        return cachedUrl;
      }
      
      // Fetch from API
      const user = await getDataJson<User | null>('User');
      const url = `https://www.spred.cc/Api/ContentManager/Content/play-trailer/${trailerKey}`;
      
      // Cache the result
      fastStorage.cacheVideoUrl(trailerKey, url);
      
      return url;
    },
    enabled: !!trailerKey,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours
    cacheTime: 4 * 60 * 60 * 1000, // 4 hours
  });
};

/**
 * Hook to fetch all videos with caching
 */
export const useAllVideos = () => {
  const fastStorage = FastStorage.getInstance();
  
  return useQuery({
    queryKey: queryKeys.video.lists(),
    queryFn: async () => {
      // Check FastStorage cache first
      const cachedVideos = fastStorage.getContentList('allVideos');
      if (cachedVideos) {
        return cachedVideos;
      }
      
      // Fetch from API
      const user = await getDataJson<User | null>('User');
      const config = { headers: customHeaders(user?.token) };
      const response = await axios.get(api.getAllMovies, config);
      
      const videos = response.data.data || [];
      
      // Cache the result
      fastStorage.cacheContentList('allVideos', videos);
      
      return videos;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 3,
  });
};

/**
 * Hook to fetch video metadata with caching
 */
export const useVideoMetadata = (videoKey: string) => {
  const fastStorage = FastStorage.getInstance();
  
  return useQuery({
    queryKey: queryKeys.video.metadata(videoKey),
    queryFn: async () => {
      // Check FastStorage cache first
      const cachedMetadata = fastStorage.getVideoMetadata(videoKey);
      if (cachedMetadata) {
        return cachedMetadata;
      }
      
      // For now, return basic metadata
      // This can be extended to fetch from API if needed
      const metadata = {
        videoKey,
        cachedAt: Date.now(),
      };
      
      // Cache the result
      fastStorage.cacheVideoMetadata(videoKey, metadata);
      
      return metadata;
    },
    enabled: !!videoKey,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    cacheTime: 48 * 60 * 60 * 1000, // 48 hours
  });
};

/**
 * Hook to manage watch later list with caching
 */
export const useWatchLater = () => {
  const fastStorage = FastStorage.getInstance();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: queryKeys.user.watchLater(),
    queryFn: async () => {
      // Check FastStorage cache first
      const cachedWatchLater = fastStorage.getWatchLater();
      if (cachedWatchLater) {
        return cachedWatchLater;
      }
      
      // Fallback to AsyncStorage
      const watchLater = await getDataJson<any[]>('WatchLater');
      const result = watchLater || [];
      
      // Cache in FastStorage
      fastStorage.cacheWatchLater(result);
      
      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
  
  const addToWatchLaterMutation = useMutation({
    mutationFn: async (video: any) => {
      const currentWatchLater = query.data || [];
      const isAlreadyAdded = currentWatchLater.find(
        v => (v.key || v.videoKey) === (video.videoKey || video.key)
      );
      
      if (isAlreadyAdded) {
        throw new Error('Video already in watch later');
      }
      
      const updatedWatchLater = [...currentWatchLater, video];
      
      // Update both caches
      fastStorage.cacheWatchLater(updatedWatchLater);
      await import('../helpers/api/Asyncstorage').then(({ storeDataJson }) => 
        storeDataJson('WatchLater', updatedWatchLater)
      );
      
      return updatedWatchLater;
    },
    onSuccess: (updatedWatchLater) => {
      // Update the query cache
      queryClient.setQueryData(queryKeys.user.watchLater(), updatedWatchLater);
    },
  });
  
  const removeFromWatchLaterMutation = useMutation({
    mutationFn: async (videoKey: string) => {
      const currentWatchLater = query.data || [];
      const updatedWatchLater = currentWatchLater.filter(
        v => (v.key || v.videoKey) !== videoKey
      );
      
      // Update both caches
      fastStorage.cacheWatchLater(updatedWatchLater);
      await import('../helpers/api/Asyncstorage').then(({ storeDataJson }) => 
        storeDataJson('WatchLater', updatedWatchLater)
      );
      
      return updatedWatchLater;
    },
    onSuccess: (updatedWatchLater) => {
      // Update the query cache
      queryClient.setQueryData(queryKeys.user.watchLater(), updatedWatchLater);
    },
  });
  
  return {
    watchLater: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    addToWatchLater: addToWatchLaterMutation.mutate,
    removeFromWatchLater: removeFromWatchLaterMutation.mutate,
    isAddingToWatchLater: addToWatchLaterMutation.isLoading,
    isRemovingFromWatchLater: removeFromWatchLaterMutation.isLoading,
  };
};

/**
 * Hook to check download status with caching
 */
export const useDownloadStatus = (videoKey: string, title: string) => {
  const fastStorage = FastStorage.getInstance();
  
  return useQuery({
    queryKey: ['downloadStatus', videoKey],
    queryFn: async () => {
      // Check FastStorage cache first
      const cachedStatus = fastStorage.getDownloadStatus(videoKey);
      if (cachedStatus) {
        return cachedStatus;
      }
      
      // Check actual file system (this would be the existing logic)
      // For now, return default status
      const status = {
        isDownloaded: false,
        filePath: undefined,
      };
      
      // Cache the result
      fastStorage.cacheDownloadStatus(videoKey, status.isDownloaded, status.filePath);
      
      return status;
    },
    enabled: !!videoKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
};

/**
 * Hook to fetch suggested/related videos
 */
export const useSuggestedVideos = (currentVideoKey?: string) => {
  const fastStorage = FastStorage.getInstance();
  
  return useQuery({
    queryKey: ['suggestedVideos', currentVideoKey],
    queryFn: async () => {
      const cacheKey = `suggested_${currentVideoKey || 'general'}`;
      
      // Check FastStorage cache first
      const cachedSuggested = fastStorage.getContentList(cacheKey);
      if (cachedSuggested) {
        return cachedSuggested;
      }
      
      // Fetch from API or generate suggestions
      // For now, return empty array - this can be extended
      const suggestions: any[] = [];
      
      // Cache the result
      fastStorage.cacheContentList(cacheKey, suggestions);
      
      return suggestions;
    },
    enabled: true,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
  });
};

/**
 * Hook to prefetch video data for better performance
 */
export const usePrefetchVideo = () => {
  const queryClient = useQueryClient();
  
  const prefetchVideoUrl = (trailerKey: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.video.url(trailerKey),
      staleTime: 2 * 60 * 60 * 1000,
    });
  };
  
  const prefetchVideoMetadata = (videoKey: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.video.metadata(videoKey),
      staleTime: 24 * 60 * 60 * 1000,
    });
  };
  
  return {
    prefetchVideoUrl,
    prefetchVideoMetadata,
  };
};