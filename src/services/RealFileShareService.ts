import logger from '../utils/logger';
import HotspotManager, { HotspotConfig } from './HotspotManager';
import HTTPServerManager, { ServerConfig } from './HTTPServerManager';

export interface ShareSession {
  id: string;
  videoPath: string;
  videoTitle: string;
  videoSize: number;
  hotspotName: string;
  hotspotPassword: string;
  serverPort: number;
  serverUrl: string;
  qrData: string;
  isActive: boolean;
  startTime: number;
}

export interface DownloadInfo {
  hotspotName: string;
  hotspotPassword: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  checksum?: string;
}

export class RealFileShareService {
  private static instance: RealFileShareService;
  private activeSession: ShareSession | null = null;
  private hotspotManager = HotspotManager.getInstance();
  private httpServerManager = HTTPServerManager.getInstance();

  private constructor() { }

  static getInstance(): RealFileShareService {
    if (!RealFileShareService.instance) {
      RealFileShareService.instance = new RealFileShareService();
    }
    return RealFileShareService.instance;
  }

  /**
   * Start sharing a video file - creates hotspot and HTTP server
   */
  async startSharing(videoPath: string, videoTitle: string, videoSize: number): Promise<ShareSession> {
    try {
      logger.info('🚀 Starting real file sharing:', videoTitle);

      // Stop any existing session
      if (this.activeSession) {
        await this.stopSharing();
      }

      // Generate session details
      const sessionId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const serverPort = 8080;

      // Generate hotspot credentials
      const hotspotConfig = this.hotspotManager.generateHotspotCredentials('SPRED');

      // Start HTTP server first
      const serverConfig: ServerConfig = {
        port: serverPort,
        filePath: videoPath,
        fileName: videoTitle,
        mimeType: HTTPServerManager.getMimeType(videoTitle),
      };

      const serverUrl = await this.httpServerManager.startServer(serverConfig);
      logger.info('✅ HTTP server started:', serverUrl);

      // Create hotspot
      const hotspotCreated = await this.hotspotManager.createHotspot(hotspotConfig);
      if (!hotspotCreated) {
        throw new Error('Failed to create hotspot');
      }
      logger.info('✅ Hotspot created:', hotspotConfig.ssid);

      // Generate QR code data
      const downloadInfo: DownloadInfo = {
        hotspotName: hotspotConfig.ssid,
        hotspotPassword: hotspotConfig.password,
        downloadUrl: `http://192.168.43.1:${serverPort}/video`,
        fileName: videoTitle,
        fileSize: videoSize,
        checksum: await this.calculateChecksum(videoPath)
      };

      const qrData = JSON.stringify(downloadInfo);

      // Create session
      this.activeSession = {
        id: sessionId,
        videoPath,
        videoTitle,
        videoSize,
        hotspotName: hotspotConfig.ssid,
        hotspotPassword: hotspotConfig.password,
        serverPort,
        serverUrl,
        qrData,
        isActive: true,
        startTime: Date.now()
      };

      logger.info('✅ File sharing session started:', sessionId);
      return this.activeSession;

    } catch (error: any) {
      logger.error('❌ Failed to start file sharing:', error);
      throw new Error(`Failed to start sharing: ${error.message}`);
    }
  }

  /**
   * Stop sharing - cleanup hotspot and server
   */
  async stopSharing(): Promise<void> {
    try {
      if (!this.activeSession) {
        logger.warn('⚠️ No active sharing session to stop');
        return;
      }

      logger.info('🛑 Stopping file sharing session:', this.activeSession.id);

      // Stop HTTP server
      await this.httpServerManager.stopServer();

      // Stop hotspot
      await this.hotspotManager.stopHotspot();

      // Clear session
      this.activeSession = null;

      logger.info('✅ File sharing stopped');

    } catch (error: any) {
      logger.error('❌ Error stopping file sharing:', error);
    }
  }

  /**
   * Download file from QR code data
   */
  async downloadFromQR(qrData: string, downloadPath: string): Promise<boolean> {
    try {
      logger.info('📥 Starting download from QR code');

      // Parse QR data
      const downloadInfo: DownloadInfo = JSON.parse(qrData);
      logger.info('📋 Download info:', {
        hotspot: downloadInfo.hotspotName,
        fileName: downloadInfo.fileName,
        size: `${Math.round(downloadInfo.fileSize / 1024 / 1024)}MB`
      });

      // Connect to hotspot
      await this.connectToHotspot(downloadInfo.hotspotName, downloadInfo.hotspotPassword);
      logger.info('✅ Connected to hotspot');

      // Download file
      const success = await this.downloadFile(downloadInfo.downloadUrl, downloadPath);

      if (success) {
        logger.info('✅ File downloaded successfully');

        // Verify checksum if provided
        if (downloadInfo.checksum) {
          const actualChecksum = await this.calculateChecksum(downloadPath);
          if (actualChecksum !== downloadInfo.checksum) {
            logger.warn('⚠️ Checksum mismatch - file may be corrupted');
          } else {
            logger.info('✅ Checksum verified');
          }
        }
      }

      return success;

    } catch (error: any) {
      logger.error('❌ Download failed:', error);
      return false;
    }
  }

  /**
   * Check if device supports file sharing
   */
  async isFileShareSupported(): Promise<{ supported: boolean; reason?: string }> {
    try {
      // Check hotspot support
      const hotspotSupported = await this.hotspotManager.isHotspotSupported();
      if (!hotspotSupported) {
        return {
          supported: false,
          reason: 'WiFi hotspot not supported on this device'
        };
      }

      return { supported: true };

    } catch (error: any) {
      return {
        supported: false,
        reason: `Support check failed: ${error.message}`
      };
    }
  }

  /**
   * Connect to WiFi hotspot
   */
  private async connectToHotspot(ssid: string, password: string): Promise<void> {
    try {
      const WifiManager = require('react-native-wifi-reborn');

      await WifiManager.connectToProtectedSSID(ssid, password, false);
      logger.info('✅ Connected to WiFi:', ssid);

      // Wait for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error: any) {
      logger.error('❌ Failed to connect to hotspot:', error);
      throw new Error(`WiFi connection failed: ${error.message}`);
    }
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string, localPath: string): Promise<boolean> {
    try {
      const RNFS = require('react-native-fs');

      logger.info('⬇️ Starting download:', url);

      const downloadResult = await RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
        progress: (res: any) => {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          logger.info(`📥 Download progress: ${Math.round(progress)}%`);
        }
      }).promise;

      if (downloadResult.statusCode === 200) {
        logger.info('✅ Download completed successfully');
        return true;
      } else {
        logger.error('❌ Download failed with status:', downloadResult.statusCode);
        return false;
      }

    } catch (error: any) {
      logger.error('❌ Download error:', error);
      return false;
    }
  }

  /**
   * Calculate file checksum for integrity verification
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    try {
      const RNFS = require('react-native-fs');
      const hash = await RNFS.hash(filePath, 'md5');
      return hash;
    } catch (error) {
      logger.warn('⚠️ Could not calculate checksum:', error);
      return '';
    }
  }

  /**
   * Get sharing status with detailed information
   */
  getSharingStatus(): {
    isSharing: boolean;
    session?: ShareSession;
    hotspotStatus?: any;
    serverStatus?: any;
  } {
    return {
      isSharing: this.isSharing(),
      session: this.activeSession || undefined,
      hotspotStatus: this.hotspotManager.isActive() ? this.hotspotManager.getCurrentConfig() : undefined,
      serverStatus: this.httpServerManager.getStatus(),
    };
  }

  /**
   * Get current sharing session
   */
  getCurrentSession(): ShareSession | null {
    return this.activeSession;
  }

  /**
   * Check if currently sharing
   */
  isSharing(): boolean {
    return this.activeSession !== null && this.activeSession.isActive;
  }
}

export default RealFileShareService;