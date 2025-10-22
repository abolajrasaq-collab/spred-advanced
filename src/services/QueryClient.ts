import { QueryClient } from '@tanstack/react-query';
import FastStorage from './FastStorage';

/**
 * React Query Client Configuration
 * Optimized for VOD/streaming app with aggressive caching
 */

// Create a custom persister using our FastStorage
const createQueryPersister = () => {
  const fastStorage = FastStorage.getInstance();
  
  return {
    persistClient: async (client: any) => {
      try {
        fastStorage.cacheSetting('react-query-cache', client);
      } catch (error) {
        console.warn('Failed to persist query cache:', error);
      }
    },
    
    restoreClient: async () => {
      try {
        return fastStorage.getSetting('react-query-cache');
      } catch (error) {
        console.warn('Failed to restore query cache:', error);
        return undefined;
      }
    },
    
    removeClient: async () => {
      try {
        fastStorage.cacheSetting('react-query-cache', null);
      } catch (error) {
        console.warn('Failed to remove query cache:', error);
      }
    },
  };
};

// Create the query client with optimized settings for streaming app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes by default
      staleTime: 5 * 60 * 1000,
      
      // Keep data in cache for 30 minutes
      cacheTime: 30 * 60 * 1000,
      
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus for critical data
      refetchOnWindowFocus: false,
      
      // Don't refetch on reconnect by default (we'll handle this selectively)
      refetchOnReconnect: false,
      
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Video related queries
  video: {
    all: ['videos'] as const,
    lists: () => [...queryKeys.video.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.video.lists(), { filters }] as const,
    details: () => [...queryKeys.video.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.video.details(), id] as const,
    url: (videoKey: string) => [...queryKeys.video.all, 'url', videoKey] as const,
    metadata: (videoKey: string) => [...queryKeys.video.all, 'metadata', videoKey] as const,
  },
  
  // User related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    watchLater: () => [...queryKeys.user.all, 'watchLater'] as const,
    downloads: () => [...queryKeys.user.all, 'downloads'] as const,
    following: () => [...queryKeys.user.all, 'following'] as const,
  },
  
  // Content related queries
  content: {
    all: ['content'] as const,
    popular: () => [...queryKeys.content.all, 'popular'] as const,
    trending: () => [...queryKeys.content.all, 'trending'] as const,
    categories: () => [...queryKeys.content.all, 'categories'] as const,
    search: (query: string) => [...queryKeys.content.all, 'search', query] as const,
  },
};

// Query client persister
export const queryPersister = createQueryPersister();

// Utility functions for cache management
export const queryCacheUtils = {
  // Invalidate all video-related queries
  invalidateVideoQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.video.all });
  },
  
  // Invalidate user-related queries
  invalidateUserQueries: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
  },
  
  // Prefetch popular content
  prefetchPopularContent: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.content.popular(),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },
  
  // Clear all query cache
  clearAllQueries: () => {
    queryClient.clear();
  },
  
  // Get cache statistics
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.isActive()).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      fetchingQueries: queries.filter(q => q.isFetching()).length,
    };
  },
};

export default queryClient;