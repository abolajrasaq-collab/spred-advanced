import { Linking } from 'react-native';
import logger from '../utils/logger';

export interface URLHandlerResult {
  success: boolean;
  action?: 'navigate' | 'download' | 'share';
  data?: any;
  error?: string;
}

export class URLHandlerService {
  private static instance: URLHandlerService;

  private constructor() {}

  static getInstance(): URLHandlerService {
    if (!URLHandlerService.instance) {
      URLHandlerService.instance = new URLHandlerService();
    }
    return URLHandlerService.instance;
  }

  /**
   * Initialize URL handling for the app
   */
  initialize(): void {
    // Handle URLs when app is already running
    Linking.addEventListener('url', this.handleIncomingURL.bind(this));
    
    // Handle URLs when app is opened from a cold start
    Linking.getInitialURL().then((url) => {
      if (url) {
        logger.info('🔗 App opened with URL:', url);
        this.handleIncomingURL({ url });
      }
    }).catch((error) => {
      logger.error('❌ Error getting initial URL:', error);
    });

    logger.info('✅ URL handler service initialized');
  }

  /**
   * Handle incoming URLs (both spred:// and other protocols)
   */
  private async handleIncomingURL(event: { url: string }): Promise<URLHandlerResult> {
    try {
      const url = event.url;
      logger.info('🔗 Handling incoming URL:', url);

      // Check if it's a spred:// URL
      if (url.startsWith('spred://')) {
        return await this.handleSpredURL(url);
      }

      // Handle other URL types if needed
      logger.info('ℹ️ Non-spred URL received:', url);
      return {
        success: false,
        error: 'URL protocol not supported'
      };

    } catch (error: any) {
      logger.error('❌ Error handling incoming URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to handle URL'
      };
    }
  }

  /**
   * Handle spred:// URLs specifically
   */
  private async handleSpredURL(url: string): Promise<URLHandlerResult> {
    try {
      logger.info('📱 Processing spred:// URL:', url);

      // Parse the URL to extract share ID
      const parseResult = this.qrShareService.parseShareUrl(url);
      
      if (!parseResult.isValid || !parseResult.shareId) {
        logger.error('❌ Invalid spred:// URL format:', url);
        return {
          success: false,
          error: 'Invalid spred:// URL format'
        };
      }

      const shareId = parseResult.shareId;
      logger.info('📋 Extracted share ID:', shareId);

      // Get file data for the share
      const fileData = this.qrShareService.getSharedFileData(shareId);
      
      if (!fileData.success) {
        logger.error('❌ Share not found or expired:', shareId);
        return {
          success: false,
          error: fileData.error || 'Share not found or expired'
        };
      }

      logger.info('✅ Share data retrieved:', {
        fileName: fileData.data?.fileName,
        fileSize: fileData.data?.fileSize,
        serverUrl: fileData.data?.serverUrl
      });

      return {
        success: true,
        action: 'download',
        data: {
          shareId,
          fileName: fileData.data?.fileName,
          fileSize: fileData.data?.fileSize,
          serverUrl: fileData.data?.serverUrl
        }
      };

    } catch (error: any) {
      logger.error('❌ Error processing spred:// URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to process spred:// URL'
      };
    }
  }

  /**
   * Cleanup URL handling
   */
  cleanup(): void {
    // Note: React Native Linking doesn't provide a way to remove specific listeners
    // The listener will be cleaned up when the app is destroyed
    logger.info('🧹 URL handler service cleaned up');
  }
}

export default URLHandlerService;
