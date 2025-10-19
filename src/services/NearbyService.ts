import { Platform } from 'react-native';
import logger from '../utils/logger';
import { getNearbyConfig } from '../config/nearbyConfig';
import SafePermissionManager, { PermissionResult, PermissionSummary } from '../utils/SafePermissionManager';


// Real API imports - Use existing P2P service as the real implementation
import { P2PService } from './P2PService';

let MultipeerConnectivity: any = null;
let p2pService: P2PService | null = null;

// Try to import the packages, fallback gracefully if not available
try {
  if (Platform.OS === 'android') {
    // Use the existing P2P service as the real Android implementation
    try {
      p2pService = P2PService.getInstance();
      logger.info('📱 P2P Service loaded as real Android Nearby implementation');
    } catch (androidError) {
      logger.warn('⚠️ P2P Service not available for Android:', androidError);
      p2pService = null;
    }
  } else if (Platform.OS === 'ios') {
    // Try iOS Multipeer Connectivity
    try {
      MultipeerConnectivity = require('react-native-multipeer-connectivity');
      logger.info('📱 iOS Multipeer Connectivity package loaded');
    } catch (iosError) {
      logger.warn('⚠️ iOS Multipeer Connectivity not available:', iosError);
      MultipeerConnectivity = null;
    }
  }
  
  // If no platform-specific package is available, log warning but don't crash
  if (!p2pService && !MultipeerConnectivity) {
    logger.warn('⚠️ No real Nearby API packages available, will use mock mode');
  }
} catch (error) {
  logger.error('❌ Error loading Nearby API packages:', error);
  // Don't throw error, let the service fall back to mock mode
  p2pService = null;
  MultipeerConnectivity = null;
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
  permissionStatus?: PermissionSummary;
  initializationMode?: 'real' | 'mock';
  initializationReason?: string;
}

type NearbyEventListener = (state: NearbyServiceState) => void;

export class NearbyService {
  private static instance: NearbyService;
  private state: NearbyServiceState;
  private listeners: NearbyEventListener[] = [];
  private config = getNearbyConfig();
  private serviceId = this.config.serviceId;
  private isMockMode = this.config.useMockMode;
  private multipeerSession: any = null;
  private p2pService: any = null;
  private permissionManager = SafePermissionManager.getInstance();

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

  // Get current state
  getState(): NearbyServiceState {
    return { ...this.state };
  }

  // Get discovered devices
  getDiscoveredDevices(): NearbyDevice[] {
    return [...this.state.discoveredDevices];
  }

  // Start receiving mode
  async startReceiving(): Promise<boolean> {
    try {
      logger.info('📥 Starting receiver mode...');
      
      if (this.isMockMode) {
        this.updateState({ isAdvertising: true });
        return true;
      }

      return await this.startAdvertising();
    } catch (error) {
      logger.error('❌ Failed to start receiving:', error);
      return false;
    }
  }

  // Stop all services
  async stop(): Promise<void> {
    try {
      await this.stopAdvertising();
      await this.stopDiscovery();
    } catch (error) {
      logger.error('❌ Error stopping services:', error);
    }
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

  // Initialize the service with safe error handling and automatic fallback
  async initialize(): Promise<boolean> {
    return this.initializeSafely();
  }

  // Safe initialization method with comprehensive error handling
  async initializeSafely(): Promise<boolean> {
    try {
      logger.info('🚀 Starting safe NearbyService initialization...');

      // First, try to initialize in real mode if not explicitly in mock mode
      if (!this.isMockMode) {
        const realResult = await this.tryRealAPIInitialization();
        if (realResult.success) {
          this.updateState({
            isInitialized: true,
            initializationMode: 'real',
            initializationReason: 'Real API initialized successfully',
            error: undefined
          });
          logger.info('✅ Real API initialization successful');
          return true;
        } else {
          logger.warn('⚠️ Real API initialization failed, falling back to mock mode:', realResult.reason);
          this.updateState({
            initializationReason: `Real API failed: ${realResult.reason}. Using mock mode for testing.`
          });
        }
      }

      // TEMPORARILY DISABLED: Automatic fallback to mock mode
      // This will force the app to show real errors instead of hiding them
      logger.error('❌ Real API initialization failed, NOT falling back to mock mode');
      logger.error('❌ Reason for failure:', this.state.initializationReason);
      
      this.updateState({
        isInitialized: false,
        initializationMode: 'real',
        initializationReason: this.state.initializationReason || 'Real API initialization failed',
        error: 'Real API initialization failed - check permissions and native modules'
      });
      
      return false;

    } catch (error) {
      logger.error('❌ Critical failure in NearbyService initialization:', error);
      this.updateState({
        isInitialized: false,
        initializationMode: 'mock',
        initializationReason: 'Initialization failed - service unavailable',
        error: `Initialization failed: ${error.message}`
      });
      return false;
    }
  }

  // Try to initialize real API with comprehensive error handling
  private async tryRealAPIInitialization(): Promise<{ success: boolean; reason?: string }> {
    try {
      logger.info('🔧 Attempting real API initialization...');

      // Step 0: Check if P2P service is available (skip external package validation)
      if (!p2pService) {
        return {
          success: false,
          reason: 'P2P Service not available - using existing infrastructure instead of external packages'
        };
      }
      
      logger.info('✅ P2P Service available for real nearby functionality');

      // Step 1: Check permissions safely with extra crash detection
      let permissionResult: PermissionResult;
      try {
        permissionResult = await this.checkPermissionsSafely();
      } catch (permissionError: any) {
        logger.error('❌ Permission check threw exception:', permissionError);
        
        // Check if this is the specific native crash we're trying to fix
        if (permissionError.message?.includes('null') || 
            permissionError.stack?.includes('checkSelfPermission') ||
            permissionError.stack?.includes('PermissionsModule')) {
          return { 
            success: false, 
            reason: 'Native permission system crash detected - using mock mode for safety' 
          };
        }
        
        return { 
          success: false, 
          reason: `Permission check crashed: ${permissionError.message}` 
        };
      }
      
      if (!permissionResult.success) {
        return { 
          success: false, 
          reason: `Permission check failed: ${permissionResult.error}` 
        };
      }

      // Step 2: Request permissions if needed (with same crash protection)
      if (permissionResult.denied.length > 0) {
        logger.info('📝 Some permissions denied, requesting...');
        
        let requestResult: PermissionResult;
        try {
          requestResult = await this.requestPermissionsSafely();
        } catch (requestError: any) {
          logger.error('❌ Permission request threw exception:', requestError);
          
          // Check if this is the specific native crash
          if (requestError.message?.includes('null') || 
              requestError.stack?.includes('checkSelfPermission') ||
              requestError.stack?.includes('PermissionsModule')) {
            return { 
              success: false, 
              reason: 'Native permission request crash detected - using mock mode for safety' 
            };
          }
          
          return { 
            success: false, 
            reason: `Permission request crashed: ${requestError.message}` 
          };
        }
        
        if (!requestResult.success || requestResult.denied.length > 0) {
          const errorMsg = this.permissionManager.getPermissionErrorMessage(requestResult);
          return { 
            success: false, 
            reason: errorMsg 
          };
        }
      }

      // Step 3: Initialize cross-platform API
      if (p2pService) {
        await this.initializeCrossPlatformNearby();
      } else if (Platform.OS === 'ios' && MultipeerConnectivity) {
        await this.initializeMultipeerConnectivity();
      } else {
        return { 
          success: false, 
          reason: 'No real API available for this platform' 
        };
      }

      return { success: true };

    } catch (error: any) {
      logger.error('❌ Real API initialization error:', error);
      
      // Final safety check for the native crash
      if (error.message?.includes('null') || 
          error.stack?.includes('checkSelfPermission') ||
          error.stack?.includes('PermissionsModule')) {
        return { 
          success: false, 
          reason: 'Native system crash detected during initialization - using mock mode for safety' 
        };
      }
      
      return { 
        success: false, 
        reason: `Real API error: ${error.message}` 
      };
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

  // Initialize cross-platform Nearby Connections using P2P service
  private async initializeCrossPlatformNearby(): Promise<void> {
    if (!p2pService) {
      throw new Error('P2P Service not available');
    }

    try {
      logger.info('🚀 Initializing P2P Service as real Nearby implementation...');

      // Initialize the P2P service
      const initialized = await p2pService.initializeService();
      if (!initialized) {
        throw new Error('P2P Service initialization failed');
      }

      // Set up event listeners to bridge P2P events to Nearby events
      this.setupP2PEventListeners();

      logger.info('✅ P2P Service initialized successfully as real Nearby API');
    } catch (error) {
      logger.error('❌ Failed to initialize P2P Service:', error);
      throw error;
    }
  }

  // Set up event listeners to bridge P2P events to Nearby events
  private setupP2PEventListeners(): void {
    if (!p2pService) return;

    try {
      logger.info('📱 Setting up P2P event listeners...');

      // Subscribe to P2P service state changes
      p2pService.subscribe((p2pState) => {
        logger.info('🔄 P2P state update received:', {
          isDiscovering: p2pState.isDiscovering,
          isConnected: p2pState.isConnected,
          discoveredDevices: p2pState.discoveredDevices.length,
          transferProgress: (p2pState.transferProgress as any)?.progress
        });

        // Convert P2P devices to Nearby devices
        const nearbyDevices: NearbyDevice[] = p2pState.discoveredDevices.map(device => ({
          id: device.deviceAddress,
          name: device.deviceName || 'Unknown Device',
          status: p2pState.isConnected && p2pState.connectionInfo?.groupFormed ? 'connected' : 'discovered'
        }));

        // Update our state with converted devices
        this.updateState({
          discoveredDevices: nearbyDevices,
          isDiscovering: p2pState.isDiscovering,
          connectedDevices: p2pState.isConnected ? [p2pState.connectionInfo?.groupOwnerAddress?.hostAddress || 'connected'] : [],
          currentTransfer: p2pState.transferProgress ? {
            deviceId: 'p2p-device',
            fileName: (p2pState.transferProgress as any).fileName || (p2pState.transferProgress as any).name || 'transfer.mp4',
            progress: (p2pState.transferProgress as any).progress || 0,
            bytesTransferred: (p2pState.transferProgress as any).bytesTransferred || 0,
            totalBytes: (p2pState.transferProgress as any).totalBytes || 0,
            speed: (p2pState.transferProgress as any).speed
          } : undefined,
          error: p2pState.error
        });
      });

      logger.info('✅ P2P event listeners configured');
    } catch (error) {
      logger.error('❌ Error setting up P2P listeners:', error);
      throw error;
    }
  }





  // Start advertising (making device discoverable)
  async startAdvertising(): Promise<boolean> {
    try {
      logger.info('📢 Starting advertising...');

      if (this.isMockMode) {
        return this.startMockAdvertising();
      }

      if (p2pService) {
        // Use P2P service for Android advertising (create group)
        try {
          const success = await p2pService.createGroup();
          if (success) {
            logger.info('📢 P2P Service advertising started (group created)');
          } else {
            throw new Error('Failed to create P2P group for advertising');
          }
        } catch (advertiseError) {
          logger.error('❌ P2P Service advertising failed:', advertiseError);
          throw advertiseError;
        }
      } else if (Platform.OS === 'ios' && this.multipeerSession) {
        try {
          await this.multipeerSession.startAdvertising();
          logger.info('📢 iOS Multipeer advertising started');
        } catch (multipeerError) {
          logger.error('❌ iOS Multipeer advertising failed:', multipeerError);
          throw multipeerError;
        }
      } else {
        throw new Error('No advertising method available for this platform');
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

      if (p2pService) {
        // Use P2P service for Android discovery
        try {
          const success = await p2pService.startDiscovery();
          if (success) {
            logger.info('🔍 P2P Service discovery started');
          } else {
            throw new Error('Failed to start P2P discovery');
          }
        } catch (discoveryError) {
          logger.error('❌ P2P Service discovery failed:', discoveryError);
          throw discoveryError;
        }
      } else if (Platform.OS === 'ios' && this.multipeerSession) {
        try {
          await this.multipeerSession.startBrowsing();
          logger.info('🔍 iOS Multipeer discovery started');
        } catch (multipeerError) {
          logger.error('❌ iOS Multipeer discovery failed:', multipeerError);
          throw multipeerError;
        }
      } else {
        throw new Error('No discovery method available for this platform');
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

      if (p2pService) {
        try {
          await p2pService.removeGroup();
          logger.info('🔇 P2P Service advertising stopped (group removed)');
        } catch (stopError) {
          logger.warn('⚠️ Error stopping P2P Service advertising:', stopError);
        }
      } else if (Platform.OS === 'ios' && this.multipeerSession) {
        try {
          await this.multipeerSession.stopAdvertising();
          logger.info('🔇 iOS Multipeer advertising stopped');
        } catch (multipeerError) {
          logger.warn('⚠️ Error stopping iOS Multipeer advertising:', multipeerError);
        }
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

      if (p2pService) {
        try {
          await p2pService.stopDiscovery();
          logger.info('🔍 P2P Service discovery stopped');
        } catch (stopError) {
          logger.warn('⚠️ Error stopping P2P Service discovery:', stopError);
        }
      } else if (Platform.OS === 'ios' && this.multipeerSession) {
        try {
          await this.multipeerSession.stopBrowsing();
          logger.info('🔍 iOS Multipeer discovery stopped');
        } catch (multipeerError) {
          logger.warn('⚠️ Error stopping iOS Multipeer discovery:', multipeerError);
        }
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

      if (p2pService) {
        // Send file via P2P service
        try {
          const success = await p2pService.sendFile(filePath);
          if (success) {
            logger.info('📤 File sent via P2P Service');
          } else {
            throw new Error('P2P file send failed');
          }
        } catch (sendError) {
          logger.error('❌ P2P Service file send failed:', sendError);
          throw sendError;
        }
      } else if (Platform.OS === 'ios' && this.multipeerSession) {
        // Send file via Multipeer Connectivity
        try {
          await this.multipeerSession.sendFile(deviceId, filePath);
          logger.info('📤 File sent via iOS Multipeer');
        } catch (multipeerError) {
          logger.error('❌ iOS Multipeer file send failed:', multipeerError);
          throw multipeerError;
        }
      } else {
        throw new Error('No file sending method available for this platform');
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

      if (p2pService) {
        // Connect via P2P service
        try {
          const success = await p2pService.smartConnect(deviceId);
          if (success) {
            logger.info('🤝 Connection established via P2P Service');
          } else {
            throw new Error('P2P connection failed');
          }
        } catch (connectError) {
          logger.error('❌ P2P Service connection failed:', connectError);
          throw connectError;
        }
      } else if (Platform.OS === 'ios' && this.multipeerSession) {
        try {
          await this.multipeerSession.invitePeer(deviceId);
          logger.info('🤝 Connection requested via iOS Multipeer');
        } catch (multipeerError) {
          logger.error('❌ iOS Multipeer connection failed:', multipeerError);
          throw multipeerError;
        }
      } else {
        throw new Error('No connection method available for this platform');
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

  // Event handlers for Expo Nearby Connections
  private handleNearbyDeviceDiscovered(device: any) {
    const nearbyDevice: NearbyDevice = {
      id: device.endpointId || device.id,
      name: device.endpointName || device.name || 'Unknown Device',
      status: 'discovered',
      distance: device.distance,
    };

    const existingDevices = this.state.discoveredDevices.filter(d => d.id !== nearbyDevice.id);
    this.updateState({
      discoveredDevices: [...existingDevices, nearbyDevice],
    });
  }

  private handleNearbyDeviceLost(deviceId: string) {
    const updatedDevices = this.state.discoveredDevices.filter(d => d.id !== deviceId);
    const updatedConnected = this.state.connectedDevices.filter(id => id !== deviceId);
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: updatedConnected,
    });
  }

  private handleNearbyConnectionInitiated(device: any) {
    const deviceId = device.endpointId || device.id;
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: 'connecting' as const } : d
    );
    
    this.updateState({
      discoveredDevices: updatedDevices,
    });
  }

  private handleNearbyConnectionResult(device: any, success: boolean) {
    const deviceId = device.endpointId || device.id;
    const status = success ? 'connected' : 'disconnected';
    
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: status as 'connected' | 'disconnected' } : d
    );
    
    let updatedConnected = [...this.state.connectedDevices];
    if (success && !updatedConnected.includes(deviceId)) {
      updatedConnected.push(deviceId);
    } else if (!success) {
      updatedConnected = updatedConnected.filter(id => id !== deviceId);
    }
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: updatedConnected,
    });
  }

  private handleNearbyPayloadReceived(device: any, payload: any) {
    logger.info('📥 Processing Expo Nearby payload:', payload);
    // Handle incoming file payload
  }

  private handleNearbyTransferUpdate(device: any, update: any) {
    const deviceId = device.endpointId || device.id;
    
    if (update.status === 'IN_PROGRESS') {
      this.updateState({
        currentTransfer: {
          deviceId,
          fileName: update.fileName || 'transfer.mp4',
          progress: Math.round((update.bytesTransferred / update.totalBytes) * 100),
          bytesTransferred: update.bytesTransferred || 0,
          totalBytes: update.totalBytes || 0,
          speed: update.speed,
        },
      });
    } else if (update.status === 'SUCCESS') {
      this.updateState({
        currentTransfer: undefined,
      });
      logger.info('✅ Expo Nearby transfer completed successfully');
    } else if (update.status === 'FAILURE') {
      this.updateState({
        currentTransfer: undefined,
        error: 'Transfer failed',
      });
      logger.error('❌ Expo Nearby transfer failed');
    }
  }

  // Legacy event handlers for real Android Nearby API (kept for compatibility)
  private handleRealDeviceDiscovered(device: any) {
    const nearbyDevice: NearbyDevice = {
      id: device.endpointId || device.id,
      name: device.endpointName || device.name || 'Unknown Device',
      status: 'discovered',
      distance: device.distance,
    };

    const existingDevices = this.state.discoveredDevices.filter(d => d.id !== nearbyDevice.id);
    this.updateState({
      discoveredDevices: [...existingDevices, nearbyDevice],
    });
  }

  private handleRealDeviceLost(deviceId: string) {
    const updatedDevices = this.state.discoveredDevices.filter(d => d.id !== deviceId);
    const updatedConnected = this.state.connectedDevices.filter(id => id !== deviceId);
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: updatedConnected,
    });
  }

  private handleRealConnectionInitiated(device: any) {
    const deviceId = device.endpointId || device.id;
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: 'connecting' as const } : d
    );
    
    this.updateState({
      discoveredDevices: updatedDevices,
    });
  }

  private handleRealConnectionResult(device: any, success: boolean) {
    const deviceId = device.endpointId || device.id;
    const status = success ? 'connected' : 'disconnected';
    
    const updatedDevices = this.state.discoveredDevices.map(d =>
      d.id === deviceId ? { ...d, status: status as 'connected' | 'disconnected' } : d
    );
    
    let updatedConnected = [...this.state.connectedDevices];
    if (success && !updatedConnected.includes(deviceId)) {
      updatedConnected.push(deviceId);
    } else if (!success) {
      updatedConnected = updatedConnected.filter(id => id !== deviceId);
    }
    
    this.updateState({
      discoveredDevices: updatedDevices,
      connectedDevices: updatedConnected,
    });
  }

  private handleRealPayloadReceived(device: any, payload: any) {
    logger.info('📥 Processing real API payload:', payload);
    // Handle incoming file payload
    // This would typically trigger file save operations
  }

  private handleRealTransferUpdate(device: any, update: any) {
    const deviceId = device.endpointId || device.id;
    
    if (update.status === 'IN_PROGRESS') {
      this.updateState({
        currentTransfer: {
          deviceId,
          fileName: update.fileName || 'transfer.mp4',
          progress: Math.round((update.bytesTransferred / update.totalBytes) * 100),
          bytesTransferred: update.bytesTransferred || 0,
          totalBytes: update.totalBytes || 0,
          speed: update.speed,
        },
      });
    } else if (update.status === 'SUCCESS') {
      this.updateState({
        currentTransfer: undefined,
      });
      logger.info('✅ Real API transfer completed successfully');
    } else if (update.status === 'FAILURE') {
      this.updateState({
        currentTransfer: undefined,
        error: 'Transfer failed',
      });
      logger.error('❌ Real API transfer failed');
    }
  }

  // Event handler for Android P2P Service (fallback)
  private handleP2PStateUpdate(p2pState: any) {
    // Convert P2P state to NearbyService format
    const devices: NearbyDevice[] = p2pState.discoveredDevices.map((device: any) => ({
      id: device.deviceAddress || device.id,
      name: device.deviceName || device.name || 'Unknown Device',
      status: device.status === 'CONNECTED' ? 'connected' : 
              device.status === 'INVITED' ? 'connecting' : 'discovered',
    }));

    const connectedDevices = devices
      .filter(d => d.status === 'connected')
      .map(d => d.id);

    this.updateState({
      discoveredDevices: devices,
      connectedDevices,
      isDiscovering: p2pState.isDiscovering || false,
      error: p2pState.error,
    });

    // Handle transfer progress if available
    if (p2pState.transferProgress) {
      this.updateState({
        currentTransfer: {
          deviceId: p2pState.transferProgress.deviceId || 'unknown',
          fileName: p2pState.transferProgress.fileName || 'unknown.mp4',
          progress: p2pState.transferProgress.progress || 0,
          bytesTransferred: p2pState.transferProgress.bytesTransferred || 0,
          totalBytes: p2pState.transferProgress.totalBytes || 0,
          speed: p2pState.transferProgress.speed,
        },
      });
    }
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

  // Check if required permissions are granted using SafePermissionManager
  private async checkPermissionsSafely(): Promise<PermissionResult> {
    try {
      logger.info('🔍 Starting safe permission check...');

      // Skip permission checks in mock mode
      if (this.isMockMode) {
        logger.info('📱 Mock mode: Skipping permission checks');
        return {
          success: true,
          granted: SafePermissionManager.NEARBY_PERMISSIONS,
          denied: []
        };
      }

      // Use SafePermissionManager for all permission operations
      const result = await this.permissionManager.checkPermissions();
      
      // Update state with permission status
      const permissionStatus = await this.permissionManager.getPermissionSummary();
      this.updateState({ permissionStatus });

      logger.info('✅ Safe permission check completed:', {
        success: result.success,
        granted: result.granted.length,
        denied: result.denied.length,
        canProceed: permissionStatus.canProceed
      });

      return result;
    } catch (error) {
      logger.error('❌ Error in safe permission check:', error);
      
      // Return safe fallback result
      return {
        success: false,
        granted: [],
        denied: SafePermissionManager.NEARBY_PERMISSIONS,
        error: `Permission check failed: ${error.message}`
      };
    }
  }

  // Request required permissions using SafePermissionManager
  private async requestPermissionsSafely(): Promise<PermissionResult> {
    try {
      logger.info('📝 Starting safe permission request...');

      // Skip permission requests in mock mode
      if (this.isMockMode) {
        logger.info('📱 Mock mode: Skipping permission requests');
        return {
          success: true,
          granted: SafePermissionManager.NEARBY_PERMISSIONS,
          denied: []
        };
      }

      // Use SafePermissionManager for all permission operations
      const result = await this.permissionManager.requestPermissions();
      
      // Update state with permission status
      const permissionStatus = await this.permissionManager.getPermissionSummary();
      this.updateState({ permissionStatus });

      logger.info('✅ Safe permission request completed:', {
        success: result.success,
        granted: result.granted.length,
        denied: result.denied.length,
        canProceed: permissionStatus.canProceed
      });

      return result;
    } catch (error) {
      logger.error('❌ Error in safe permission request:', error);
      
      // Return safe fallback result
      return {
        success: false,
        granted: [],
        denied: SafePermissionManager.NEARBY_PERMISSIONS,
        error: `Permission request failed: ${error.message}`
      };
    }
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
      } else if (Platform.OS === 'android' && this.p2pService) {
        await this.p2pService.cleanup();
        this.p2pService = null;
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