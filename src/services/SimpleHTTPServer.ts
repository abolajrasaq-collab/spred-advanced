import logger from '../utils/logger';

export interface ServerConfig {
  port: number;
  filePath: string;
  fileName: string;
  mimeType: string;
  shareId?: string; // Optional shareId for QR sharing
}

export class SimpleHTTPServer {
  private static instance: SimpleHTTPServer;
  private isRunning = false;
  private config: ServerConfig | null = null;
  private serverUrl: string = '';

  private constructor() {}

  static getInstance(): SimpleHTTPServer {
    if (!SimpleHTTPServer.instance) {
      SimpleHTTPServer.instance = new SimpleHTTPServer();
    }
    return SimpleHTTPServer.instance;
  }

  /**
   * Start HTTP server to serve a file
   */
  async startServer(config: ServerConfig): Promise<string> {
    try {
      logger.info('🚀 Starting Simple HTTP Server:', config);

      if (this.isRunning) {
        await this.stopServer();
      }

      this.config = config;

      // For React Native, we'll use a different approach
      // Since we can't create a real HTTP server in RN, we'll prepare the file
      // and return a special URL that our client can handle

      // Verify file exists
      const RNFS = require('react-native-fs');
      const fileExists = await RNFS.exists(config.filePath);
      if (!fileExists) {
        throw new Error(`File not found: ${config.filePath}`);
      }

      // Get file stats
      const fileStats = await RNFS.stat(config.filePath);
      logger.info('📁 File stats:', {
        size: fileStats.size,
        path: config.filePath,
        mimeType: config.mimeType
      });

      // Create server URL using the expected format for QR sharing
      // Use the shareId if available in config, otherwise generate one
      const shareId = config.shareId || `spred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.serverUrl = `spred://share/${shareId}`;
      this.config = { ...config, shareId }; // Store config with shareId
      this.isRunning = true;

      logger.info('✅ Simple HTTP Server started:', this.serverUrl);
      return this.serverUrl;

    } catch (error: any) {
      logger.error('❌ Failed to start HTTP server:', error);
      throw new Error(`Failed to start server: ${error.message}`);
    }
  }

  /**
   * Stop the HTTP server
   */
  async stopServer(): Promise<void> {
    try {
      if (!this.isRunning) {
        logger.warn('⚠️ Server not running');
        return;
      }

      logger.info('🛑 Stopping Simple HTTP Server');
      this.isRunning = false;
      this.config = null;
      this.serverUrl = '';

      logger.info('✅ Simple HTTP Server stopped');

    } catch (error: any) {
      logger.error('❌ Error stopping server:', error);
    }
  }

  /**
   * Get file data for serving
   */
  async getFileData(): Promise<{
    success: boolean;
    data?: {
      filePath: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
    };
    error?: string;
  }> {
    try {
      if (!this.isRunning || !this.config) {
        return {
          success: false,
          error: 'Server not running'
        };
      }

      const RNFS = require('react-native-fs');
      const fileStats = await RNFS.stat(this.config.filePath);

      return {
        success: true,
        data: {
          filePath: this.config.filePath,
          fileName: this.config.fileName,
          mimeType: this.config.mimeType,
          fileSize: fileStats.size
        }
      };

    } catch (error: any) {
      logger.error('❌ Error getting file data:', error);
      return {
        success: false,
        error: error.message || 'Failed to get file data'
      };
    }
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get server URL
   */
  getServerUrl(): string {
    return this.serverUrl;
  }

  /**
   * Get server status
   */
  getStatus(): {
    isRunning: boolean;
    url?: string;
    config?: ServerConfig;
  } {
    return {
      isRunning: this.isRunning,
      url: this.serverUrl || undefined,
      config: this.config || undefined
    };
  }

  /**
   * Parse our custom URL scheme
   */
  static parseServerUrl(url: string): { isValid: boolean; sessionId?: string } {
    try {
      if (url.startsWith('spred-file://serve/')) {
        const sessionId = url.replace('spred-file://serve/', '');
        return {
          isValid: true,
          sessionId
        };
      }
      return { isValid: false };
    } catch (error) {
      return { isValid: false };
    }
  }
}

export default SimpleHTTPServer;