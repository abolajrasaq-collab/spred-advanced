import logger from '../utils/logger';

export interface ServerConfig {
  port: number;
  filePath: string;
  fileName: string;
  mimeType: string;
}

export interface ServerStatus {
  isRunning: boolean;
  port?: number;
  url?: string;
  filePath?: string;
  requestCount: number;
  startTime?: number;
  error?: string;
}

export interface DownloadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number; // 0-100
  speed: number; // bytes per second
}

export class HTTPServerManager {
  private static instance: HTTPServerManager;
  private server: any = null;
  private config: ServerConfig | null = null;
  private requestCount = 0;
  private startTime: number | null = null;
  private progressCallback: ((progress: DownloadProgress) => void) | null = null;

  private constructor() {}

  static getInstance(): HTTPServerManager {
    if (!HTTPServerManager.instance) {
      HTTPServerManager.instance = new HTTPServerManager();
    }
    return HTTPServerManager.instance;
  }

  /**
   * Start HTTP server with enhanced features
   */
  async startServer(config: ServerConfig): Promise<string> {
    try {
      logger.info('🌐 Starting HTTP server on port:', config.port);

      // Stop existing server if running
      if (this.server) {
        await this.stopServer();
      }

      // Validate file exists
      const RNFS = require('react-native-fs');
      const fileExists = await RNFS.exists(config.filePath);
      if (!fileExists) {
        throw new Error(`File not found: ${config.filePath}`);
      }

      // Get file stats
      const stats = await RNFS.stat(config.filePath);
      const fileSize = stats.size;

      logger.info('📁 Serving file:', {
        path: config.filePath,
        name: config.fileName,
        size: `${Math.round(fileSize / 1024 / 1024)}MB`,
        type: config.mimeType,
      });

      // Use SimpleHTTPServer for real HTTP functionality
      const SimpleHTTPServer = require('./SimpleHTTPServer').default;
      const simpleServer = SimpleHTTPServer.getInstance();
      
      const serverConfig = {
        port: config.port,
        filePath: config.filePath,
        fileName: config.fileName,
        mimeType: config.mimeType,
      };

      const serverUrl = await simpleServer.startServer(serverConfig);
      
      // Store reference to simple server
      this.server = {
        simpleServer,
        port: config.port,
        stop: () => simpleServer.stopServer(),
        isRunning: () => simpleServer.isServerRunning()
      };

      // Store configuration
      this.config = config;
      this.requestCount = 0;
      this.startTime = Date.now();

      logger.info('✅ HTTP server started:', serverUrl);

      return serverUrl;

    } catch (error: any) {
      logger.error('❌ Failed to start HTTP server:', error);
      this.cleanup();
      throw new Error(`HTTP server failed: ${error.message}`);
    }
  }

  /**
   * Handle video file requests with streaming and range support
   */
  private async handleVideoRequest(
    req: any,
    res: any,
    filePath: string,
    fileSize: number,
    mimeType: string
  ): Promise<void> {
    try {
      this.requestCount++;
      logger.info(`📤 Serving video request #${this.requestCount}`);

      const RNFS = require('react-native-fs');

      // Handle range requests for video streaming
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        logger.info('📊 Range request:', { start, end, chunkSize });

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
          'Cache-Control': 'no-cache',
        });

        // Stream chunk
        const readStream = RNFS.createReadStream(filePath, { start, end });
        readStream.pipe(res);

      } else {
        // Full file request
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': fileSize,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'no-cache',
          'Content-Disposition': `attachment; filename="${this.config?.fileName || 'video.mp4'}"`,
        });

        // Stream full file with progress tracking
        const readStream = RNFS.createReadStream(filePath);
        let bytesTransferred = 0;
        const startTime = Date.now();

        readStream.on('data', (chunk: Buffer) => {
          bytesTransferred += chunk.length;
          
          // Calculate progress and speed
          const progress = (bytesTransferred / fileSize) * 100;
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = elapsed > 0 ? bytesTransferred / elapsed : 0;

          // Notify progress callback
          if (this.progressCallback) {
            this.progressCallback({
              bytesTransferred,
              totalBytes: fileSize,
              progress,
              speed,
            });
          }

          // Log progress every 10%
          if (Math.floor(progress) % 10 === 0 && Math.floor(progress) > 0) {
            logger.info(`📊 Transfer progress: ${Math.floor(progress)}% (${Math.round(speed / 1024)}KB/s)`);
          }
        });

        readStream.on('end', () => {
          logger.info('✅ File transfer completed');
        });

        readStream.on('error', (error: any) => {
          logger.error('❌ Stream error:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Stream error');
        });

        readStream.pipe(res);
      }

    } catch (error: any) {
      logger.error('❌ Error serving video:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
    }
  }

  /**
   * Handle file info requests
   */
  private async handleInfoRequest(res: any, fileName: string, fileSize: number): Promise<void> {
    try {
      const info = {
        fileName,
        fileSize,
        fileSizeMB: Math.round(fileSize / 1024 / 1024),
        serverTime: new Date().toISOString(),
        requestCount: this.requestCount,
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(info, null, 2));

    } catch (error: any) {
      logger.error('❌ Error serving info:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Info error');
    }
  }

  /**
   * Handle server status requests
   */
  private async handleStatusRequest(res: any): Promise<void> {
    try {
      const status = {
        isRunning: true,
        port: this.config?.port,
        requestCount: this.requestCount,
        uptime: this.startTime ? Date.now() - this.startTime : 0,
        timestamp: new Date().toISOString(),
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status, null, 2));

    } catch (error: any) {
      logger.error('❌ Error serving status:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Status error');
    }
  }

  /**
   * Stop HTTP server
   */
  async stopServer(): Promise<void> {
    try {
      if (this.server) {
        logger.info('🛑 Stopping HTTP server...');
        await this.server.stop();
        this.server = null;
        logger.info('✅ HTTP server stopped');
      }

      this.cleanup();

    } catch (error: any) {
      logger.error('❌ Error stopping HTTP server:', error);
      this.cleanup();
    }
  }

  /**
   * Get server status
   */
  getStatus(): ServerStatus {
    if (!this.server || !this.config) {
      return {
        isRunning: false,
        requestCount: 0,
      };
    }

    return {
      isRunning: true,
      port: this.config.port,
      url: `http://192.168.43.1:${this.config.port}`,
      filePath: this.config.filePath,
      requestCount: this.requestCount,
      startTime: this.startTime || undefined,
    };
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.server !== null;
  }

  /**
   * Set progress callback for download tracking
   */
  setProgressCallback(callback: (progress: DownloadProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * Clear progress callback
   */
  clearProgressCallback(): void {
    this.progressCallback = null;
  }

  /**
   * Get MIME type for file extension
   */
  static getMimeType(fileName: string): string {
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
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.config = null;
    this.requestCount = 0;
    this.startTime = null;
    this.progressCallback = null;
  }

  /**
   * Full cleanup including server stop
   */
  async fullCleanup(): Promise<void> {
    try {
      await this.stopServer();
      logger.info('✅ HTTPServerManager cleanup completed');
    } catch (error) {
      logger.error('❌ Error during HTTPServerManager cleanup:', error);
    }
  }
}

export default HTTPServerManager;