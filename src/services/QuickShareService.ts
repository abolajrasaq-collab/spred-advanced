import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import logger from '../utils/logger';

export interface SharedFileInfo {
  id: string;
  title: string;
  filePath: string;
  source: 'received';
  receivedDate: string;
  fileSize: number;
  originalUri?: string;
}

class QuickShareService {
  private static instance: QuickShareService;
  private spredReceivedDir: string;

  private constructor() {
    // Set up SPRED internal directories
    this.spredReceivedDir = `${RNFS.DocumentDirectoryPath}/SPRED/Received`;
    this.initializeDirectories();
  }

  static getInstance(): QuickShareService {
    if (!QuickShareService.instance) {
      QuickShareService.instance = new QuickShareService();
    }
    return QuickShareService.instance;
  }

  private async initializeDirectories(): Promise<void> {
    try {
      // Create SPRED directories
      const spredDir = `${RNFS.DocumentDirectoryPath}/SPRED`;
      await RNFS.mkdir(spredDir);
      await RNFS.mkdir(this.spredReceivedDir);

      logger.info('✅ QuickShareService: Directories initialized', {
        spredDir,
        receivedDir: this.spredReceivedDir,
      });
    } catch (error) {
      logger.error('❌ QuickShareService: Failed to initialize directories', error);
    }
  }

  /**
   * Handle incoming shared file from Android Quick Share
   */
  async handleSharedFile(sharedFileUri: string): Promise<SharedFileInfo | null> {
    try {
      logger.info('📥 QuickShareService: Handling shared file', sharedFileUri);

      // Extract file information
      const fileName = this.extractFileName(sharedFileUri);
      const title = this.extractTitleFromUri(sharedFileUri);

      // Generate unique filename to avoid conflicts
      const uniqueFileName = `${Date.now()}_${fileName}`;
      const internalPath = `${this.spredReceivedDir}/${uniqueFileName}`;

      // Move file from system location to SPRED internal storage
      await this.moveFileToInternalStorage(sharedFileUri, internalPath);

      // Get file stats
      const fileStats = await RNFS.stat(internalPath);

      const sharedFileInfo: SharedFileInfo = {
        id: `received_${Date.now()}`,
        title: title || 'Shared Video',
        filePath: internalPath,
        source: 'received',
        receivedDate: new Date().toISOString(),
        fileSize: fileStats.size,
        originalUri: sharedFileUri,
      };

      logger.info('✅ QuickShareService: File processed successfully', sharedFileInfo);
      return sharedFileInfo;
    } catch (error) {
      logger.error('❌ QuickShareService: Failed to handle shared file', error);
      return null;
    }
  }

  /**
   * Move file from Android system location to SPRED internal storage
   */
  private async moveFileToInternalStorage(sourceUri: string, destPath: string): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // On Android, we need to copy the file from content:// URI to internal storage
        await RNFS.copyFile(sourceUri, destPath);
        logger.info('📋 QuickShareService: File copied to internal storage', {
          from: sourceUri,
          to: destPath,
        });
      } else {
        // iOS handling (if needed in future)
        await RNFS.copyFile(sourceUri, destPath);
      }
    } catch (error) {
      logger.error('❌ QuickShareService: Failed to move file', error);
      throw error;
    }
  }

  /**
   * Extract filename from URI
   */
  private extractFileName(uri: string): string {
    try {
      // Handle different URI formats
      if (uri.includes('content://')) {
        // Android content URI - extract from display name or use generic name
        return 'shared_video.mp4';
      } else if (uri.includes('/')) {
        // Regular file path
        return uri.split('/').pop() || 'shared_video.mp4';
      } else {
        return 'shared_video.mp4';
      }
    } catch (error) {
      logger.warn('⚠️ QuickShareService: Error extracting filename, using default', error);
      return 'shared_video.mp4';
    }
  }

  /**
   * Extract title from URI or use default
   */
  private extractTitleFromUri(uri: string): string {
    try {
      // For now, use a generic title - could be enhanced to extract from metadata
      return 'Shared Video';
    } catch (error) {
      return 'Shared Video';
    }
  }

  /**
   * Get all received files
   */
  async getReceivedFiles(): Promise<SharedFileInfo[]> {
    try {
      const files = await RNFS.readDir(this.spredReceivedDir);
      const receivedFiles: SharedFileInfo[] = [];

      for (const file of files) {
        if (file.isFile() && file.name.endsWith('.mp4')) {
          // Try to load metadata if available
          const metadataPath = `${file.path}.meta.json`;
          let metadata: any = {};

          try {
            const metadataContent = await RNFS.readFile(metadataPath, 'utf8');
            metadata = JSON.parse(metadataContent);
          } catch (metaError) {
            // Metadata not available, use defaults
            logger.debug('⚠️ QuickShareService: No metadata for file', file.name);
          }

          receivedFiles.push({
            id: metadata.id || `received_${file.mtime?.getTime() || Date.now()}`,
            title: metadata.title || 'Shared Video',
            filePath: file.path,
            source: 'received',
            receivedDate: metadata.receivedDate || file.mtime?.toISOString() || new Date().toISOString(),
            fileSize: file.size,
            originalUri: metadata.originalUri,
          });
        }
      }

      logger.info(`📋 QuickShareService: Found ${receivedFiles.length} received files`);
      return receivedFiles;
    } catch (error) {
      logger.error('❌ QuickShareService: Failed to get received files', error);
      return [];
    }
  }

  /**
   * Delete a received file
   */
  async deleteReceivedFile(filePath: string): Promise<boolean> {
    try {
      // Delete the video file
      await RNFS.unlink(filePath);

      // Try to delete metadata file if it exists
      const metadataPath = `${filePath}.meta.json`;
      try {
        await RNFS.unlink(metadataPath);
      } catch (metaError) {
        // Metadata file might not exist, ignore
      }

      logger.info('🗑️ QuickShareService: File deleted successfully', filePath);
      return true;
    } catch (error) {
      logger.error('❌ QuickShareService: Failed to delete file', error);
      return false;
    }
  }

  /**
   * Save metadata for a received file
   */
  async saveFileMetadata(fileInfo: SharedFileInfo): Promise<void> {
    try {
      const metadataPath = `${fileInfo.filePath}.meta.json`;
      const metadata = {
        id: fileInfo.id,
        title: fileInfo.title,
        source: fileInfo.source,
        receivedDate: fileInfo.receivedDate,
        fileSize: fileInfo.fileSize,
        originalUri: fileInfo.originalUri,
      };

      await RNFS.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      logger.info('💾 QuickShareService: Metadata saved', metadataPath);
    } catch (error) {
      logger.warn('⚠️ QuickShareService: Failed to save metadata', error);
    }
  }

  /**
   * Clean up old received files (optional maintenance)
   */
  async cleanupOldFiles(daysOld: number = 30): Promise<number> {
    try {
      const files = await this.getReceivedFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      let deletedCount = 0;
      for (const file of files) {
        const fileDate = new Date(file.receivedDate);
        if (fileDate < cutoffDate) {
          await this.deleteReceivedFile(file.filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`🧹 QuickShareService: Cleaned up ${deletedCount} old files`);
      }

      return deletedCount;
    } catch (error) {
      logger.error('❌ QuickShareService: Failed to cleanup old files', error);
      return 0;
    }
  }
}

export default QuickShareService;