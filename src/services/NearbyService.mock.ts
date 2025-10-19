import { Platform, PermissionsAndroid } from 'react-native';
import logger from '../utils/logger';

// Note: This is a mock implementation since react-native-nearby-api might not exist
// In production, replace with actual Nearby API imports
// import NearbyAPI from 'react-native-nearby-api';

export interface NearbyDevice {
  id: string;
  name: string;
  distance?: number;
  status: 'discovered' | 'connecting' | 'connected' | 'disconnected';
}

export interface FileTransferProgress {
  deviceId: string;
  fileName: string;
  progress: number; // 0-100
  bytesTransferred: number;
  totalBytes: number;
  speed?: number; // bytes per second
}

export interface NearbyServiceState {
  isInitialized: boolean;
  isAdvertising: boolean;
  isDiscovering: boolean;
  discoveredDevices: NearbyDevice[];
  connectedDevices: string[];
  currentTransfer?: FileTransferProgress;
  error?: string;
}

type NearbyEventListener = (state: NearbyServiceState) => void;

export class NearbyService {
  private static instance: NearbyService;
  private state: NearbyServiceState;
  private listeners: NearbyEventListener[] = [];
  private serviceId = 'SPRED_VIDEO_SHARE';
  private isMockMode = true; // Set to true for testing, false for production

  private constructor() {
    this.state = {
      isInitialized: false,
      isAdvertising: false,
      isDiscovering: false,
      discoveredDevices: [],
      connectedDevices: [],
    };
  }

  static getInstance(): NearbyService {
    if (!NearbyService.instance) {
      NearbyService.instance = new NearbyService();
    }
    return NearbyService.instance;
  }

  // Subscribe to state changes
  subscribe(listener: NearbyEventListener): () => void {
    this.listeners.push(listener);
    listener(this.state); // Send current state immediately
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private updateState(updates: Partial<NearbyServiceState>) {
    this.state = { ...this.state, ...updates };
    logger.info('🔄 NearbyService state updated:', updates);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        logger.error('❌ Error notifying NearbyService listener:', error);
      }
    });
  }

  // Initialize the Nearby API service
  async initialize(): Promise<boolean> {
    try {
      logger.info('🚀 Initializing Nearby API service...');

      // Check permissions first
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Required permissions not granted');
        }
      }

      // TODO: Replace with actual Nearby API initialization
      // await NearbyAPI.initialize();
      
      // Mock initialization for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.updateState({ 
        isInitialized: true, 
        error: undefined 
      });
      
      logger.info('✅ Nearby API service initialized successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to initialize Nearby API service:', error);
      this.updateState({ 
        error: error.message || 'Failed to initialize Nearby service',
        isInitialized: false 
      });
      return false;
    }
  }

  // Check if required permissions are granted
  private async checkPermissions(): Promise<boolean> {
    // Skip permission checks in mock mode
    if (this.isMockMode) {
      logger.info('📱 Mock mode: Skipping permission checks');
      return true;
    }

    if (Platform.OS === 'android') {
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
        PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
        PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      return Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    
    // iOS permissions are handled automatically
    return true;
  }

  // Request required permissions
  private async requestPermissions(): Promise<boolean> {
    // Skip permission requests in mock mode
    if (this.isMockMode) {
      logger.info('📱 Mock mode: Skipping permission requests');
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
          PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        return Object.values(granted).every(
          result => result === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        logger.error('❌ Error requesting permissions:', error);
        return false;
      }
    }
    
    return true;
  }

  // Start advertising this device for discovery
  async startAdvertising(): Promise<boolean> {
    try {
      if (!this.state.isInitialized) {
        throw new Error('Service not initialized');
      }

      logger.info('📡 Starting advertising...');
      
      // TODO: Replace with actual Nearby API call
      // await NearbyAPI.startAdvertising(this.serviceId);
      
      // Mock advertising for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.updateState({ 
        isAdvertising: true,
        error: undefined 
      });
      
      logger.info('✅ Started advertising successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to start advertising:', error);
      this.updateState({ 
        error: error.message || 'Failed to start advertising',
        isAdvertising: false 
      });
      return false;
    }
  }

  // Start discovering nearby devices
  async startDiscovery(): Promise<boolean> {
    try {
      if (!this.state.isInitialized) {
        throw new Error('Service not initialized');
      }

      logger.info('🔍 Starting device discovery...');
      
      // TODO: Replace with actual Nearby API call
      // await NearbyAPI.startDiscovery(this.serviceId);
      
      // Mock discovery for now
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate discovering devices after a delay
      setTimeout(() => {
        this.simulateDeviceDiscovery();
      }, 2000);
      
      this.updateState({ 
        isDiscovering: true,
        error: undefined 
      });
      
      logger.info('✅ Started discovery successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to start discovery:', error);
      this.updateState({ 
        error: error.message || 'Failed to start discovery',
        isDiscovering: false 
      });
      return false;
    }
  }

  // Mock device discovery for testing
  private simulateDeviceDiscovery() {
    const mockDevices: NearbyDevice[] = [
      {
        id: 'device_1',
        name: 'John\'s iPhone',
        distance: 5,
        status: 'discovered'
      },
      {
        id: 'device_2', 
        name: 'Sarah\'s Android',
        distance: 8,
        status: 'discovered'
      }
    ];

    logger.info('📱 Mock devices discovered:', mockDevices.length);
    this.updateState({ discoveredDevices: mockDevices });
  }

  // Connect to a specific device
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const device = this.state.discoveredDevices.find(d => d.id === deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      logger.info('🔗 Connecting to device:', device.name);
      
      // Update device status to connecting
      const updatedDevices = this.state.discoveredDevices.map(d =>
        d.id === deviceId ? { ...d, status: 'connecting' as const } : d
      );
      this.updateState({ discoveredDevices: updatedDevices });
      
      // TODO: Replace with actual Nearby API call
      // await NearbyAPI.connectToDevice(deviceId);
      
      // Mock connection for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update device status to connected
      const connectedDevices = this.state.discoveredDevices.map(d =>
        d.id === deviceId ? { ...d, status: 'connected' as const } : d
      );
      
      this.updateState({ 
        discoveredDevices: connectedDevices,
        connectedDevices: [...this.state.connectedDevices, deviceId],
        error: undefined 
      });
      
      logger.info('✅ Connected to device successfully:', device.name);
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to connect to device:', error);
      
      // Update device status to disconnected
      const failedDevices = this.state.discoveredDevices.map(d =>
        d.id === deviceId ? { ...d, status: 'disconnected' as const } : d
      );
      
      this.updateState({ 
        discoveredDevices: failedDevices,
        error: error.message || 'Failed to connect to device'
      });
      return false;
    }
  }

  // Send file to connected device
  async sendFile(filePath: string, deviceId: string): Promise<boolean> {
    try {
      if (!this.state.connectedDevices.includes(deviceId)) {
        throw new Error('Device not connected');
      }

      const device = this.state.discoveredDevices.find(d => d.id === deviceId);
      logger.info('📤 Sending file to device:', device?.name, filePath);
      
      // TODO: Replace with actual file transfer
      // await NearbyAPI.sendFile(filePath, deviceId);
      
      // Mock file transfer with progress updates
      const fileName = filePath.split('/').pop() || 'video.mp4';
      const totalBytes = 50 * 1024 * 1024; // Mock 50MB file
      
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const transferProgress: FileTransferProgress = {
          deviceId,
          fileName,
          progress,
          bytesTransferred: (totalBytes * progress) / 100,
          totalBytes,
          speed: 1024 * 1024 * 2 // 2 MB/s
        };
        
        this.updateState({ currentTransfer: transferProgress });
        logger.info(`📊 Transfer progress: ${progress}%`);
      }
      
      this.updateState({ 
        currentTransfer: undefined,
        error: undefined 
      });
      
      logger.info('✅ File sent successfully');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to send file:', error);
      this.updateState({ 
        currentTransfer: undefined,
        error: error.message || 'Failed to send file'
      });
      return false;
    }
  }

  // Start receiving files
  async startReceiving(): Promise<boolean> {
    try {
      if (!this.state.isInitialized) {
        await this.initialize();
      }

      // Start both advertising and discovery for receiving
      await Promise.all([
        this.startAdvertising(),
        this.startDiscovery()
      ]);

      logger.info('📥 Started receiving mode');
      return true;
    } catch (error: any) {
      logger.error('❌ Failed to start receiving:', error);
      this.updateState({ 
        error: error.message || 'Failed to start receiving mode'
      });
      return false;
    }
  }

  // Stop all Nearby API operations
  async stop(): Promise<void> {
    try {
      logger.info('🛑 Stopping Nearby API service...');
      
      // TODO: Replace with actual Nearby API calls
      // await NearbyAPI.stopAdvertising();
      // await NearbyAPI.stopDiscovery();
      // await NearbyAPI.disconnectAll();
      
      this.updateState({
        isAdvertising: false,
        isDiscovering: false,
        discoveredDevices: [],
        connectedDevices: [],
        currentTransfer: undefined,
        error: undefined
      });
      
      logger.info('✅ Nearby API service stopped');
    } catch (error: any) {
      logger.error('❌ Error stopping Nearby API service:', error);
      this.updateState({ 
        error: error.message || 'Error stopping service'
      });
    }
  }

  // Get current service state
  getState(): NearbyServiceState {
    return { ...this.state };
  }

  // Get discovered devices
  getDiscoveredDevices(): NearbyDevice[] {
    return [...this.state.discoveredDevices];
  }

  // Check if device is connected
  isDeviceConnected(deviceId: string): boolean {
    return this.state.connectedDevices.includes(deviceId);
  }
}

export default NearbyService;