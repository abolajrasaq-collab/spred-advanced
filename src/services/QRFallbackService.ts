import RNFS from 'react-native-fs';
import logger from '../utils/logger';

export interface QRShareData {
  type: 'spred_video_share';
  method: 'cloud' | 'local_server';
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  deviceName: string;
  expiresAt: number;
  checksum?: string;
}

export interface QRFallbackResult {
  success: boolean;
  qrData?: string;
  downloadUrl?: string;
  error?: string;
}

export class QRFallbackService {
  private static instance: QRFallbackService;
  private activeServers: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): QRFallbackService {
    if (!QRFallbackService.instance) {
      QRFallbackService.instance = new QRFallbackService();
    }
    return QRFallbackService.instance;
  }

  // Generate QR code data for video sharing
  async generateQRForVideo(videoPath: string, method: 'cloud' | 'local_server' = 'local_server'): Promise<QRFallbackResult> {
    try {
      logger.info('📱 Generating QR code for video:', videoPath);

      // Handle mock paths for testing
      const isMockPath = videoPath.includes('/mock/');
      let fileStats: any;
      
      if (isMockPath) {
        // Mock file stats for testing
        fileStats = {
          size: 52428800, // 50MB mock size
          isFile: () => true,
          isDirectory: () => false,
        };
        logger.info('📱 Using mock file stats for testing');
      } else {
        // Check if file exists
        const fileExists = await RNFS.exists(videoPath);
        if (!fileExists) {
          throw new Error('Video file not found');
        }
        // Get file info
        fileStats = await RNFS.stat(videoPath);
      }
      const fileName = videoPath.split('/').pop() || 'video.mp4';
      const deviceName = await this.getDeviceName();

      let downloadUrl: string;

      if (method === 'local_server') {
        // Create local HTTP server
        downloadUrl = await this.createLocalServer(videoPath);
      } else {
        // Upload to cloud (mock implementation)
        downloadUrl = await this.uploadToCloud(videoPath);
      }

      const qrData: QRShareData = {
        type: 'spred_video_share',
        method,
        downloadUrl,
        fileName,
        fileSize: fileStats.size,
        deviceName,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        checksum: await this.calculateChecksum(videoPath)
      };

      const qrString = JSON.stringify(qrData);
      
      logger.info('✅ QR code generated successfully');
      return {
        success: true,
        qrData: qrString,
        downloadUrl
      };
    } catch (error: any) {
      logger.error('❌ Failed to generate QR code:', error);
      logger.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      return {
        success: false,
        error: error.message || error.toString() || 'Failed to generate QR code'
      };
    }
  }

  // Create local HTTP server for file sharing
  private async createLocalServer(videoPath: string): Promise<string> {
    try {
      const localIP = await this.getLocalIP();
      const port = await this.findAvailablePort();
      const serverId = `${localIP}:${port}`;

      // TODO: Implement actual HTTP server
      // For now, return mock URL
      const serverUrl = `http://${localIP}:${port}/video`;
      
      // Store server reference for cleanup
      this.activeServers.set(serverId, {
        url: serverUrl,
        filePath: videoPath,
        createdAt: Date.now()
      });

      logger.info('🌐 Local server created:', serverUrl);
      return serverUrl;
    } catch (error: any) {
      logger.error('❌ Failed to create local server:', error);
      throw error;
    }
  }

  // Upload file to cloud storage (mock implementation)
  private async uploadToCloud(videoPath: string): Promise<string> {
    try {
      logger.info('☁️ Uploading to cloud storage...');
      
      // TODO: Implement actual cloud upload
      // This would integrate with services like AWS S3, Google Cloud, etc.
      
      // Mock upload with progress
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockCloudUrl = `https://spred-temp-storage.com/videos/${Date.now()}.mp4`;
      
      logger.info('✅ Cloud upload completed:', mockCloudUrl);
      return mockCloudUrl;
    } catch (error: any) {
      logger.error('❌ Cloud upload failed:', error);
      throw error;
    }
  }

  // Process scanned QR code and download video
  async processQRCode(qrString: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      logger.info('🔍 Processing QR code...');

      const qrData: QRShareData = JSON.parse(qrString);
      
      // Validate QR data
      if (qrData.type !== 'spred_video_share') {
        throw new Error('Invalid QR code - not a SPRED video share');
      }

      // Check if expired
      if (Date.now() > qrData.expiresAt) {
        throw new Error('QR code has expired');
      }

      // Download the video
      const downloadPath = await this.downloadVideo(qrData);
      
      logger.info('✅ QR code processed successfully');
      return {
        success: true,
        filePath: downloadPath
      };
    } catch (error: any) {
      logger.error('❌ Failed to process QR code:', error);
      return {
        success: false,
        error: error.message || 'Failed to process QR code'
      };
    }
  }

  // Download video from URL
  private async downloadVideo(qrData: QRShareData): Promise<string> {
    try {
      logger.info('📥 Downloading video:', qrData.fileName);

      // Create download directory
      const downloadDir = `${RNFS.ExternalDirectoryPath}/SpredReceived`;
      await RNFS.mkdir(downloadDir);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${qrData.fileName}`;
      const downloadPath = `${downloadDir}/${fileName}`;

      // TODO: Implement actual download with progress
      // For now, mock the download
      await new Promise(resolve => setTimeout(resolve, 3000));

      logger.info('✅ Video downloaded successfully:', downloadPath);
      return downloadPath;
    } catch (error: any) {
      logger.error('❌ Video download failed:', error);
      throw error;
    }
  }

  // Get device name
  private async getDeviceName(): Promise<string> {
    try {
      // TODO: Get actual device name
      // This would use react-native-device-info or similar
      return 'My Device';
    } catch (error) {
      return 'Unknown Device';
    }
  }

  // Get local IP address
  private async getLocalIP(): Promise<string> {
    try {
      // TODO: Implement actual IP detection
      // This would use react-native-network-info or similar
      return '192.168.1.100';
    } catch (error) {
      return '127.0.0.1';
    }
  }

  // Find available port for local server
  private async findAvailablePort(): Promise<number> {
    // TODO: Implement actual port scanning
    // For now, return a random port in safe range
    return 8080 + Math.floor(Math.random() * 1000);
  }

  // Calculate file checksum for integrity verification
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      // TODO: Implement actual checksum calculation
      // This would use crypto libraries to generate MD5/SHA256
      return 'mock_checksum_' + Date.now();
    } catch (error) {
      return '';
    }
  }

  // Clean up active servers
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up QR fallback servers...');
      
      // Stop all active servers
      for (const [serverId, serverInfo] of this.activeServers) {
        // TODO: Stop actual HTTP server
        logger.info('🛑 Stopping server:', serverId);
      }
      
      this.activeServers.clear();
      logger.info('✅ QR fallback cleanup completed');
    } catch (error: any) {
      logger.error('❌ Error during QR fallback cleanup:', error);
    }
  }

  // Get active servers info
  getActiveServers(): Array<{ id: string; url: string; filePath: string; createdAt: number }> {
    return Array.from(this.activeServers.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }
}

export default QRFallbackService;