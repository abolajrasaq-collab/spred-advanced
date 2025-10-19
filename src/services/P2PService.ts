import {
  checkPermissions,
  requestPermissions,
  isLocationEnabled,
  isWifiEnabled,
  initialize,
  subscribeOnPeersUpdates,
  subscribeOnConnectionInfoUpdates,
  connect,
  createGroup,
  removeGroup,
  Device,
  File as P2PFile,
  WifiP2pInfo,
  openAppSettings,
  openWifiSettings,
  openLocationSettings,
} from 'p2p-file-transfer';
import logger from '../utils/logger';

// Import these functions directly from the p2p-file-transfer module
import {
  startDiscoveringPeers,
  stopDiscoveringPeers,
  getAvailablePeers,
  subscribeOnFileSend,
  subscribeOnFileReceive,
  sendFile,
  receiveFile,
} from 'p2p-file-transfer';

export type { Device, P2PFile, WifiP2pInfo };

export interface P2PServiceState {
  isInitialized: boolean;
  hasPermissions: boolean;
  isLocationEnabled: boolean;
  isWifiEnabled: boolean;
  isDiscovering: boolean;
  isConnected: boolean;
  isGroupOwner: boolean;
  discoveredDevices: Device[];
  connectionInfo: WifiP2pInfo | null;
  transferProgress: P2PFile | null;
  error: string | null;
}

export class P2PService {
  private static instance: P2PService;
  private state: P2PServiceState;
  private listeners: ((state: P2PServiceState) => void)[] = [];
  private subscriptions: any[] = [];

  private constructor() {
    this.state = {
      isInitialized: false,
      hasPermissions: false,
      isLocationEnabled: false,
      isWifiEnabled: false,
      isDiscovering: false,
      isConnected: false,
      isGroupOwner: false,
      discoveredDevices: [],
      connectionInfo: null,
      transferProgress: null,
      error: null,
    };
  }

  static getInstance(): P2PService {
    if (!P2PService.instance) {
      P2PService.instance = new P2PService();
    }
    return P2PService.instance;
  }

  private updateState(updates: Partial<P2PServiceState>) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    console.log('🔄 P2PService state update:', {
      updates,
      oldState: {
        isInitialized: oldState.isInitialized,
        isConnected: oldState.isConnected,
        isDiscovering: oldState.isDiscovering,
        discoveredDevices: oldState.discoveredDevices?.length || 0
      },
      newState: {
        isInitialized: this.state.isInitialized,
        isConnected: this.state.isConnected,
        isDiscovering: this.state.isDiscovering,
        discoveredDevices: this.state.discoveredDevices?.length || 0
      },
      listeners: this.listeners.length
    });
    
    this.notifyListeners();
  }

  private notifyListeners() {
    console.log(`📢 Notifying ${this.listeners.length} listeners of state change`);
    this.listeners.forEach((listener, index) => {
      try {
        listener({ ...this.state });
        console.log(`📢 Listener ${index + 1} notified successfully`);
      } catch (error) {
        console.error(`❌ Error notifying listener ${index + 1}:`, error);
      }
    });
  }

  subscribe(listener: (state: P2PServiceState) => void) {
    this.listeners.push(listener);
    listener({ ...this.state });

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  async initializeService(): Promise<boolean> {
    try {
      logger.info('🚀 P2PService: Starting initialization...');
      this.updateState({ error: null });

      // If already initialized, just return true
      if (this.state.isInitialized) {
        logger.info(
          '✅ P2P service already initialized, reusing existing instance',
        );
        return true;
      }

      // Debug: Check if all functions are available
      logger.info('Checking P2P functions availability:');
      logger.info('checkPermissions:', typeof checkPermissions);
      logger.info('isLocationEnabled:', typeof isLocationEnabled);
      logger.info('isWifiEnabled:', typeof isWifiEnabled);
      logger.info('initialize:', typeof initialize);

      // Check if functions are available
      if (typeof checkPermissions !== 'function') {
        throw new Error('checkPermissions function is not available');
      }
      if (typeof isLocationEnabled !== 'function') {
        throw new Error('isLocationEnabled function is not available');
      }
      if (typeof isWifiEnabled !== 'function') {
        throw new Error('isWifiEnabled function is not available');
      }
      if (typeof initialize !== 'function') {
        throw new Error('initialize function is not available');
      }

      // Check permissions first
      const hasPermissions = await checkPermissions();
      this.updateState({ hasPermissions });

      if (!hasPermissions) {
        this.updateState({
          error:
            'Permissions required for WiFi Direct. Please grant location/nearby devices permissions.',
        });
        return false;
      }

      // Check location and WiFi before initialization
      const [locationEnabled, wifiEnabled] = await Promise.all([
        isLocationEnabled(),
        isWifiEnabled(),
      ]);

      this.updateState({
        isLocationEnabled: locationEnabled,
        isWifiEnabled: wifiEnabled,
      });

      if (!wifiEnabled) {
        this.updateState({
          error:
            'WiFi must be enabled to use WiFi Direct. Please enable WiFi and try again.',
        });
        return false;
      }

      if (!locationEnabled) {
        this.updateState({
          error:
            'Location must be enabled to use WiFi Direct. Please enable location services and try again.',
        });
        return false;
      }

      // Try to initialize the module
      try {
        await initialize();
        this.updateState({ isInitialized: true, error: null });
        logger.info('✅ P2P service initialized successfully');
      } catch (initError: any) {
        logger.error('❌ P2P initialize() threw error:', initError);

        // Handle specific initialization errors
        let errorMessage = 'Failed to initialize WiFi Direct';
        let shouldReturnFalse = true;

        if (initError.message && initError.message.includes('0x5')) {
          errorMessage =
            'Location service is required to use WiFi Direct. Please enable location services.';
        } else if (initError.message && initError.message.includes('0x6')) {
          errorMessage =
            'WiFi must be enabled to use WiFi Direct. Please enable WiFi.';
        } else if (initError.message && initError.message.includes('0x7')) {
          errorMessage =
            'WiFi Hotspot must be turned off to use WiFi Direct. Please disable hotspot.';
        } else if (
          initError.message &&
          (initError.message.includes('0x3') ||
            initError.message.includes('0x4'))
        ) {
          errorMessage =
            'Location or nearby devices permission required. Please grant permissions.';
        } else if (
          initError.message &&
          initError.message.includes('should only be initialized once')
        ) {
          // The module was already initialized - this is OK, just continue
          logger.warn('⚠️ P2P module was already initialized, continuing...');
          this.updateState({ isInitialized: true, error: null });
          shouldReturnFalse = false;
        } else if (initError.message) {
          errorMessage = `WiFi Direct initialization failed: ${initError.message}`;
        }

        if (shouldReturnFalse) {
          this.updateState({ error: errorMessage });
          return false;
        }
      }

      // Setup event listeners
      this.setupEventListeners();

      return true;
    } catch (error: any) {
      logger.error('P2P initialization error:', error);
      this.updateState({
        error: `P2P service initialization failed: ${
          error.message || 'Unknown error'
        }`,
      });
      return false;
    }
  }

  private setupEventListeners() {
    // Peers updates with device persistence
    const peersSubscription = subscribeOnPeersUpdates(
      ({ devices }: { devices: Device[] }) => {
        console.log('📱 Peers update received:', devices.length, 'devices');
        
        // Merge with existing devices to prevent disappearing
        const currentDevices = this.state.discoveredDevices || [];
        const mergedDevices = this.mergeDeviceLists(currentDevices, devices);
        
        console.log('📱 Merged device list:', mergedDevices.length, 'total devices');
        this.updateState({ discoveredDevices: mergedDevices });
      },
    );

    // Connection info updates
    const connectionSubscription = subscribeOnConnectionInfoUpdates(
      (info: WifiP2pInfo) => {
        console.log('🔗 Connection info update received:', info);
        this.updateState({
          connectionInfo: info,
          isGroupOwner: info.isGroupOwner,
          isConnected: info.groupFormed,
        });
      },
    );

    // File send progress
    const sendSubscription = subscribeOnFileSend((file: any) => {
      console.log('📤 File send progress:', file);
      this.updateState({ transferProgress: file });
    });

    // File receive progress
    const receiveSubscription = subscribeOnFileReceive((file: any) => {
      console.log('📥 File receive progress:', file);
      this.updateState({ transferProgress: file });
    });

    this.subscriptions = [
      peersSubscription,
      connectionSubscription,
      sendSubscription,
      receiveSubscription,
    ];
  }

  async requestPermissions(): Promise<boolean> {
    try {
      logger.info('🔐 P2PService: Requesting permissions...');
      
      // Check if the native module is available
      if (typeof requestPermissions !== 'function') {
        throw new Error('Native requestPermissions function is not available');
      }
      
      logger.info('🔐 P2PService: Native function available, calling...');
      const granted = await requestPermissions();
      logger.info('🔐 P2PService: Permission request result:', granted);
      
      this.updateState({ hasPermissions: granted });
      return granted;
    } catch (error: any) {
      logger.error('❌ P2PService: Permission request error:', error);
      logger.error('❌ P2PService: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        nativeModule: typeof requestPermissions
      });
      
      this.updateState({ 
        error: error.message || 'Failed to request permissions',
        hasPermissions: false 
      });
      return false;
    }
  }

  async startDiscovery(): Promise<boolean> {
    try {
      logger.info('🔍 P2PService: Starting device discovery...');
      
      // Check current state
      const currentState = this.getState();
      logger.info('🔍 P2PService: Current state before discovery:', {
        isInitialized: currentState.isInitialized,
        hasPermissions: currentState.hasPermissions,
        isWifiEnabled: currentState.isWifiEnabled,
        isLocationEnabled: currentState.isLocationEnabled,
        isDiscovering: currentState.isDiscovering,
        error: currentState.error
      });

      // Stop any existing discovery first
      if (currentState.isDiscovering) {
        logger.info('🔍 P2PService: Stopping existing discovery...');
        try {
          await this.stopDiscovery();
          // Wait a moment for cleanup
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (stopError) {
          logger.warn('⚠️ P2PService: Error stopping existing discovery:', stopError);
        }
      }

      if (!currentState.hasPermissions) {
        logger.info('🔍 P2PService: No permissions, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Permissions not granted. Please enable Location and Nearby devices permissions.');
        }
      }

      if (!currentState.isWifiEnabled) {
        throw new Error('WiFi is not enabled. Please enable WiFi and try again.');
      }

      if (!currentState.isLocationEnabled) {
        throw new Error('Location is not enabled. Please enable Location services and try again.');
      }

      logger.info('🔍 P2PService: All checks passed, calling startDiscoveringPeers...');
      
      // Add timeout to discovery to prevent hanging
      const discoveryPromise = startDiscoveringPeers();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Discovery timeout after 30 seconds')), 30000)
      );
      
      await Promise.race([discoveryPromise, timeoutPromise]);
      logger.info('✅ P2PService: startDiscoveringPeers completed successfully');
      
      this.updateState({ isDiscovering: true, error: null });
      logger.info('✅ P2PService: Discovery state updated to true');
      
      // Start periodic refresh of peer list
      this.startPeriodicPeerRefresh();
      
      return true;
    } catch (error: any) {
      logger.error('❌ P2PService: Discovery failed:', error);
      logger.error('❌ P2PService: Discovery error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide more specific error messages
      let userFriendlyError = error.message;
      if (error.message.includes('timeout')) {
        userFriendlyError = 'Device discovery timed out. Please check that both devices have WiFi and Location enabled, then try again.';
      } else if (error.message.includes('permission')) {
        userFriendlyError = 'Missing permissions. Please grant Location and Nearby devices permissions in Settings.';
      }
      
      this.updateState({ error: userFriendlyError, isDiscovering: false });
      return false;
    }
  }

  private periodicRefreshInterval: NodeJS.Timeout | null = null;

  private mergeDeviceLists(currentDevices: Device[], newDevices: Device[]): Device[] {
    const deviceMap = new Map<string, Device & { lastSeen: number }>();
    const now = Date.now();
    
    // Add current devices with their last seen time
    currentDevices.forEach(device => {
      const existingDevice = deviceMap.get(device.deviceAddress);
      deviceMap.set(device.deviceAddress, {
        ...device,
        lastSeen: existingDevice?.lastSeen || now - 5000, // Default to 5 seconds ago
      });
    });
    
    // Update with new devices (mark as recently seen)
    newDevices.forEach(device => {
      deviceMap.set(device.deviceAddress, {
        ...device,
        lastSeen: now,
      });
    });
    
    // Filter out devices not seen for more than 30 seconds
    const validDevices = Array.from(deviceMap.values()).filter(
      device => now - device.lastSeen < 30000
    );
    
    // Sort by last seen (most recent first)
    validDevices.sort((a, b) => b.lastSeen - a.lastSeen);
    
    // Remove lastSeen property before returning
    return validDevices.map(({ lastSeen, ...device }) => device);
  }

  private startPeriodicPeerRefresh() {
    // Clear any existing interval
    if (this.periodicRefreshInterval) {
      clearInterval(this.periodicRefreshInterval);
    }

    // Refresh peer list every 5 seconds while discovering (more frequent)
    this.periodicRefreshInterval = setInterval(async () => {
      if (this.state.isDiscovering) {
        try {
          logger.info('🔄 P2PService: Refreshing peer list...');
          const peers = await this.refreshDeviceList();
          logger.info('🔄 P2PService: Found', peers.length, 'peers during refresh');
          
          // Also clean up old devices during refresh
          const currentDevices = this.state.discoveredDevices || [];
          const cleanedDevices = this.mergeDeviceLists(currentDevices, []);
          if (cleanedDevices.length !== currentDevices.length) {
            logger.info('🧹 P2PService: Cleaned up old devices:', currentDevices.length - cleanedDevices.length, 'removed');
            this.updateState({ discoveredDevices: cleanedDevices });
          }
        } catch (error) {
          logger.warn('⚠️ P2PService: Peer refresh failed:', error);
        }
      } else {
        // Stop refreshing if not discovering
        if (this.periodicRefreshInterval) {
          clearInterval(this.periodicRefreshInterval);
          this.periodicRefreshInterval = null;
        }
      }
    }, 5000); // Reduced to 5 seconds for better responsiveness
  }

  async stopDiscovery(): Promise<void> {
    try {
      logger.info('🛑 P2PService: Stopping device discovery...');
      
      // Clear periodic refresh
      if (this.periodicRefreshInterval) {
        clearInterval(this.periodicRefreshInterval);
        this.periodicRefreshInterval = null;
      }
      
      await stopDiscoveringPeers();
      this.updateState({ isDiscovering: false });
      logger.info('✅ P2PService: Discovery stopped successfully');
    } catch (error: any) {
      logger.error('❌ P2PService: Error stopping discovery:', error);
      this.updateState({ error: error.message, isDiscovering: false });
    }
  }

  async connectToDevice(deviceAddress: string): Promise<boolean> {
    try {
      logger.info('🔗 Attempting to connect to device:', deviceAddress);
      
      // Clear any previous connection state
      this.updateState({ 
        isConnected: false, 
        connectionInfo: null, 
        error: null 
      });
      
      // Call the native connect function
      await connect(deviceAddress);
      
      logger.info('🔗 Connection request sent to device:', deviceAddress);
      logger.info('⏳ Waiting for connection to be established...');
      
      // Wait for connection to be established with timeout
      const maxWaitTime = 10000; // 10 seconds
      const checkInterval = 500; // Check every 500ms
      let waited = 0;
      
      while (waited < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
        
        // Check current connection state
        const currentState = this.getState();
        logger.info('🔗 Connection check:', {
          waited,
          isConnected: currentState.isConnected,
          connectionInfo: currentState.connectionInfo,
          groupFormed: currentState.connectionInfo?.groupFormed
        });
        
        if (currentState.isConnected && currentState.connectionInfo?.groupFormed) {
          logger.info('✅ Connection established successfully');
          return true;
        }
        
        // Also try to get fresh connection info
        try {
          const freshInfo = await this.getConnectionInfo();
          if (freshInfo && freshInfo.groupFormed) {
            logger.info('✅ Found fresh connection info, updating state');
            this.updateState({
              isConnected: true,
              connectionInfo: freshInfo,
              isGroupOwner: freshInfo.isGroupOwner,
              error: null
            });
            return true;
          }
        } catch (infoError) {
          logger.warn('⚠️ Failed to get fresh connection info:', infoError);
        }
      }
      
      logger.warn('⚠️ Connection timeout after', maxWaitTime, 'ms');
      return false;
    } catch (error: any) {
      logger.error('❌ Failed to connect to device:', error);
      this.updateState({ 
        isConnected: false,
        error: error.message || 'Connection failed' 
      });
      return false;
    }
  }

  async smartConnect(deviceAddress: string): Promise<boolean> {
    try {
      logger.info('🧠 Smart connect to device:', deviceAddress);
      
      // First attempt: Direct connection
      logger.info('🔗 Attempt 1: Direct connection');
      let success = await this.connectToDevice(deviceAddress);
      
      if (success) {
        logger.info('✅ Smart connect successful on first attempt');
        return true;
      }
      
      // Second attempt: Stop discovery and retry
      logger.info('🔗 Attempt 2: Stop discovery and retry');
      try {
        await this.stopDiscovery();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        success = await this.connectToDevice(deviceAddress);
        
        if (success) {
          logger.info('✅ Smart connect successful on second attempt');
          return true;
        }
      } catch (retryError) {
        logger.warn('⚠️ Second attempt failed:', retryError);
      }
      
      // Third attempt: Create group and let other device connect
      logger.info('🔗 Attempt 3: Create group for incoming connection');
      try {
        await this.createGroup();
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds for group creation
        
        // Check if connection was established
        const connectionInfo = await this.getConnectionInfo();
        if (connectionInfo && connectionInfo.groupFormed) {
          this.updateState({
            isConnected: true,
            connectionInfo: connectionInfo,
            isGroupOwner: connectionInfo.isGroupOwner,
            error: null
          });
          logger.info('✅ Smart connect successful via group creation');
          return true;
        }
      } catch (groupError) {
        logger.warn('⚠️ Group creation attempt failed:', groupError);
      }
      
      logger.error('❌ Smart connect failed after all attempts');
      return false;
      
    } catch (error: any) {
      logger.error('❌ Smart connect error:', error);
      this.updateState({ 
        isConnected: false,
        error: error.message || 'Smart connection failed' 
      });
      return false;
    }
  }

  async createGroup(): Promise<boolean> {
    try {
      await createGroup();
      this.updateState({ isGroupOwner: true, error: null });
      return true;
    } catch (error) {
      this.updateState({ error: error.message });
      return false;
    }
  }

  async removeGroup(): Promise<boolean> {
    try {
      await removeGroup();
      this.updateState({
        isGroupOwner: false,
        isConnected: false,
        connectionInfo: null,
      });
      return true;
    } catch (error) {
      this.updateState({ error: error.message });
      return false;
    }
  }

  async getConnectionInfo(): Promise<WifiP2pInfo | null> {
    try {
      console.log('🔍 Getting fresh connection info...');
      // Import the getConnectionInfo function from the native module
      const { getConnectionInfo } = await import('p2p-file-transfer');
      const info = await getConnectionInfo();
      console.log('🔍 Fresh connection info received:', info);
      return info;
    } catch (error: any) {
      console.error('❌ Failed to get connection info:', error);
      return null;
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      console.log('🔍 Validating connection state...');
      
      // Get fresh connection info
      const freshInfo = await this.getConnectionInfo();
      
      if (freshInfo && freshInfo.groupFormed) {
        console.log('✅ Connection validation passed:', freshInfo);
        this.updateState({
          connectionInfo: freshInfo,
          isConnected: true,
          isGroupOwner: freshInfo.isGroupOwner,
          error: null
        });
        return true;
      } else {
        console.log('❌ Connection validation failed:', freshInfo);
        this.updateState({
          isConnected: false,
          connectionInfo: null,
          error: 'Connection not established'
        });
        return false;
      }
    } catch (error: any) {
      console.error('❌ Connection validation error:', error);
      this.updateState({
        isConnected: false,
        connectionInfo: null,
        error: error.message
      });
      return false;
    }
  }

  async sendFile(filePath: string, retryCount: number = 0): Promise<boolean> {
    const maxRetries = 2;
    
    try {
      console.log('📤 P2PService.sendFile called with:', filePath);
      console.log('📤 Current P2P state:', {
        isConnected: this.state.isConnected,
        connectionInfo: this.state.connectionInfo,
        isGroupOwner: this.state.isGroupOwner,
        error: this.state.error
      });
      
      // Force a fresh connection state check
      console.log('🔄 Forcing fresh connection state check...');
      const freshInfo = await this.getConnectionInfo();
      console.log('🔄 Fresh connection info:', freshInfo);
      
      // Update state with fresh info
      if (freshInfo) {
        this.updateState({
          connectionInfo: freshInfo,
          isConnected: freshInfo.groupFormed,
          isGroupOwner: freshInfo.isGroupOwner
        });
      }
      
      // More flexible connection check - check both isConnected and connectionInfo
      const hasValidConnection = this.state.isConnected || 
        (this.state.connectionInfo && this.state.connectionInfo.groupFormed);
      
      if (!hasValidConnection) {
        console.error('❌ No valid connection found after fresh check');
        console.error('❌ Connection state details:', {
          isConnected: this.state.isConnected,
          connectionInfo: this.state.connectionInfo,
          groupFormed: this.state.connectionInfo?.groupFormed,
          isGroupOwner: this.state.connectionInfo?.isGroupOwner,
          groupOwnerAddress: this.state.connectionInfo?.groupOwnerAddress,
          freshInfo: freshInfo
        });
        
        throw new Error('Not connected to any device. Please connect to a device first.');
      }

      // Check if the file path is a URL or key instead of a local path
      if (filePath.startsWith('http') || filePath.startsWith('https')) {
        console.error('❌ Cannot send remote URL directly:', filePath);
        throw new Error('Cannot send remote URL. Please download the file first.');
      }

      if (filePath.includes('videoKey') || filePath.includes('src')) {
        console.error('❌ Invalid file path format:', filePath);
        throw new Error('Invalid file path. Expected local file path, got: ' + filePath);
      }

      console.log('📤 Attempting to send file:', filePath);
      console.log('📤 Group owner address:', this.state.connectionInfo.groupOwnerAddress?.hostAddress);
      
      const result = await sendFile(filePath);
      console.log('📤 Native sendFile result:', result);
      
      this.updateState({ error: null });
      return true;
    } catch (error: any) {
      console.error('❌ P2PService.sendFile error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        currentState: this.state,
        retryCount
      });
      
      // Handle EADDRINUSE error with retry
      if (error.message && error.message.includes('EADDRINUSE') && retryCount < maxRetries) {
        console.log(`🔄 Port in use, retrying in 2 seconds... (attempt ${retryCount + 1}/${maxRetries})`);
        
        // Wait 2 seconds before retry to allow port cleanup
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to clean up any lingering connections
        try {
          await this.removeGroup();
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (cleanupError) {
          console.warn('⚠️ Cleanup error during retry:', cleanupError);
        }
        
        // Retry the send
        return this.sendFile(filePath, retryCount + 1);
      }
      
      this.updateState({ error: error.message || 'Unknown error' });
      return false;
    }
  }

  async getLocalVideoPath(video: any): Promise<string | null> {
    try {
      console.log('🔍 Getting local path for video:', video.title);
      
      // Import RNFS for file system operations
      const RNFS = require('react-native-fs');
      const { cleanMovieTitle } = require('../helpers/utils');
      
      // Check if video has a direct local path first
      if (video.localPath && video.localPath.startsWith('/')) {
        console.log('✅ Found direct localPath:', video.localPath);
        return video.localPath;
      }
      
      if (video.downloadedPath && video.downloadedPath.startsWith('/')) {
        console.log('✅ Found direct downloadedPath:', video.downloadedPath);
        return video.downloadedPath;
      }
      
      if (video.cachedPath && video.cachedPath.startsWith('/')) {
        console.log('✅ Found direct cachedPath:', video.cachedPath);
        return video.cachedPath;
      }
      
      // Check download folders like PlayVideos does
      const foldersToCheck = [
        'SpredVideos', // Android 10+ folder (newer downloads)
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
      ];

      const videoKeyToCheck = video.videoKey || video.trailerKey;
      if (!videoKeyToCheck) {
        console.log('❌ No video key available for download check');
        return null;
      }

      console.log('🔍 Checking download folders for video...');
      console.log('  - Video key:', videoKeyToCheck);
      console.log('  - Title:', video.title);

      for (const folderName of foldersToCheck) {
        try {
          const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
          const folderExists = await RNFS.exists(folderPath);

          console.log(`  - Checking folder: ${folderPath}, exists: ${folderExists}`);

          if (!folderExists) {
            continue;
          }

          const files = await RNFS.readDir(folderPath);
          console.log(`  - Files in folder: ${files.length}`);

          // Create multiple variations of the title to check against
          const cleanedTitle = cleanMovieTitle(video.title);
          const titleVariations = [
            cleanedTitle.toLowerCase(),
            video.title.toLowerCase(),
            cleanedTitle.replace(/\s+/g, '_').toLowerCase(),
            video.title.replace(/\s+/g, '_').toLowerCase(),
            cleanedTitle.replace(/\s+/g, '').toLowerCase(),
            video.title.replace(/\s+/g, '').toLowerCase(),
          ];

          // Create variations of the video key to check against
          const keyVariations = [
            videoKeyToCheck.toLowerCase(),
            videoKeyToCheck.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
          ];

          const downloadedFile = files.find(file => {
            const fileName = file.name.toLowerCase();

            console.log(`  - Checking file: ${file.name}`);

            // Check against all key variations
            for (const keyVar of keyVariations) {
              if (
                fileName.includes(keyVar) ||
                fileName.includes(`${keyVar}.mp4`) ||
                fileName.includes(`${keyVar}.mov`) ||
                fileName.includes(`${keyVar}.m4v`)
              ) {
                console.log(`  - ✅ Matched by key variation: ${keyVar}`);
                return true;
              }
            }

            // Check against all title variations
            for (const titleVar of titleVariations) {
              if (
                fileName.includes(titleVar) ||
                fileName.includes(`${titleVar}.mp4`) ||
                fileName.includes(`${titleVar}.mov`) ||
                fileName.includes(`${titleVar}.m4v`)
              ) {
                console.log(`  - ✅ Matched by title variation: ${titleVar}`);
                return true;
              }
            }

            return false;
          });

          if (downloadedFile) {
            console.log('✅ Found downloaded video file:', downloadedFile.path);
            return downloadedFile.path;
          }
        } catch (error) {
          console.warn(`  - Error checking ${folderName}:`, error);
          continue;
        }
      }

      console.log('❌ No downloaded file found for video');
      return null;
    } catch (error: any) {
      console.error('❌ Error getting local video path:', error);
      return null;
    }
  }

  async receiveFile(destinationPath: string): Promise<boolean> {
    try {
      // Automatically accept and receive the file (parameter true means auto-accept)
      await receiveFile(destinationPath, true);
      this.updateState({ error: null });
      return true;
    } catch (error) {
      this.updateState({ error: error.message });
      return false;
    }
  }

  async refreshDeviceList(): Promise<Device[]> {
    try {
      logger.info('🔄 P2PService: Getting available peers...');
      const { devices } = await getAvailablePeers();
      logger.info('🔄 P2PService: Native module returned', devices.length, 'devices');
      
      // Don't directly update state here - let the merge logic handle it
      // this.updateState({ discoveredDevices: devices });
      
      // Instead, trigger a peer update event to go through the merge logic
      if (devices.length > 0) {
        const currentDevices = this.state.discoveredDevices || [];
        const mergedDevices = this.mergeDeviceLists(currentDevices, devices);
        this.updateState({ discoveredDevices: mergedDevices });
      }
      
      return devices;
    } catch (error: any) {
      logger.error('❌ P2PService: Error refreshing device list:', error);
      // Don't clear the device list on error - keep existing devices
      // this.updateState({ error: error.message });
      return [];
    }
  }

  getState(): P2PServiceState {
    return { ...this.state };
  }

  async openSettings(): Promise<void> {
    try {
      if (!this.state.hasPermissions) {
        await openAppSettings();
      } else if (!this.state.isLocationEnabled) {
        await openLocationSettings();
      } else if (!this.state.isWifiEnabled) {
        await openWifiSettings();
      }
    } catch (error) {
      this.updateState({ error: error.message });
    }
  }

  // Method to manually add a discovered device (for QR code pairing)
  addDiscoveredDevice(device: Device) {
    logger.info('➕ P2PService: Manually adding discovered device:', device.deviceName);
    const currentDevices = this.state.discoveredDevices || [];
    const mergedDevices = this.mergeDeviceLists(currentDevices, [device]);
    this.updateState({ discoveredDevices: mergedDevices });
  }

  // Method to keep devices alive (reset their last seen time)
  keepDevicesAlive() {
    const currentDevices = this.state.discoveredDevices || [];
    if (currentDevices.length > 0) {
      logger.info('💓 P2PService: Keeping', currentDevices.length, 'devices alive');
      const refreshedDevices = this.mergeDeviceLists(currentDevices, currentDevices);
      this.updateState({ discoveredDevices: refreshedDevices });
    }
  }

  getErrorGuidance(errorMessage: string): { title: string; message: string; actions: string[] } {
    if (errorMessage.includes('permission')) {
      return {
        title: 'Permission Required',
        message: 'WiFi Direct needs specific permissions to work properly.',
        actions: [
          'Go to Settings → Apps → SPRED → Permissions',
          'Enable "Location" permission (required for device discovery)',
          'Enable "Nearby devices" permission (if available)',
          'Restart the app and try again'
        ]
      };
    }
    
    if (errorMessage.includes('location') || errorMessage.includes('Location')) {
      return {
        title: 'Location Services Required',
        message: 'WiFi Direct requires location services to discover nearby devices.',
        actions: [
          'Go to Settings → Location',
          'Turn ON location services',
          'Set accuracy to "High accuracy"',
          'Restart the app and try again'
        ]
      };
    }
    
    if (errorMessage.includes('wifi') || errorMessage.includes('WiFi')) {
      return {
        title: 'WiFi Required',
        message: 'WiFi must be enabled for device-to-device connections.',
        actions: [
          'Go to Settings → WiFi',
          'Turn ON WiFi',
          'Make sure WiFi hotspot is OFF',
          'Try connecting again'
        ]
      };
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('discover')) {
      return {
        title: 'Discovery Issues',
        message: 'Unable to find nearby devices. This could be due to several factors.',
        actions: [
          'Make sure both devices are within 30 feet',
          'Check that both devices have WiFi and Location enabled',
          'Restart WiFi on both devices',
          'Try using QR code pairing instead',
          'Ensure no other WiFi Direct connections are active'
        ]
      };
    }
    
    return {
      title: 'Connection Error',
      message: 'An unexpected error occurred during P2P operation.',
      actions: [
        'Check that both devices support WiFi Direct',
        'Restart the app on both devices',
        'Try moving devices closer together',
        'Contact support if the problem persists'
      ]
    };
  }

  async disconnect() {
    try {
      logger.info('🔌 Disconnecting P2P service...');
      
      // Clear periodic refresh
      if (this.periodicRefreshInterval) {
        clearInterval(this.periodicRefreshInterval);
        this.periodicRefreshInterval = null;
      }
      
      // Stop discovery if running
      if (this.state.isDiscovering) {
        await this.stopDiscovery();
      }
      
      // Remove P2P group if connected
      if (this.state.isConnected || this.state.isGroupOwner) {
        await this.removeGroup();
      }
      
      // Remove all subscriptions
      this.subscriptions.forEach(subscription => {
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      });
      this.subscriptions = [];
      this.listeners = [];
      
      // Reset state
      this.updateState({
        isConnected: false,
        isGroupOwner: false,
        isDiscovering: false,
        connectionInfo: null,
        discoveredDevices: [],
        transferProgress: null,
        error: null
      });
      
      logger.info('✅ P2P service disconnected successfully');
    } catch (error) {
      logger.error('❌ Error during P2P disconnect:', error);
      // Still clean up subscriptions even if group removal fails
      this.subscriptions.forEach(subscription => {
        if (subscription && subscription.remove) {
          subscription.remove();
        }
      });
      this.subscriptions = [];
      this.listeners = [];
      
      // Clear periodic refresh even on error
      if (this.periodicRefreshInterval) {
        clearInterval(this.periodicRefreshInterval);
        this.periodicRefreshInterval = null;
      }
    }
  }
}
