/**
 * WiFi P2P Video Sharing Service
 * React Native TypeScript interface to Android Native Module
 */

import { NativeModules, DeviceEventEmitter } from 'react-native';

interface WifiP2PModule {
  setVideoPath(videoPath: string): void;
  createHotspot(videoId: string): Promise<{
    qrData: string;
    deviceInfo: string;
  }>;
  connectToHotspot(qrData: string): Promise<{
    deviceInfo: string;
    status: string;
  }>;
  startVideoTransfer(videoPath: string): Promise<{
    filePath: string;
  }>;
  receiveVideo(): Promise<{
    filePath: string;
  }>;
  cleanup(): void;
  MODULE_VERSION: string;
}

const { WifiP2PModule } = NativeModules;

export default WifiP2PModule as WifiP2PModule;

/**
 * Types for WiFi P2P operations
 */
export interface QRCodeData {
  app: string;
  type: string;
  action: string;
  video_id: string;
  ip: string;
  port: number;
  timestamp: number;
}

export interface TransferProgress {
  type: 'progress' | 'complete' | 'error';
  percentage?: number;
  filePath?: string;
  error?: string;
}

/**
 * Event listeners for transfer progress
 */
export class WifiP2PEventEmitter {
  private transferProgressListener?: any;
  private receiveProgressListener?: any;

  /**
   * Listen for transfer progress (sender)
   */
  onTransferProgress(callback: (progress: number) => void) {
    if (this.transferProgressListener) {
      DeviceEventEmitter.remove('VideoTransferProgress', this.transferProgressListener);
    }

    this.transferProgressListener = (progress: number) => {
      callback(progress);
    };

    DeviceEventEmitter.addListener('VideoTransferProgress', this.transferProgressListener);
  }

  /**
   * Listen for receive progress (receiver)
   */
  onReceiveProgress(callback: (progress: number) => void) {
    if (this.receiveProgressListener) {
      DeviceEventEmitter.remove('VideoReceiveProgress', this.receiveProgressListener);
    }

    this.receiveProgressListener = (progress: number) => {
      callback(progress);
    };

    DeviceEventEmitter.addListener('VideoReceiveProgress', this.receiveProgressListener);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (this.transferProgressListener) {
      DeviceEventEmitter.remove('VideoTransferProgress', this.transferProgressListener);
    }
    if (this.receiveProgressListener) {
      DeviceEventEmitter.remove('VideoReceiveProgress', this.receiveProgressListener);
    }
  }
}

/**
 * Export event emitter instance
 */
export const wifiP2PEmitter = new WifiP2PEventEmitter();

/**
 * Parse QR code data
 */
export function parseQRCodeData(qrData: string): QRCodeData | null {
  try {
    return JSON.parse(qrData) as QRCodeData;
  } catch (error) {
    console.error('Failed to parse QR code data:', error);
    return null;
  }
}

/**
 * Validate QR code data
 */
export function validateQRCodeData(data: QRCodeData): boolean {
  return !!(
    data &&
    data.app === 'spred_vod_app' &&
    data.type === 'video_share' &&
    data.action === 'receive' &&
    data.video_id &&
    data.ip &&
    data.port
  );
}

/**
 * Get QR code as base64 data URI for Image component
 */
export function getQRCodeDataURI(base64Data: string): string {
  return `data:image/png;base64,${base64Data}`;
}

/**
 * Convert progress percentage to display string
 */
export function formatProgress(progress: number): string {
  if (progress < 0) return '0%';
  if (progress > 100) return '100%';
  return `${Math.round(progress)}%`;
}

/**
 * Estimate transfer time based on file size and speed
 */
export function estimateTransferTime(
  fileSizeInBytes: number,
  progressPercentage: number,
  elapsedTimeInSeconds: number
): string {
  if (progressPercentage <= 0) return 'Calculating...';

  const totalTime = elapsedTimeInSeconds / (progressPercentage / 100);
  const remainingTime = totalTime - elapsedTimeInSeconds;

  if (remainingTime < 0) return '0s';

  const minutes = Math.floor(remainingTime / 60);
  const seconds = Math.floor(remainingTime % 60);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}

/**
 * Calculate transfer speed
 */
export function calculateSpeed(
  bytesTransferred: number,
  elapsedTimeInSeconds: number
): string {
  if (elapsedTimeInSeconds <= 0) return '0 MB/s';

  const bytesPerSecond = bytesTransferred / elapsedTimeInSeconds;
  const mbPerSecond = bytesPerSecond / (1024 * 1024);

  return `${mbPerSecond.toFixed(2)} MB/s`;
}
