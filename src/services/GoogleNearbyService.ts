import logger from '../utils/logger';

export interface NearbyDevice {
  id: string;
  name: string;
  isConnected: boolean;
}

export interface NearbyConnectionInfo {
  endpointId: string;
  endpointName: string;
  authenticationToken?: string;
  isIncomingConnection: boolean;
}

export interface NearbyPayload {
  id: string;
  type: 'file' | 'bytes' | 'stream';
  fileName?: string;
  fileSize?: number;
  progress: number;
  status: 'pending' | 'in_progress' | 'success' | 'failure';
}

export class GoogleNearbyService {
  private static instance: GoogleNearbyService;
  private nearby: any; // Mock implementation - will be replaced when Google Nearby library is available
  private isInitialized = false;
  private discoveredDevices: NearbyDevice[] = [];
  private connectedDevices: NearbyDevice[] = [];
  private pendingPayloads: Map<string, NearbyPayload> = new Map();
  private listeners: {
    onDeviceFound?: (device: NearbyDevice) => void;
    onDeviceLost?: (deviceId: string) => void;
    onConnectionInitiated?: (info: NearbyConnectionInfo) => void;
    onConnectionResult?: (device: NearbyDevice, success: boolean) => void;
    onDisconnected?: (deviceId: string) => void;
    onPayloadReceived?: (payload: NearbyPayload) => void;
    onPayloadProgress?: (payloadId: string, progress: number) => void;
  } = {};

  private constructor() {
    // Google Nearby implementation will be added when a compatible library is found
    logger.info('🔄 GoogleNearbyService: Initialized (mock implementation - waiting for compatible Google Nearby library)');
  }

  static getInstance(): GoogleNearbyService {
    if (!GoogleNearbyService.instance) {
      GoogleNearbyService.instance = new GoogleNearbyService();
    }
    return GoogleNearbyService.instance;
  }

  private setupEventListeners(): void {
    // Mock implementation - will be replaced when Google Nearby library is available
    logger.info('🔄 GoogleNearbyService: Event listeners setup (mock implementation)');
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      logger.info('🚀 Google Nearby: Initializing service...');

      // Check if Google Play Services is available
      const hasPlayServices = await this.checkPlayServices();
      if (!hasPlayServices) {
        logger.error('❌ Google Nearby: Google Play Services not available');
        return false;
      }

      this.isInitialized = true;
      logger.info('✅ Google Nearby: Service initialized successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Initialization failed', error);
      return false;
    }
  }

  private async checkPlayServices(): Promise<boolean> {
    try {
      // This would typically check Google Play Services availability
      // For now, assume it's available on Android devices
      return true;
    } catch (error) {
      return false;
    }
  }

  async startAdvertising(deviceName?: string): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const name = deviceName || `SPRED_${Date.now().toString().slice(-4)}`;
      logger.info('📡 Google Nearby: Starting advertising as', name);

      await this.nearby.startAdvertising(name);
      logger.info('✅ Google Nearby: Advertising started successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Advertising failed', error);
      return false;
    }
  }

  async stopAdvertising(): Promise<void> {
    try {
      logger.info('🛑 Google Nearby: Stopping advertising');
      await this.nearby.stopAdvertising();
      logger.info('✅ Google Nearby: Advertising stopped');
    } catch (error: any) {
      logger.error('❌ Google Nearby: Stop advertising failed', error);
    }
  }

  async startDiscovery(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      logger.info('🔍 Google Nearby: Starting discovery');

      // Clear previous discoveries
      this.discoveredDevices = [];

      await this.nearby.startDiscovery();
      logger.info('✅ Google Nearby: Discovery started successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Discovery failed', error);
      return false;
    }
  }

  async stopDiscovery(): Promise<void> {
    try {
      logger.info('🛑 Google Nearby: Stopping discovery');
      await this.nearby.stopDiscovery();
      logger.info('✅ Google Nearby: Discovery stopped');
    } catch (error: any) {
      logger.error('❌ Google Nearby: Stop discovery failed', error);
    }
  }

  async requestConnection(endpointId: string): Promise<boolean> {
    try {
      logger.info('🔗 Google Nearby: Requesting connection to', endpointId);
      await this.nearby.requestConnection('SPRED_Device', endpointId);
      logger.info('✅ Google Nearby: Connection request sent');
      return true;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Connection request failed', error);
      return false;
    }
  }

  async acceptConnection(endpointId: string): Promise<boolean> {
    try {
      logger.info('✅ Google Nearby: Accepting connection from', endpointId);
      await this.nearby.acceptConnection(endpointId);
      logger.info('✅ Google Nearby: Connection accepted');
      return true;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Accept connection failed', error);
      return false;
    }
  }

  async rejectConnection(endpointId: string): Promise<boolean> {
    try {
      logger.info('❌ Google Nearby: Rejecting connection from', endpointId);
      await this.nearby.rejectConnection(endpointId);
      logger.info('✅ Google Nearby: Connection rejected');
      return true;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Reject connection failed', error);
      return false;
    }
  }

  async disconnect(endpointId: string): Promise<void> {
    try {
      logger.info('🔌 Google Nearby: Disconnecting from', endpointId);
      await this.nearby.disconnect(endpointId);
      logger.info('✅ Google Nearby: Disconnected');
    } catch (error: any) {
      logger.error('❌ Google Nearby: Disconnect failed', error);
    }
  }

  async sendFile(endpointId: string, filePath: string): Promise<string | null> {
    try {
      logger.info('📤 Google Nearby: Sending file', { endpointId, filePath });

      const payloadId = await this.nearby.sendFile(endpointId, filePath);
      const payloadIdStr = payloadId?.toString() || `payload_${Date.now()}`;

      // Track the payload
      const payload: NearbyPayload = {
        id: payloadIdStr,
        type: 'file',
        fileName: filePath.split('/').pop(),
        progress: 0,
        status: 'pending',
      };

      this.pendingPayloads.set(payloadIdStr, payload);
      logger.info('✅ Google Nearby: File send initiated', payloadIdStr);
      return payloadIdStr;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Send file failed', error);
      return null;
    }
  }

  async sendBytes(
    endpointId: string,
    data: Uint8Array,
  ): Promise<string | null> {
    try {
      logger.info('📤 Google Nearby: Sending bytes', {
        endpointId,
        size: data.length,
      });

      const payloadId = await this.nearby.sendBytes(endpointId, data);
      const payloadIdStr = payloadId?.toString() || `payload_${Date.now()}`;

      const payload: NearbyPayload = {
        id: payloadIdStr,
        type: 'bytes',
        progress: 0,
        status: 'pending',
      };

      this.pendingPayloads.set(payloadIdStr, payload);
      logger.info('✅ Google Nearby: Bytes send initiated', payloadIdStr);
      return payloadIdStr;
    } catch (error: any) {
      logger.error('❌ Google Nearby: Send bytes failed', error);
      return null;
    }
  }

  // Event listener management
  onDeviceFound(callback: (device: NearbyDevice) => void): void {
    this.listeners.onDeviceFound = callback;
  }

  onDeviceLost(callback: (deviceId: string) => void): void {
    this.listeners.onDeviceLost = callback;
  }

  onConnectionInitiated(callback: (info: NearbyConnectionInfo) => void): void {
    this.listeners.onConnectionInitiated = callback;
  }

  onConnectionResult(
    callback: (device: NearbyDevice, success: boolean) => void,
  ): void {
    this.listeners.onConnectionResult = callback;
  }

  onDisconnected(callback: (deviceId: string) => void): void {
    this.listeners.onDisconnected = callback;
  }

  onPayloadReceived(callback: (payload: NearbyPayload) => void): void {
    this.listeners.onPayloadReceived = callback;
  }

  onPayloadProgress(
    callback: (payloadId: string, progress: number) => void,
  ): void {
    this.listeners.onPayloadProgress = callback;
  }

  // Getters
  getDiscoveredDevices(): NearbyDevice[] {
    return [...this.discoveredDevices];
  }

  getConnectedDevices(): NearbyDevice[] {
    return [...this.connectedDevices];
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.some(d => d.id === deviceId);
  }

  getPendingPayloads(): NearbyPayload[] {
    return Array.from(this.pendingPayloads.values());
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Google Nearby: Cleaning up service');

      await this.stopAdvertising();
      await this.stopDiscovery();

      // Disconnect from all devices
      for (const device of this.connectedDevices) {
        await this.disconnect(device.id);
      }

      this.discoveredDevices = [];
      this.connectedDevices = [];
      this.pendingPayloads.clear();
      this.isInitialized = false;

      logger.info('✅ Google Nearby: Cleanup completed');
    } catch (error: any) {
      logger.error('❌ Google Nearby: Cleanup failed', error);
    }
  }
}

export default GoogleNearbyService;
