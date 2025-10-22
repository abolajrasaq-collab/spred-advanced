/**
 * Network Optimizer
 * Provides intelligent network request management and optimization
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheManager } from './AdvancedCacheManager';
import logger from '../utils/logger';

export interface NetworkConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  batchEnabled: boolean;
  batchSize: number;
  batchDelay: number;
}

export interface RequestOptions {
  cache?: boolean;
  cacheTTL?: number;
  retry?: boolean;
  retryAttempts?: number;
  priority?: 'low' | 'normal' | 'high';
  batch?: boolean;
}

export interface BatchRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  config?: AxiosRequestConfig;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
}

class NetworkOptimizer {
  private static instance: NetworkOptimizer;
  private axiosInstance: AxiosInstance;
  private config: NetworkConfig;
  private stats: NetworkStats;
  private batchQueue: BatchRequest[] = [];
  private batchTimer?: NodeJS.Timeout;
  private requestQueue: Map<string, Promise<any>> = new Map();

  private constructor() {
    this.config = {
      baseURL: 'https://www.spred.cc/api',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      batchEnabled: true,
      batchSize: 10,
      batchDelay: 100,
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };

    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  static getInstance(): NetworkOptimizer {
    if (!NetworkOptimizer.instance) {
      NetworkOptimizer.instance = new NetworkOptimizer();
    }
    return NetworkOptimizer.instance;
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).startTime = startTime;
        
        // Add request deduplication
        const requestKey = this.generateRequestKey(config);
        if (this.requestQueue.has(requestKey)) {
          return Promise.reject(new Error('Duplicate request'));
        }

        logger.debug(`🌐 Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        logger.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const endTime = Date.now();
        const duration = endTime - (response.config as any).startTime;
        
        this.updateStats('success', duration);
        
        logger.debug(`✅ Response: ${response.status} (${duration}ms)`);
        return response;
      },
      async (error) => {
        const endTime = Date.now();
        const duration = endTime - (error.config as any)?.startTime || 0;
        
        this.updateStats('error', duration);

        // Retry logic
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        logger.error('Response interceptor error:', error);
        return Promise.reject(error);
      }
    );
  }

  private generateRequestKey(config: AxiosRequestConfig): string {
    const { method, url, data, params } = config;
    return `${method}_${url}_${JSON.stringify(data)}_${JSON.stringify(params)}`;
  }

  private shouldRetry(error: any): boolean {
    if (!error.config || error.config.__retryCount >= this.config.retryAttempts) {
      return false;
    }

    // Retry on network errors or 5xx status codes
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private async retryRequest(error: any): Promise<AxiosResponse> {
    const config = error.config;
    config.__retryCount = (config.__retryCount || 0) + 1;

    // Exponential backoff
    const delay = this.config.retryDelay * Math.pow(2, config.__retryCount - 1);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    logger.debug(`🔄 Retrying request (${config.__retryCount}/${this.config.retryAttempts})`);
    
    return this.axiosInstance.request(config);
  }

  private updateStats(type: 'success' | 'error', duration: number): void {
    this.stats.totalRequests++;
    
    if (type === 'success') {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time
    this.stats.averageResponseTime = 
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + duration) / 
      this.stats.totalRequests;

    // Update rates
    this.stats.errorRate = this.stats.failedRequests / this.stats.totalRequests;
    this.stats.cacheHitRate = this.stats.cachedRequests / this.stats.totalRequests;
  }

  public async request<T>(
    config: AxiosRequestConfig,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      cache = this.config.cacheEnabled,
      cacheTTL = this.config.cacheTTL,
      retry = true,
      priority = 'normal',
      batch = false,
    } = options;

    const cacheKey = this.generateCacheKey(config);

    // Check cache first
    if (cache) {
      const cachedData = await cacheManager.get<T>(cacheKey);
      if (cachedData) {
        this.stats.cachedRequests++;
        logger.debug(`💾 Cache hit: ${config.url}`);
        return cachedData;
      }
    }

    // Check for duplicate requests
    const requestKey = this.generateRequestKey(config);
    if (this.requestQueue.has(requestKey)) {
      logger.debug(`🔄 Deduplicating request: ${config.url}`);
      return this.requestQueue.get(requestKey)!;
    }

    // Handle batching for GET requests
    if (batch && config.method?.toUpperCase() === 'GET' && this.config.batchEnabled) {
      return this.addToBatch<T>(config, options);
    }

    // Make request
    const requestPromise = this.makeRequest<T>(config, options);
    this.requestQueue.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      const data = response.data;

      // Cache successful response
      if (cache && response.status === 200) {
        await cacheManager.set(cacheKey, data, { ttl: cacheTTL });
      }

      return data;
    } finally {
      this.requestQueue.delete(requestKey);
    }
  }

  private async makeRequest<T>(
    config: AxiosRequestConfig,
    options: RequestOptions
  ): Promise<AxiosResponse<T>> {
    const startTime = Date.now();
    
    try {
      const response = await this.axiosInstance.request<T>(config);
      return response;
    } catch (error) {
      logger.error('Request failed:', error);
      throw error;
    }
  }

  private generateCacheKey(config: AxiosRequestConfig): string {
    const { method, url, data, params } = config;
    const key = `${method}_${url}_${JSON.stringify(data)}_${JSON.stringify(params)}`;
    return `network_${btoa(key).replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  public async get<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'GET', url }, options);
  }

  public async post<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'POST', url, data }, options);
  }

  public async put<T>(
    url: string,
    data?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data }, options);
  }

  public async delete<T>(
    url: string,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.request<T>({ method: 'DELETE', url }, options);
  }

  public async batchRequest<T>(
    requests: Array<{
      method: string;
      url: string;
      data?: any;
      config?: AxiosRequestConfig;
    }>,
    options: RequestOptions = {}
  ): Promise<T[]> {
    if (!this.config.batchEnabled || requests.length <= this.config.batchSize) {
      // Execute requests individually if batching is disabled or small batch
      const promises = requests.map(req =>
        this.request<T>({ method: req.method, url: req.url, data: req.data, ...req.config }, options)
      );
      return Promise.all(promises);
    }

    // Execute in batches
    const results: T[] = [];
    const batches = this.chunkArray(requests, this.config.batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(req =>
        this.request<T>({ method: req.method, url: req.url, data: req.data, ...req.config }, options)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
      }
    }

    return results;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async addToBatch<T>(
    config: AxiosRequestConfig,
    options: RequestOptions
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const batchRequest: BatchRequest = {
        id: `batch_${Date.now()}_${Math.random()}`,
        url: config.url || '',
        method: config.method || 'GET',
        data: config.data,
        config: config,
        resolve: resolve as (value: any) => void,
        reject,
        timestamp: Date.now(),
      };

      this.batchQueue.push(batchRequest);

      // Process batch if we have enough requests or after delay
      if (this.batchQueue.length >= this.config.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.config.batchDelay);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batchToProcess = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Group requests by endpoint for more efficient batching
    const endpointGroups = new Map<string, BatchRequest[]>();
    batchToProcess.forEach(req => {
      const key = `${req.method}_${req.url}`;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(req);
    });

    // Process each group
    for (const [endpoint, requests] of endpointGroups) {
      try {
        // For now, execute requests individually but with shared connection
        // In a real implementation, you might use HTTP/2 multiplexing or batch endpoints
        const promises = requests.map(req =>
          this.makeRequest(req.config, {}).then(response => ({
            request: req,
            response: response.data
          }))
        );

        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          const request = requests[index];
          if (result.status === 'fulfilled') {
            request.resolve(result.value.response);
          } else {
            request.reject(result.reason);
          }
        });
      } catch (error) {
        // If batch processing fails, reject all requests in this batch
        requests.forEach(req => req.reject(error));
      }
    }
  }

  public async preload<T>(
    urls: string[],
    options: RequestOptions = {}
  ): Promise<void> {
    const promises = urls.map(url => 
      this.get<T>(url, { ...options, cache: true })
    );

    await Promise.allSettled(promises);
    logger.info(`🚀 Preloaded ${urls.length} URLs`);
  }

  public async warmup<T>(
    urlGenerator: () => string,
    count: number = 10,
    options: RequestOptions = {}
  ): Promise<void> {
    const urls: string[] = [];
    for (let i = 0; i < count; i++) {
      urls.push(urlGenerator());
    }

    await this.preload<T>(urls, options);
    logger.info(`🔥 Network warmed up with ${count} requests`);
  }

  public getStats(): NetworkStats {
    return { ...this.stats };
  }

  public getConfig(): NetworkConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update axios instance if base URL or timeout changed
    if (newConfig.baseURL || newConfig.timeout) {
      this.axiosInstance = this.createAxiosInstance();
      this.setupInterceptors();
    }
  }

  public clearCache(): Promise<void> {
    return cacheManager.clear();
  }

  public resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cachedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };
  }
}

export default NetworkOptimizer;
export const networkOptimizer = NetworkOptimizer.getInstance();
