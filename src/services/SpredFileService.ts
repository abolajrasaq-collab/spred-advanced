import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// Safely access RNFS with null check for production builds
const safeRNFS = RNFS || {
  DocumentDirectoryPath: '/data/data/com.spred/files',
  exists: () => Promise.resolve(false),
  mkdir: () => Promise.resolve(),
  stat: () => Promise.reject(new Error('RNFS not available')),
  copyFile: () => Promise.reject(new Error('RNFS not available')),
  moveFile: () => Promise.reject(new Error('RNFS not available')),
  readDir: () => Promise.resolve([]),
  unlink: () => Promise.resolve(),
};

/**
 * SPRED File Management Service
 *
 * Centralized file handling for SPRED P2P transfers with proper
 * platform-specific path management and file validation.
 */

export interface SpredFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'video' | 'audio' | 'image' | 'other';
  mimeType: string;
  createdAt: Date;
  isDownloaded: boolean;
  isReceived: boolean;
  sourceUrl?: string;
  thumbnail?: string;
}

export interface TransferProgress {
  id: string;
  fileName: string;
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  status: 'preparing' | 'transferring' | 'completed' | 'failed' | 'cancelled';
}

class SpredFileService {
  private static instance: SpredFileService;
  private transferCallbacks: Map<string, (progress: TransferProgress) => void> =
    new Map();

  private constructor() {}

  static getInstance(): SpredFileService {
    if (!SpredFileService.instance) {
      SpredFileService.instance = new SpredFileService();
    }
    return SpredFileService.instance;
  }

  /**
   * Get platform-specific SPRED directory
   */
  getSpredDirectory(): string {
    if (Platform.OS === 'android') {
      // Use app-specific internal directory for Android (more reliable)
      return `${safeRNFS.DocumentDirectoryPath}/Spred`;
    } else {
      // Use document directory for iOS
      return `${safeRNFS.DocumentDirectoryPath}/Spred`;
    }
  }

  /**
   * Get download directory path (for compatibility)
   */
  getDownloadPath(): string {
    const dirs = this.getDirectories();
    return dirs.downloads;
  }

  /**
   * Get specific subdirectories
   */
  private getDirectories() {
    const baseDir = this.getSpredDirectory();
    return {
      base: baseDir,
      downloads: `${baseDir}/Downloads`,
      received: `${baseDir}/Received`,
      temp: `${baseDir}/Temp`,
      thumbnails: `${baseDir}/Thumbnails`,
    };
  }

  /**
   * Initialize all SPRED directories
   */
  async initializeDirectories(): Promise<void> {
    const dirs = this.getDirectories();

    try {
      // DISABLED FOR PERFORMANCE
      // console.log('📁 Creating SPRED base directory:', dirs.base);

      // Check if directory already exists first
      const baseExists = await safeRNFS.exists(dirs.base);
      if (!baseExists) {
        // DISABLED FOR PERFORMANCE
        // console.log('📁 Base directory does not exist, creating...');
        await safeRNFS.mkdir(dirs.base);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Base directory created');
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Base directory already exists');
      }

      // DISABLED FOR PERFORMANCE
      // console.log('📁 Creating Downloads directory:', dirs.downloads);
      const downloadsExists = await safeRNFS.exists(dirs.downloads);
      if (!downloadsExists) {
        await safeRNFS.mkdir(dirs.downloads);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Downloads directory created');
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Downloads directory already exists');
      }

      // DISABLED FOR PERFORMANCE
      // console.log('📁 Creating Received directory:', dirs.received);
      const receivedExists = await safeRNFS.exists(dirs.received);
      if (!receivedExists) {
        await safeRNFS.mkdir(dirs.received);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Received directory created');
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Received directory already exists');
      }

      // DISABLED FOR PERFORMANCE
      // console.log('📁 Creating Temp directory:', dirs.temp);
      const tempExists = await safeRNFS.exists(dirs.temp);
      if (!tempExists) {
        await safeRNFS.mkdir(dirs.temp);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Temp directory created');
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Temp directory already exists');
      }

      // DISABLED FOR PERFORMANCE
      // console.log('📁 Creating Thumbnails directory:', dirs.thumbnails);
      const thumbnailsExists = await safeRNFS.exists(dirs.thumbnails);
      if (!thumbnailsExists) {
        await safeRNFS.mkdir(dirs.thumbnails);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Thumbnails directory created');
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Thumbnails directory already exists');
      }

      // DISABLED FOR PERFORMANCE
      // console.log('✅ All SPRED directories initialized successfully');
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Failed to initialize SPRED directories:', error);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Directory paths being created:', dirs);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Specific error:', errorMessage);

      // Try to provide a fallback - use just the base directory
      try {
        // DISABLED FOR PERFORMANCE
        // console.log('🔄 Attempting fallback directory creation...');
        await safeRNFS.mkdir(dirs.base);
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Fallback base directory created successfully');
      } catch (fallbackError) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ Even fallback creation failed:', fallbackError);
        throw new Error(
          `Failed to initialize storage directories: ${errorMessage}`,
        );
      }
    }
  }

  /**
   * Validate file before SPRED transfer
   */
  async validateFile(
    filePath: string,
  ): Promise<{ valid: boolean; error?: string; file?: SpredFile }> {
    try {
      // Check if file exists
      const exists = await safeRNFS.exists(filePath);
      if (!exists) {
        return { valid: false, error: 'File does not exist' };
      }

      // Get file stats
      const stat = await safeRNFS.stat(filePath);

      // Check file size (min 1KB, max 2GB)
      if (stat.size < 1024) {
        return { valid: false, error: 'File is too small (minimum 1KB)' };
      }

      if (stat.size > 2 * 1024 * 1024 * 1024) {
        return { valid: false, error: 'File is too large (maximum 2GB)' };
      }

      // Determine file type
      const extension = filePath.split('.').pop()?.toLowerCase() || '';
      const mimeType = this.getMimeType(extension);
      const fileType = this.getFileType(mimeType);

      // Create file object
      const file: SpredFile = {
        id: this.generateFileId(filePath),
        name: this.getFileName(filePath),
        path: filePath,
        size: stat.size,
        type: fileType,
        mimeType,
        createdAt: new Date(stat.mtime || Date.now()),
        isDownloaded: filePath.includes('Downloads'),
        isReceived: filePath.includes('Received'),
      };

      return { valid: true, file };
    } catch (error) {
      return {
        valid: false,
        error: `File validation failed: ${error.message}`,
      };
    }
  }

  /**
   * Get safe file path for SPRED operations
   */
  getSafeFilePath(
    fileName: string,
    type: 'download' | 'received' | 'temp' = 'temp',
  ): string {
    const dirs = this.getDirectories();
    let targetDir: string;

    switch (type) {
      case 'download':
        targetDir = dirs.downloads;
        break;
      case 'received':
        targetDir = dirs.received;
        break;
      default:
        targetDir = dirs.temp;
    }

    // Sanitize filename
    const sanitizedName = this.sanitizeFileName(fileName);
    const filePath = `${targetDir}/${sanitizedName}`;

    return filePath;
  }

  /**
   * Prepare file for sending
   */
  async prepareFileForSend(
    sourcePath: string,
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Validate the file first
      const validation = await this.validateFile(sourcePath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Create a copy in temp directory for transfer
      const tempPath = this.getSafeFilePath(validation.file!.name, 'temp');

      // Copy file to temp location
      await safeRNFS.copyFile(sourcePath, tempPath);

      return { success: true, filePath: tempPath };
    } catch (error) {
      return {
        success: false,
        error: `Failed to prepare file: ${error.message}`,
      };
    }
  }

  /**
   * Handle received file
   */
  async handleReceivedFile(
    tempPath: string,
    originalName: string,
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      // Validate received file
      const validation = await this.validateFile(tempPath);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Move to received directory
      const receivedPath = this.getSafeFilePath(originalName, 'received');

      // Ensure the target directory exists
      await safeRNFS.mkdir(this.getDirectories().received);

      // Move file from temp to received
      await safeRNFS.moveFile(tempPath, receivedPath);

      return { success: true, filePath: receivedPath };
    } catch (error) {
      return {
        success: false,
        error: `Failed to handle received file: ${error.message}`,
      };
    }
  }

  /**
   * Get all SPRED files
   */
  async getSpredFiles(): Promise<SpredFile[]> {
    try {
      const dirs = this.getDirectories();
      const files: SpredFile[] = [];

      // Scan both downloads and received directories
      await Promise.all([
        this.scanDirectory(dirs.downloads, true),
        this.scanDirectory(dirs.received, false),
      ]).then(([downloadedFiles, receivedFiles]) => {
        files.push(...downloadedFiles, ...receivedFiles);
      });

      // Sort by creation date (newest first)
      return files.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Failed to get SPRED files:', error);
      return [];
    }
  }

  /**
   * Scan directory for files
   */
  private async scanDirectory(
    dirPath: string,
    isDownloaded: boolean,
  ): Promise<SpredFile[]> {
    try {
      const exists = await safeRNFS.exists(dirPath);
      if (!exists) {
        return [];
      }

      const items = await safeRNFS.readDir(dirPath);
      const files: SpredFile[] = [];

      for (const item of items) {
        if (item.isFile()) {
          const stat = await safeRNFS.stat(item.path);
          const extension = item.name.split('.').pop()?.toLowerCase() || '';
          const mimeType = this.getMimeType(extension);
          const fileType = this.getFileType(mimeType);

          files.push({
            id: this.generateFileId(item.path),
            name: item.name,
            path: item.path,
            size: stat.size,
            type: fileType,
            mimeType,
            createdAt: new Date(stat.mtime || Date.now()),
            isDownloaded,
            isReceived: !isDownloaded,
          });
        }
      }

      return files;
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(`Failed to scan directory ${dirPath}:`, error);
      return [];
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(): Promise<void> {
    try {
      const tempDir = this.getDirectories().temp;
      const exists = await safeRNFS.exists(tempDir);

      if (exists) {
        const items = await safeRNFS.readDir(tempDir);

        // Remove files older than 1 hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        for (const item of items) {
          if (item.isFile()) {
            const stat = await safeRNFS.stat(item.path);
            if (stat.mtime && stat.mtime < oneHourAgo) {
              await safeRNFS.unlink(item.path);
            }
          }
        }
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Failed to cleanup temp files:', error);
    }
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) {
      return '0 B';
    }

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Register transfer progress callback
   */
  registerProgressCallback(
    transferId: string,
    callback: (progress: TransferProgress) => void,
  ): void {
    this.transferCallbacks.set(transferId, callback);
  }

  /**
   * Unregister transfer progress callback
   */
  unregisterProgressCallback(transferId: string): void {
    this.transferCallbacks.delete(transferId);
  }

  /**
   * Update transfer progress
   */
  updateTransferProgress(progress: TransferProgress): void {
    const callback = this.transferCallbacks.get(progress.id);
    if (callback) {
      callback(progress);
    }
  }

  // Helper methods
  private getMimeType(extension: string): string {
    const mimeTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
      flv: 'video/x-flv',
      webm: 'video/webm',
      mkv: 'video/x-matroska',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      flac: 'audio/flac',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  private getFileType(mimeType: string): 'video' | 'audio' | 'image' | 'other' {
    if (mimeType.startsWith('video/')) {
      return 'video';
    }
    if (mimeType.startsWith('audio/')) {
      return 'audio';
    }
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    return 'other';
  }

  private getFileName(filePath: string): string {
    return filePath.split('/').pop() || 'unknown';
  }

  private sanitizeFileName(fileName: string): string {
    // Remove dangerous characters and limit length
    return (
      fileName
        .replace(/[<>:"/\\|?*]/g, '_')
        .substring(0, 255)
        .trim() || 'untitled'
    );
  }

  private generateFileId(filePath: string): string {
    return Buffer.from(filePath).toString('base64').substring(0, 16);
  }
}

export default SpredFileService;
export { SpredFileService, type SpredFile, type TransferProgress };
