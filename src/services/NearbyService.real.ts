import { Platform, PermissionsAndroid } from 'react-native';
import logger from '../utils/logger';

// Real API imports
let MultipeerConnectivity: any = null;
let ExpoNearbyConnections: any = null;

// Try to import the packages, fallback gracefully if not available
try {
  if (Platform.OS === 'ios') {
    MultipeerConnectivity = require('react-native-multipeer-connectivity');
  } else {
    ExpoNearbyConnections = require('expo-nearby-connections');
  }
} catch (error) {
  logger.warn('⚠️ Real Nearby API packages not available, using fallback mode');
}

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
  private isMockMode = false; // Set to false for real API usage
  private multipeerSession: any = null;
  private nearbyConnections: any = null;

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
        logger.error('❌ Error notifying listener:', error);
      }
    });
  }

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      logger.info('🚀 Initializing Real Nearby API service...');

      // Check permissions first
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Required permissions not granted');
        }
      }

      // Initialize platform-specific API
      if (Platform.OS === 'ios' && MultipeerConnectivity) {
        await this.initializeMultipeerConnectivity();
      } else if (Platform.OS === 'android' && ExpoNearbyConnections) {
        await this.initializeNearbyConnections();
      } else {
        logger.warn('⚠️ No real API available, falling back to mock mode');
        this.isMockMode = true;
        return this.initializeMockMode();
      }

      this.updateState({ 
        isInitialized: true,
        error: undefined 
      });

      logger.info('✅ NearbyService initialized successfully');
      return true;

    } catch (error) {
      logger.error('❌ Failed to initialize NearbyService:', error);
      this.updateState({ 
        error: error.message,
        isInitialized: false 
      });
      return false;
    }
  }

  // Initialize iOS Multipeer Connectivity
  private async initializeMultipeerConnectivity(): Promise<void> {
    if (!MultipeerConnectivity) {
      throw new Error('Multipeer Connectivity not available');
    }

    try {
      // Create multipeer session
      this.multipeerSession = new MultipeerConnectivity.MultipeerConnectivity({
        serviceType: this.serviceId,
        peerName: 'SPRED_Device', // Could be device name
      });

      // Set up event listeners
      this.multipeerSession.on('peerFound', (peer: any) => {
        logger.info('👥 Peer found:', peer);
        this.handlePeerDiscovered(peer);
      });

      this.multipeerSession.on('peerLost', (peer: any) => {
        logger.info('👋 Peer lost:', peer);
        this.handlePeerLost(peer);
      });

      this.multipeerSession.on('peerConnected', (peer: any) => {
        logger.info('🤝 Peer connected:', peer);
        this.handlePeerConnected(peer);
      });

      this.multipeerSession.on('peerDisconnected', (peer: any) => {
        logger.info('💔 Peer disconnected:', peer);
        this.handlePeerDisconnected(peer);
      });

      this.multipeerSession.on('dataReceived', (data: any) => {
        logger.info('📥 Data received:', data);
        this.handleDataReceived(data);
      });

      logger.info('✅ Multipeer Connectivity initialized');

    } catch (error) {
      logger.error('❌ Failed to initialize Multipeer Connectivity:', error);
      throw error;
    }
  }

  // Initialize Android Nearby Connections
  private async initializeNearbyConnections(): Promise<void> {
    if (!ExpoNearbyConnections) {
      throw new Error('Expo Nearby Connections not available');
    }

    try {
      // Initialize Nearby Connections
      this.nearbyConnections = ExpoNearbyConnections;

      // Set up event listeners
      this.nearbyConnections.onEndpointFound((endpointId: string, info: any) => {
        logger.info('🔍 Endpoint found:', endpointId, info);
        this.handleEndpointDiscovered(endpointId, info);
      });

      this.nearbyConnections.onEndpointLost((endpointId: string) => {
        logger.info('📡 Endpoint lost:', endpointId);
        this.handleEndpointLost(endpointId);
      });

      this.nearbyConnections.onConnectionInitiated((endpointId: string, info: any) => {
        logger.info('🔗 Connection initiated:', endpointId, info);
        this.handleConnectionInitiated(endpointId, info);
      });

      this.nearbyConnections.onConnectionResult((endpointId: string, result: any) => {
        logger.info('✅ Connection result:', endpointId, result);
        this.handleConnectionResult(endpointId, result);
      });

      this.nearbyConnections.onDisconnected((endpointId: string) => {
        logger.info('🔌 Disconnected:', endpointId);
        this.handleEndpointDisconnected(endpointId);
      });

      logger.info('✅ Nearby Connections initialized');

    } catch (error) {
      logger.error('❌ Failed to initialize Nearby Connections:', error);
      throw error;
    }
  }

  // Fallback to mock mode if real APIs aren't available
  private async initializeMockMode(): Promise<boolean> {
    logger.info('🎭 Initializing mock mode...');
    this.isMockMode = true;
    
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }

  // Start advertising (making device discoverable)
  async startAdvertising(): Promise<boolean> {
    try {
      logger.info('📢 Starting advertising...');

      if (this.isMockMode) {
        return this.startMockAdvertising();
      }

      if (Platform.OS === 'ios' && this.multipeerSession) {
        await this.multipeerSession.startAdvertising();
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        await this.nearbyConnections.startAdvertising({
          serviceId: this.serviceId,
          strategy: 'CLUSTER', // or 'STAR', 'POINT_TO_POINT'
        });
      }

      this.updateState({ isAdvertising: true });
      logger.info('✅ Advertising started');
      return true;

    } catch (error) {
      logger.error('❌ Failed to start advertising:', error);
      this.updateState({ error: error.message });
      return false;
    }
  }

  // Start discovery (looking for other devices)
  async startDiscovery(): Promise<boolean> {
    try {
      logger.info('🔍 Starting discovery...');

      if (this.isMockMode) {
        return this.startMockDiscovery();
      }

      if (Platform.OS === 'ios' && this.multipeerSession) {
        await this.multipeerSession.startBrowsing();
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        await this.nearbyConnections.startDiscovery({
          serviceId: this.serviceId,
          strategy: 'CLUSTER',
        });
      }

      this.updateState({ isDiscovering: true });
      logger.info('✅ Discovery started');
      return true;

    } catch (error) {
      logger.error('❌ Failed to start discovery:', error);
      this.updateState({ error: error.message });
      return false;
    }
  }

  // Stop advertising
  async stopAdvertising(): Promise<void> {
    try {
      if (this.isMockMode) {
        this.updateState({ isAdvertising: false });
        return;
      }

      if (Platform.OS === 'ios' && this.multipeerSession) {
        await this.multipeerSession.stopAdvertising();
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        await this.nearbyConnections.stopAdvertising();
      }

      this.updateState({ isAdvertising: false });
      logger.info('🔇 Advertising stopped');

    } catch (error) {
      logger.error('❌ Failed to stop advertising:', error);
    }
  }

  // Stop discovery
  async stopDiscovery(): Promise<void> {
    try {
      if (this.isMockMode) {
        this.updateState({ isDiscovering: false });
        return;
      }

      if (Platform.OS === 'ios' && this.multipeerSession) {
        await this.multipeerSession.stopBrowsing();
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        await this.nearbyConnections.stopDiscovery();
      }

      this.updateState({ isDiscovering: false });
      logger.info('🔍 Discovery stopped');

    } catch (error) {
      logger.error('❌ Failed to stop discovery:', error);
    }
  }

  // Send file to a specific device
  async sendFile(deviceId: string, filePath: string): Promise<boolean> {
    try {
      logger.info('📤 Sending file to device:', deviceId, filePath);

      if (this.isMockMode) {
        return this.sendMockFile(deviceId, filePath);
      }

      if (Platform.OS === 'ios' && this.multipeerSession) {
        // Send file via Multipeer Connectivity
        await this.multipeerSession.sendFile(deviceId, filePath);
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        // Send file via Nearby Connections
        await this.nearbyConnections.sendFile(deviceId, filePath);
      }

      logger.info('✅ File sent successfully');
      return true;

    } catch (error) {
      logger.error('❌ Failed to send file:', error);
      return false;
    }
  }

  // Connect to a specific device
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      logger.info('🤝 Connecting to device:', deviceId);

      if (this.isMockMode) {
        return this.connectToMockDevice(deviceId);
      }

      if (Platform.OS === 'ios' && this.multipeerSession) {
        await this.multipeerSession.invitePeer(deviceId);
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        await this.nearbyConnections.requestConnection(deviceId, {
          name: 'SPRED_Device',
        });
      }

      return true;

    } catch (error) {
      logger.error('❌ Failed to connect to device:', error);
      return false;
    }
  }

  // Event handlers for iOS Multipeer Connectivity
  private handlePeerDiscovered(peer: any) {
    const device: NearbyDevice = {
      id: peer.id || peer.peerID,
      name: peer.name || peer.displayName || 'Unknown Device',
      status: 'discovered',
    };

    const existingDevices = this.state.discoveredDevices.filter(d => d.id !== device.id);
    this.updateState({
      discoveredDevices: [...existingDevices, device],
    });
  }

  private handlePeerLost(peer: any) {
    const deviceId = peer.id || peer.peerID;
    const updatedDevices = this.state.discoveredDevices.filter(d => d.id !== deviceId);
    this.updateState({
      discoveredDevices: updatedDevices,
    });
  }

  private handlePeerConnected(peer: any) {
    const deviceId = peer.id || peer.peerID;
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: 'connected' as const } : d
    );
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: [...this.state.connectedDevices, deviceId],
    });
  }

  private handlePeerDisconnected(peer: any) {
    const deviceId = peer.id || peer.peerID;
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: 'disconnected' as const } : d
    );
    const updatedConnected = this.state.connectedDevices.filter(id => id !== deviceId);
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: updatedConnected,
    });
  }

  private handleDataReceived(data: any) {
    logger.info('📥 Processing received data:', data);
    // Handle incoming file data
  }

  // Event handlers for Android Nearby Connections
  private handleEndpointDiscovered(endpointId: string, info: any) {
    const device: NearbyDevice = {
      id: endpointId,
      name: info.name || 'Unknown Device',
      status: 'discovered',
    };

    const existingDevices = this.state.discoveredDevices.filter(d => d.id !== device.id);
    this.updateState({
      discoveredDevices: [...existingDevices, device],
    });
  }

  private handleEndpointLost(endpointId: string) {
    const updatedDevices = this.state.discoveredDevices.filter(d => d.id !== endpointId);
    this.updateState({
      discoveredDevices: updatedDevices,
    });
  }

  private handleConnectionInitiated(endpointId: string, info: any) {
    logger.info('🔗 Connection initiated with:', endpointId, info);
    // Auto-accept connections for now (in production, you might want user confirmation)
    if (this.nearbyConnections) {
      this.nearbyConnections.acceptConnection(endpointId);
    }
  }

  private handleConnectionResult(endpointId: string, result: any) {
    if (result.status === 'CONNECTED') {
      const updatedDevices = this.state.discoveredDevices.map(d =>
        d.id === endpointId ? { ...d, status: 'connected' as const } : d
      );
      
      this.updateState({
        discoveredDevices: updatedDevices,
        connectedDevices: [...this.state.connectedDevices, endpointId],
      });
    }
  }

  private handleEndpointDisconnected(endpointId: string) {
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === endpointId ? { ...d, status: 'disconnected' as const } : d
    );
    const updatedConnected = this.state.connectedDevices.filter(id => id !== endpointId);
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: updatedConnected,
    });
  }

  // Mock implementations for fallback
  private async startMockAdvertising(): Promise<boolean> {
    logger.info('🎭 Mock: Starting advertising');
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  private async startMockDiscovery(): Promise<boolean> {
    logger.info('🎭 Mock: Starting discovery');
    
    // Simulate finding devices after a delay
    setTimeout(() => {
      const mockDevices: NearbyDevice[] = [
        {
          id: 'mock-device-1',
          name: 'Mock iPhone',
          status: 'discovered',
          distance: 5,
        },
        {
          id: 'mock-device-2',
          name: 'Mock Android',
          status: 'discovered',
          distance: 10,
        },
      ];

      this.updateState({
        discoveredDevices: mockDevices,
      });
    }, 2000);

    return true;
  }

  private async sendMockFile(deviceId: string, filePath: string): Promise<boolean> {
    logger.info('🎭 Mock: Sending file', filePath, 'to', deviceId);
    
    // Simulate file transfer progress
    const fileName = filePath.split('/').pop() || 'unknown.mp4';
    const totalBytes = 52428800; // 50MB mock size
    
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.updateState({
        currentTransfer: {
          deviceId,
          fileName,
          progress,
          bytesTransferred: (totalBytes * progress) / 100,
          totalBytes,
          speed: 1024 * 1024 * 2, // 2MB/s mock speed
        },
      });
    }

    // Clear transfer when complete
    this.updateState({
      currentTransfer: undefined,
    });

    return true;
  }

  private async connectToMockDevice(deviceId: string): Promise<boolean> {
    logger.info('🎭 Mock: Connecting to device', deviceId);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: 'connected' as const } : d
    );
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: [...this.state.connectedDevices, deviceId],
    });

    return true;
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

  // Cleanup resources
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up NearbyService...');

      await this.stopAdvertising();
      await this.stopDiscovery();

      if (Platform.OS === 'ios' && this.multipeerSession) {
        this.multipeerSession.disconnect();
        this.multipeerSession = null;
      } else if (Platform.OS === 'android' && this.nearbyConnections) {
        await this.nearbyConnections.stopAllEndpoints();
        this.nearbyConnections = null;
      }

      this.updateState({
        isInitialized: false,
        isAdvertising: false,
        isDiscovering: false,
        discoveredDevices: [],
        connectedDevices: [],
        currentTransfer: undefined,
        error: undefined,
      });

      logger.info('✅ NearbyService cleanup complete');

    } catch (error) {
      logger.error('❌ Error during cleanup:', error);
    }
  }
}

export default NearbyService;