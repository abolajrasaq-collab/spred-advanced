/**
 * HTTPClient - Simple HTTP client for QR-based file sharing
 */

import logger from './logger';

export interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  progress: number; // 0-100
}

export interface DownloadOptions {
  url: string;
  filePath: string;
  onProgress?: (progress: DownloadProgress) => void;
  timeout?: number;
  headers?: { [key: string]: string };
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  statusCode?: number;
  error?: string;
  fileSize?: number;
}

export class HTTPClient {
  private static instance: HTTPClient;

  private constructor() {}

  static getInstance(): HTTPClient {
    if (!HTTPClient.instance) {
      HTTPClient.instance = new HTTPClient();
    }
    return HTTPClient.instance;
  }

  /**
   * Download file with progress tracking
   */
  async downloadFile(options: DownloadOptions): Promise<DownloadResult> {
    try {
      logger.info('📥 HTTPClient: Starting download', {
        url: options.url,
        filePath: options.filePath,
        timeout: options.timeout || 30000
      });

      const RNFS = require('react-native-fs');

      // Prepare download options
      const downloadOptions = {
        fromUrl: options.url,
        toFile: options.filePath,
        headers: {
          'Accept': 'video/*,*/*',
          'User-Agent': 'SPRED-App/1.0',
          ...options.headers
        },
        connectionTimeout: options.timeout || 30000,
        readTimeout: options.timeout || 30000,
        progress: (res: any) => {
          if (options.onProgress && res.contentLength > 0) {
            const progress: DownloadProgress = {
              bytesWritten: res.bytesWritten,
              contentLength: res.contentLength,
              progress: (res.bytesWritten / res.contentLength) * 100
            };
            options.onProgress(progress);
          }
        },
        progressDivider: 1,
      };

      // Start download
      const downloadResult = await RNFS.downloadFile(downloadOptions).promise;

      logger.info('📥 HTTPClient: Download completed', {
        statusCode: downloadResult.statusCode,
        bytesWritten: downloadResult.bytesWritten
      });

      // Check if download was successful
      if (downloadResult.statusCode !== 200) {
        return {
          success: false,
          statusCode: downloadResult.statusCode,
          error: `HTTP ${downloadResult.statusCode}: Download failed`
        };
      }

      // Verify file was created
      const fileExists = await RNFS.exists(options.filePath);
      if (!fileExists) {
        return {
          success: false,
          error: 'Downloaded file not found'
        };
      }

      // Get file size
      const fileStats = await RNFS.stat(options.filePath);
      const fileSize = fileStats.size;

      logger.info('✅ HTTPClient: Download successful', {
        filePath: options.filePath,
        fileSize
      });

      return {
        success: true,
        filePath: options.filePath,
        statusCode: downloadResult.statusCode,
        fileSize
      };

    } catch (error: any) {
      logger.error('❌ HTTPClient: Download failed', error);
      
      // Clean up partial download
      try {
        const RNFS = require('react-native-fs');
        const fileExists = await RNFS.exists(options.filePath);
        if (fileExists) {
          await RNFS.unlink(options.filePath);
          logger.info('🧹 HTTPClient: Cleaned up partial download');
        }
      } catch (cleanupError) {
        logger.warn('⚠️ HTTPClient: Could not clean up partial download:', cleanupError);
      }

      return {
        success: false,
        error: error.message || 'Download failed'
      };
    }
  }

  /**
   * Test server connectivity
   */
  async testConnection(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      logger.info('🔍 HTTPClient: Testing connection to', url);

      // Try to fetch server health endpoint
      const healthUrl = url.replace('/video', '/health');
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        timeout,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SPRED-App/1.0'
        }
      });

      const isConnected = response.status === 200;
      logger.info('🔍 HTTPClient: Connection test result', {
        url: healthUrl,
        status: response.status,
        connected: isConnected
      });

      return isConnected;
    } catch (error: any) {
      logger.warn('⚠️ HTTPClient: Connection test failed', error);
      return false;
    }
  }

  /**
   * Get file metadata from server
   */
  async getFileMetadata(url: string): Promise<any> {
    try {
      logger.info('📋 HTTPClient: Getting file metadata from', url);

      // Try to fetch metadata endpoint
      const metadataUrl = url.replace('/video', '/info');
      
      const response = await fetch(metadataUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SPRED-App/1.0'
        }
      });

      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}: Could not get metadata`);
      }

      const metadata = await response.json();
      logger.info('📋 HTTPClient: Metadata received', metadata);

      return metadata;
    } catch (error: any) {
      logger.error('❌ HTTPClient: Failed to get metadata', error);
      throw error;
    }
  }
}

export default HTTPClient;