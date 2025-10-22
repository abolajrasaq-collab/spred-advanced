import logger from '../utils/logger';
import { Platform } from 'react-native';
import SimpleHTTPServer, { ServerConfig } from './SimpleHTTPServer';

export interface VideoShareData {
  id: string;
  title: string;
  filePath: string;
  fileSize: number;
  thumbnailUrl?: string;
  serverUrl: string;
  serverPort: number;
  timestamp: number;
  checksum?: string;
  shareMethod: 'direct' | 'http'; // New field to indicate sharing method
}

export interface QRShareData {
  type: 'spred_video_share';
  version: '1.0';
  video: VideoShareData;
  senderDevice: {
    name: string;
    platform: string;
  };
}

export class QRShareService {
  private static instance: QRShareService;
  private activeServers: Map<string, any> = new Map();
  private httpServer = SimpleHTTPServer.getInstance();

  private constructor() { }

  static getInstance(): QRShareService {
    if (!QRShareService.instance) {
      QRShareService.instance = new QRShareService();
    }
    return QRShareService.instance;
  }

  /**
   * Generate QR code data for video sharing
   */
  async generateShareData(
    videoPath: string,
    videoTitle: string,
    videoSize: number,
    thumbnailUrl?: string
  ): Promise<QRShareData> {
    try {
      logger.info('🔄 QRShareService: Generating share data for video', videoTitle);

      // Generate unique ID for this share session
      const shareId = `spred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get device info
      const deviceName = await this.getDeviceName();
      const platform = this.getPlatform();

      // Calculate checksum for file integrity
      const checksum = await this.calculateFileChecksum(videoPath);

      const shareData: QRShareData = {
        type: 'spred_video_share',
        version: '1.0',
        video: {
          id: shareId,
          title: videoTitle,
          filePath: videoPath,
          fileSize: videoSize,
          thumbnailUrl,
          serverUrl: '', // Will be set when server starts
          serverPort: 0, // Will be set when server starts
          timestamp: Date.now(),
          checksum,
          shareMethod: 'direct', // Using direct base64 sharing
        },
        senderDevice: {
          name: deviceName,
          platform,
        },
      };

      logger.info('✅ QRShareService: Share data generated', shareId);
      return shareData;
    } catch (error: any) {
      logger.error('❌ QRShareService: Failed to generate share data', error);
      throw new Error(`Failed to generate share data: ${error.message}`);
    }
  }

  /**
   * Start local HTTP server to serve the video file
   */
  async startFileServer(videoPath: string, shareId: string): Promise<{ url: string; port: number }> {
    try {
      logger.info('🚀 QRShareService: Starting file server for', shareId);

      // Import required modules
      const RNFS = require('react-native-fs');

      // Generate a port for compatibility
      const port = await this.findAvailablePort(8080);

      // Verify file exists
      const fileExists = await RNFS.exists(videoPath);
      if (!fileExists) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Get file stats
      const fileStats = await RNFS.stat(videoPath);
      const fileSize = fileStats.size;
      const fileName = videoPath.split('/').pop() || 'video.mp4';
      const mimeType = this.getMimeType(fileName);

      logger.info('📁 File share details:', {
        shareId,
        fileName,
        fileSize,
        mimeType
      });

      // Start HTTP server using our SimpleHTTPServer
      logger.info('📡 Starting HTTP server for file sharing');

      const serverConfig: ServerConfig = {
        port,
        filePath: videoPath,
        fileName,
        mimeType,
        shareId // Pass the shareId to the server
      };

      const serverUrl = await this.httpServer.startServer(serverConfig);

      // Extract the actual shareId from the returned server URL
      const actualShareId = serverUrl.replace('spred://share/', '');

      // Store server reference using the actual shareId from the URL
      this.activeServers.set(actualShareId, {
        port,
        shareId: actualShareId,
        videoPath,
        fileName,
        fileSize,
        mimeType,
        serverUrl,
        startTime: Date.now(),
        stop: () => {
          logger.info('🛑 File share stopped for:', actualShareId);
          this.httpServer.stopServer();
        }
      });

      logger.info('✅ QRShareService: File share configured successfully', {
        shareId: actualShareId,
        url: serverUrl,
        fileName,
        fileSize: `${Math.round(fileSize / 1024)}KB`
      });

      return { url: serverUrl, port };

    } catch (error: any) {
      logger.error('❌ QRShareService: Failed to start file server', error);
      throw new Error(`Failed to start file server: ${error.message}`);
    }
  }

  /**
   * Stop the file server for a specific share
   */
  async stopFileServer(shareId: string): Promise<void> {
    try {
      const server = this.activeServers.get(shareId);
      if (server) {
        // Stop the HTTP server
        if (typeof server.stop === 'function') {
          server.stop();
        }

        logger.info('🛑 QRShareService: File server stopped', shareId);
        this.activeServers.delete(shareId);
      } else {
        logger.warn('⚠️ QRShareService: No active server found for', shareId);
      }
    } catch (error: any) {
      logger.error('❌ QRShareService: Error stopping file server', error);
    }
  }

  /**
   * Stop all active file servers
   */
  async stopAllServers(): Promise<void> {
    try {
      const shareIds = Array.from(this.activeServers.keys());
      logger.info('🛑 QRShareService: Stopping all servers', { count: shareIds.length });

      const promises = shareIds.map(shareId => this.stopFileServer(shareId));
      await Promise.all(promises);

      // Note: Individual server stopping is handled above
      // The HTTP bridge library manages server instances individually

      logger.info('✅ QRShareService: All servers stopped');
    } catch (error: any) {
      logger.error('❌ QRShareService: Error stopping all servers', error);
    }
  }

  /**
   * Get device name for sharing
   */
  private async getDeviceName(): Promise<string> {
    try {
      // Try to get device name from react-native-device-info
      const DeviceInfo = require('react-native-device-info');
      if (DeviceInfo && typeof DeviceInfo.getDeviceName === 'function') {
        const deviceName = await DeviceInfo.getDeviceName();
        if (deviceName && deviceName !== 'Unknown') {
          return deviceName;
        }
      }
    } catch (error) {
      logger.warn('⚠️ Could not get device name from DeviceInfo:', error);
    }

    // Fallback device name
    return `SPRED_Device_${Date.now().toString().slice(-4)}`;
  }

  /**
   * Get platform information
   */
  private getPlatform(): string {
    return Platform.OS;
  }

  /**
   * Calculate file checksum for integrity verification
   */
  private async calculateFileChecksum(filePath: string): Promise<string> {
    try {
      // Use RNFS to read file and calculate checksum
      const RNFS = require('react-native-fs');
      const fileContent = await RNFS.readFile(filePath, 'base64');

      // Simple checksum calculation using string hash
      let hash = 0;
      for (let i = 0; i < fileContent.length; i++) {
        const char = fileContent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash).toString(16);
    } catch (error) {
      // If checksum calculation fails, return empty string
      logger.warn('⚠️ QRShareService: Could not calculate checksum', error);
      return '';
    }
  }

  /**
   * Find an available port starting from the given port
   */
  private async findAvailablePort(startPort: number): Promise<number> {
    // For React Native, use a simple approach - just return a port and let the server handle conflicts
    // React Native HTTP servers typically handle port conflicts automatically
    return startPort + Math.floor(Math.random() * 100);
  }

  /**
   * Get local IP address for network connections
   */
  private async getLocalIPAddress(): Promise<string> {
    try {
      // For React Native, we need to use a different approach
      // Try to get network info using react-native-netinfo
      const NetInfo = require('@react-native-community/netinfo');
      const networkState = await NetInfo.fetch();

      if (networkState.type === 'wifi' && networkState.details?.ipAddress) {
        logger.info('✅ Got local IP from netinfo:', networkState.details.ipAddress);
        return networkState.details.ipAddress;
      }

      // Last fallback - localhost (won't work for cross-device sharing)
      logger.warn('⚠️ Could not determine local IP address, using localhost - cross-device sharing may not work');
      return 'localhost';

    } catch (error) {
      logger.warn('⚠️ Error getting local IP address:', error);
      return 'localhost';
    }
  }

  /**
   * Get MIME type for file extension
   */
  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

    const mimeTypes: { [key: string]: string } = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.webm': 'video/webm',
      '.m4v': 'video/x-m4v',
      '.3gp': 'video/3gpp',
      '.flv': 'video/x-flv',
      '.wmv': 'video/x-ms-wmv',
    };

    return mimeTypes[extension] || 'video/mp4'; // Default to mp4 for video files
  }

  /**
   * Validate QR share data
   */
  validateShareData(data: any): data is QRShareData {
    return (
      data &&
      data.type === 'spred_video_share' &&
      data.version === '1.0' &&
      data.video &&
      data.video.id &&
      data.video.title &&
      data.video.filePath &&
      data.senderDevice &&
      data.senderDevice.name
    );
  }

  /**
   * Get active server count
   */
  getActiveServerCount(): number {
    return this.activeServers.size;
  }

  /**
   * Get active share IDs
   */
  getActiveShares(): string[] {
    return Array.from(this.activeServers.keys());
  }

  /**
   * Get server info for a specific share
   */
  getServerInfo(shareId: string): any {
    return this.activeServers.get(shareId);
  }

  /**
   * Check if a server is active for a share
   */
  isServerActive(shareId: string): boolean {
    return this.activeServers.has(shareId);
  }

  /**
   * Get server statistics
   */
  getServerStats(): {
    activeServers: number;
    totalShares: string[];
    uptime: { [shareId: string]: number };
  } {
    const now = Date.now();
    const uptime: { [shareId: string]: number } = {};

    this.activeServers.forEach((server, shareId) => {
      uptime[shareId] = now - (server.startTime || now);
    });

    return {
      activeServers: this.activeServers.size,
      totalShares: this.getActiveShares(),
      uptime
    };
  }

  /**
   * Get shared file data for a specific share ID
   */
  getSharedFileData(shareId: string): {
    success: boolean;
    data?: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      serverUrl: string;
    };
    error?: string;
  } {
    try {
      logger.info('🔍 Looking for shareId:', shareId);
      logger.info('📋 Available shares:', Array.from(this.activeServers.keys()));
      
      const server = this.activeServers.get(shareId);
      if (!server) {
        logger.error('❌ Share not found:', {
          requestedShareId: shareId,
          availableShares: Array.from(this.activeServers.keys()),
          totalActiveServers: this.activeServers.size
        });
        return {
          success: false,
          error: 'Share not found or expired'
        };
      }

      return {
        success: true,
        data: {
          fileName: server.fileName,
          fileSize: server.fileSize,
          mimeType: server.mimeType,
          serverUrl: server.serverUrl
        }
      };
    } catch (error: any) {
      logger.error('❌ Error getting shared file data:', error);
      return {
        success: false,
        error: error.message || 'Failed to get file data'
      };
    }
  }

  /**
   * Process a SPRED share URL and extract share ID
   */
  parseShareUrl(url: string): { shareId?: string; isValid: boolean } {
    try {
      if (url.startsWith('spred://share/')) {
        const shareId = url.replace('spred://share/', '');
        return {
          shareId,
          isValid: shareId.length > 0
        };
      }
      return { isValid: false };
    } catch (error) {
      return { isValid: false };
    }
  }
}

export default QRShareService;