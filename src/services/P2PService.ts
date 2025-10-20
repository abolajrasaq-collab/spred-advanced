import {
  checkPermissions,
  requestPermissions,
  isLocationEnabled,
  isWifiEnabled,
  isWifiHotspotEnabled,
  initialize,
  subscribeOnPeersUpdates,
  subscribeOnConnectionInfoUpdates,
  connect,
  createGroup,
  removeGroup,
  getGroupInfo,
  Device,
  File as P2PFile,
  WifiP2pInfo,
  GroupInfo,
  openAppSettings,
  openWifiSettings,
  openWifiHotspotSettings,
  openLocationSettings,
} from 'p2p-file-transfer';
import logger from '../utils/logger';
import GoogleNearbyService, { NearbyDevice } from './GoogleNearbyService';
import SpredFileService from './SpredFileService';

// Import these functions directly from the p2p-file-transfer module
import {
  startDiscoveringPeers,
  stopDiscoveringPeers,
  getAvailablePeers,
  sendFile,
  receiveFile,
} from 'p2p-file-transfer';

export type { Device, P2PFile, WifiP2pInfo, GroupInfo };

export interface P2PServiceState {
  isInitialized: boolean;
  hasPermissions: boolean;
  isLocationEnabled: boolean;
  isWifiEnabled: boolean;
  isDiscovering: boolean;
  isConnected: boolean;
  isGroupOwner: boolean;
  discoveredDevices: Device[];
  nearbyDevices: NearbyDevice[];
  connectionInfo: WifiP2pInfo | null;
  transferProgress: P2PFile | null;
  connectionMethod: 'google_nearby' | 'wifi_direct' | 'hotspot' | null;
  error: string | null;
}

export class P2PService {
  private static instance: P2PService;
  private state: P2PServiceState;
  private listeners: ((state: P2PServiceState) => void)[] = [];
  private subscriptions: any[] = [];
  private googleNearby: GoogleNearbyService;

  private constructor() {
    this.googleNearby = GoogleNearbyService.getInstance();
    this.state = {
      isInitialized: false,
      hasPermissions: false,
      isLocationEnabled: false,
      isWifiEnabled: false,
      isDiscovering: false,
      isConnected: false,
      isGroupOwner: false,
      discoveredDevices: [],
      nearbyDevices: [],
      connectionInfo: null,
      transferProgress: null,
      connectionMethod: null,
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
        discoveredDevices: oldState.discoveredDevices?.length || 0,
      },
      newState: {
        isInitialized: this.state.isInitialized,
        isConnected: this.state.isConnected,
        isDiscovering: this.state.isDiscovering,
        discoveredDevices: this.state.discoveredDevices?.length || 0,
      },
      listeners: this.listeners.length,
    });

    this.notifyListeners();
  }

  private notifyListeners() {
    console.log(
      `📢 Notifying ${this.listeners.length} listeners of state change`,
    );
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

      // Try Google Nearby first (preferred method)
      logger.info('🔄 P2PService: Attempting Google Nearby initialization...');
      const nearbyInitialized = await this.googleNearby.initialize();
      if (nearbyInitialized) {
        this.updateState({
          isInitialized: true,
          connectionMethod: 'google_nearby',
          error: null,
        });
        logger.info('✅ P2PService: Google Nearby initialized successfully');
        return true;
      }

      logger.info(
        '⚠️ P2PService: Google Nearby not available, falling back to WiFi Direct',
      );

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

  // Google Nearby specific methods
  async startNearbyDiscovery(): Promise<boolean> {
    try {
      logger.info('🔍 P2PService: Starting Google Nearby discovery...');

      // Start advertising (for receiving connections)
      const advertisingStarted = await this.googleNearby.startAdvertising();
      if (!advertisingStarted) {
        throw new Error('Failed to start advertising');
      }

      // Start discovery (for finding other devices)
      const discoveryStarted = await this.googleNearby.startDiscovery();
      if (!discoveryStarted) {
        await this.googleNearby.stopAdvertising(); // Cleanup
        throw new Error('Failed to start discovery');
      }

      // Set up event listeners for Google Nearby
      this.setupNearbyEventListeners();

      this.updateState({
        isDiscovering: true,
        connectionMethod: 'google_nearby',
        error: null,
      });

      logger.info('✅ P2PService: Google Nearby discovery started');
      return true;
    } catch (error: any) {
      logger.error('❌ P2PService: Google Nearby discovery failed', error);
      this.updateState({
        error: error.message || 'Google Nearby discovery failed',
        isDiscovering: false,
      });
      return false;
    }
  }

  async stopNearbyDiscovery(): Promise<void> {
    try {
      logger.info('🛑 P2PService: Stopping Google Nearby discovery...');

      await Promise.all([
        this.googleNearby.stopAdvertising(),
        this.googleNearby.stopDiscovery(),
      ]);

      this.updateState({
        isDiscovering: false,
        nearbyDevices: [],
      });

      logger.info('✅ P2PService: Google Nearby discovery stopped');
    } catch (error: any) {
      logger.error('❌ P2PService: Stop Google Nearby discovery failed', error);
    }
  }

  private setupNearbyEventListeners(): void {
    // Device discovery events
    this.googleNearby.onDeviceFound(device => {
      logger.info('📱 P2PService: Google Nearby device found', device);

      const currentDevices = this.state.nearbyDevices || [];
      const updatedDevices = [...currentDevices];

      // Remove if already exists (update)
      const existingIndex = updatedDevices.findIndex(d => d.id === device.id);
      if (existingIndex >= 0) {
        updatedDevices[existingIndex] = device;
      } else {
        updatedDevices.push(device);
      }

      this.updateState({ nearbyDevices: updatedDevices });
    });

    this.googleNearby.onDeviceLost(deviceId => {
      logger.info('📱 P2PService: Google Nearby device lost', deviceId);

      const currentDevices = this.state.nearbyDevices || [];
      const updatedDevices = currentDevices.filter(d => d.id !== deviceId);

      this.updateState({ nearbyDevices: updatedDevices });
    });

    // Connection events
    this.googleNearby.onConnectionInitiated(info => {
      logger.info('🔗 P2PService: Google Nearby connection initiated', info);

      // Auto-accept connections for now (can be made configurable later)
      this.googleNearby.acceptConnection(info.endpointId);
    });

    this.googleNearby.onConnectionResult((device, success) => {
      logger.info('🔗 P2PService: Google Nearby connection result', {
        device,
        success,
      });

      if (success) {
        this.updateState({
          isConnected: true,
          connectionMethod: 'google_nearby',
        });
      }
    });

    this.googleNearby.onDisconnected(deviceId => {
      logger.info('🔌 P2PService: Google Nearby disconnected', deviceId);

      this.updateState({ isConnected: false });
    });

    // File transfer events
    this.googleNearby.onPayloadReceived(payload => {
      logger.info('📥 P2PService: Google Nearby payload received', payload);

      // Update transfer progress
      this.updateState({ transferProgress: payload as any });
    });

    this.googleNearby.onPayloadProgress((payloadId, progress) => {
      logger.info('📊 P2PService: Google Nearby payload progress', {
        payloadId,
        progress,
      });

      // Create a progress object compatible with existing transferProgress type
      const progressInfo = {
        time: Date.now(),
        file: payloadId,
        progress: progress * 100, // Convert to percentage
        status: progress >= 1 ? 'completed' : 'transferring',
      };

      this.updateState({ transferProgress: progressInfo as any });
    });
  }

  // Google Nearby file transfer method
  private async sendFileNearby(filePath: string): Promise<boolean> {
    try {
      logger.info('📤 P2PService: Sending file via Google Nearby', filePath);

      // Get connected devices
      const connectedDevices = this.googleNearby.getConnectedDevices();
      if (connectedDevices.length === 0) {
        throw new Error('No devices connected via Google Nearby');
      }

      // Send to first connected device (can be enhanced for multi-device)
      const targetDevice = connectedDevices[0];
      const payloadId = await this.googleNearby.sendFile(
        targetDevice.id,
        filePath,
      );

      logger.info('✅ P2PService: File sent via Google Nearby', {
        payloadId,
        targetDevice: targetDevice.name,
      });
      return true;
    } catch (error: any) {
      logger.error('❌ P2PService: Google Nearby file send failed', error);
      throw error;
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

        console.log(
          '📱 Merged device list:',
          mergedDevices.length,
          'total devices',
        );
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

    this.subscriptions = [peersSubscription, connectionSubscription];
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
        nativeModule: typeof requestPermissions,
      });

      this.updateState({
        error: error.message || 'Failed to request permissions',
        hasPermissions: false,
      });
      return false;
    }
  }

  async checkWifiDirectSupport(): Promise<boolean> {
    try {
      logger.info('🔍 P2PService: Checking WiFi Direct support...');

      // For now, assume WiFi Direct is supported on Android devices
      // Most Android 4.0+ devices support WiFi Direct
      // This check can be enhanced when the native module provides capability detection
      logger.info(
        '🔍 P2PService: Assuming WiFi Direct support (Android 4.0+ devices)',
      );
      return true;
    } catch (error: any) {
      logger.error('❌ P2PService: Error checking WiFi Direct support:', error);
      // Assume supported if check fails
      return true;
    }
  }

  async checkHotspotStatus(): Promise<boolean> {
    try {
      logger.info('🔍 P2PService: Checking WiFi hotspot status...');

      // Check if WiFi hotspot is enabled (conflicts with WiFi Direct)
      const hotspotEnabled = await isWifiHotspotEnabled();
      logger.info('🔍 P2PService: WiFi hotspot status:', hotspotEnabled);

      return hotspotEnabled;
    } catch (error: any) {
      logger.error('❌ P2PService: Error checking hotspot status:', error);
      // Assume disabled if check fails
      return false;
    }
  }

  async startDiscovery(retryCount: number = 0): Promise<boolean> {
    const maxRetries = 3;

    try {
      logger.info(
        `🔍 P2PService: Starting device discovery (attempt ${retryCount + 1}/${
          maxRetries + 1
        })...`,
      );

      // Check current state
      const currentState = this.getState();
      logger.info('🔍 P2PService: Current state before discovery:', {
        isInitialized: currentState.isInitialized,
        hasPermissions: currentState.hasPermissions,
        isWifiEnabled: currentState.isWifiEnabled,
        isLocationEnabled: currentState.isLocationEnabled,
        isDiscovering: currentState.isDiscovering,
        connectionMethod: currentState.connectionMethod,
        error: currentState.error,
      });

      // Stop any existing discovery first
      if (currentState.isDiscovering) {
        logger.info('🔍 P2PService: Stopping existing discovery...');
        try {
          await this.stopDiscovery();
          // Wait a moment for cleanup
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (stopError) {
          logger.warn(
            '⚠️ P2PService: Error stopping existing discovery:',
            stopError,
          );
        }
      }

      // Try Google Nearby first (preferred method)
      if (
        currentState.connectionMethod === 'google_nearby' ||
        currentState.connectionMethod === null
      ) {
        logger.info('🔄 P2PService: Attempting Google Nearby discovery...');
        const nearbySuccess = await this.startNearbyDiscovery();
        if (nearbySuccess) {
          logger.info('✅ P2PService: Google Nearby discovery successful');
          return true;
        }
        logger.warn(
          '⚠️ P2PService: Google Nearby discovery failed, falling back to WiFi Direct',
        );
      }

      if (!currentState.hasPermissions) {
        logger.info('🔍 P2PService: No permissions, requesting...');
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error(
            'Permissions not granted. Please enable Location and Nearby devices permissions.',
          );
        }
      }

      if (!currentState.isWifiEnabled) {
        throw new Error(
          'WiFi is not enabled. Please enable WiFi and try again.',
        );
      }

      if (!currentState.isLocationEnabled) {
        throw new Error(
          'Location is not enabled. Please enable Location services and try again.',
        );
      }

      // Check if WiFi hotspot is enabled (conflicts with WiFi Direct)
      const hotspotEnabled = await this.checkHotspotStatus();
      if (hotspotEnabled) {
        throw new Error(
          'WiFi Hotspot must be turned off to use WiFi Direct. Please disable hotspot.',
        );
      }

      // Check WiFi Direct support
      const wifiDirectSupported = await this.checkWifiDirectSupport();
      if (!wifiDirectSupported) {
        throw new Error('WiFi Direct is not supported on this device.');
      }

      logger.info(
        '🔍 P2PService: All checks passed, calling startDiscoveringPeers...',
      );

      // Add timeout to discovery to prevent hanging (reduced from 30s to 15s)
      const discoveryPromise = startDiscoveringPeers();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Discovery timeout after 15 seconds')),
          15000,
        ),
      );

      await Promise.race([discoveryPromise, timeoutPromise]);
      logger.info(
        '✅ P2PService: startDiscoveringPeers completed successfully',
      );

      this.updateState({ isDiscovering: true, error: null });
      logger.info('✅ P2PService: Discovery state updated to true');

      // Start periodic refresh of peer list
      this.startPeriodicPeerRefresh();

      return true;
    } catch (error: any) {
      logger.error(
        `❌ P2PService: Discovery attempt ${retryCount + 1} failed:`,
        error,
      );
      logger.error('❌ P2PService: Discovery error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      // Retry logic for discovery failures
      if (retryCount < maxRetries) {
        logger.warn(
          `⚠️ P2PService: Discovery attempt ${
            retryCount + 1
          } failed, trying hotspot fallback...`,
        );

        // Try hotspot fallback before retrying WiFi Direct
        const hotspotFallback = await this.createHotspotFallback();
        if (hotspotFallback) {
          logger.info(
            '✅ P2PService: Hotspot fallback successful, discovery may work now',
          );
          // Wait a moment for hotspot to stabilize
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          logger.warn(
            '⚠️ P2PService: Hotspot fallback failed, retrying WiFi Direct...',
          );
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        }

        return this.startDiscovery(retryCount + 1);
      }

      // Provide more specific error messages
      let userFriendlyError = error.message;
      if (error.message.includes('timeout')) {
        userFriendlyError =
          'Device discovery timed out after multiple attempts. Please check that both devices have WiFi and Location enabled, then try again.';
      } else if (error.message.includes('permission')) {
        userFriendlyError =
          'Missing permissions. Please grant Location and Nearby devices permissions in Settings.';
      }

      this.updateState({ error: userFriendlyError, isDiscovering: false });
      return false;
    }
  }

  private periodicRefreshInterval: NodeJS.Timeout | null = null;

  private mergeDeviceLists(
    currentDevices: Device[],
    newDevices: Device[],
  ): Device[] {
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

    // Filter out devices not seen for more than 60 seconds (increased from 30s)
    const validDevices = Array.from(deviceMap.values()).filter(
      device => now - device.lastSeen < 60000,
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

          // Validate that discovery is actually still running
          const isStillDiscovering = await this.validateDiscoveryState();
          if (!isStillDiscovering) {
            logger.warn(
              '⚠️ P2PService: Discovery stopped, clearing refresh interval',
            );
            this.updateState({ isDiscovering: false });
            if (this.periodicRefreshInterval) {
              clearInterval(this.periodicRefreshInterval);
              this.periodicRefreshInterval = null;
            }
            return;
          }

          const peers = await this.refreshDeviceList();
          logger.info(
            '🔄 P2PService: Found',
            peers.length,
            'peers during refresh',
          );

          // Also clean up old devices during refresh
          const currentDevices = this.state.discoveredDevices || [];
          const cleanedDevices = this.mergeDeviceLists(currentDevices, []);
          if (cleanedDevices.length !== currentDevices.length) {
            logger.info(
              '🧹 P2PService: Cleaned up old devices:',
              currentDevices.length - cleanedDevices.length,
              'removed',
            );
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
    }, 5000); // 5 seconds for better responsiveness
  }

  private async validateDiscoveryState(): Promise<boolean> {
    try {
      // For now, just check our internal state
      // This can be enhanced when native module provides discovery state checking
      logger.debug(
        '🔍 P2PService: Validating discovery state (internal check)',
      );
      return this.state.isDiscovering;
    } catch (error) {
      logger.warn('⚠️ P2PService: Error validating discovery state:', error);
      return false;
    }
  }

  async stopDiscovery(): Promise<void> {
    try {
      logger.info('🛑 P2PService: Stopping device discovery...');

      // Clear periodic refresh
      if (this.periodicRefreshInterval) {
        clearInterval(this.periodicRefreshInterval);
        this.periodicRefreshInterval = null;
      }

      // Stop discovery
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
        error: null,
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
          groupFormed: currentState.connectionInfo?.groupFormed,
        });

        if (
          currentState.isConnected &&
          currentState.connectionInfo?.groupFormed
        ) {
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
              error: null,
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
        error: error.message || 'Connection failed',
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
            error: null,
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
        error: error.message || 'Smart connection failed',
      });
      return false;
    }
  }

  async createGroup(): Promise<boolean> {
    try {
      logger.info(
        '📡 P2PService: Creating WiFi Direct group for discoverability...',
      );
      await createGroup();
      this.updateState({ isGroupOwner: true, error: null });
      logger.info(
        '✅ P2PService: Group created successfully - device is now discoverable',
      );
      return true;
    } catch (error: any) {
      logger.error('❌ P2PService: Group creation failed:', error);
      this.updateState({ error: error.message || 'Failed to create group' });
      return false;
    }
  }

  async getGroupInfo(): Promise<GroupInfo | null> {
    try {
      logger.info('📡 P2PService: Getting group information...');
      const groupInfo = await getGroupInfo();
      logger.info('📡 P2PService: Group info retrieved:', groupInfo);
      return groupInfo;
    } catch (error: any) {
      logger.error('❌ P2PService: Failed to get group info:', error);
      return null;
    }
  }

  async createHotspotFallback(): Promise<boolean> {
    try {
      logger.info('🔄 P2PService: Attempting hotspot fallback mode...');

      // Check if we can create a hotspot
      const hotspotEnabled = await this.checkHotspotStatus();
      if (hotspotEnabled) {
        logger.info(
          '✅ P2PService: Hotspot already enabled, using existing hotspot',
        );
        return true;
      }

      // Try to open hotspot settings for user to enable manually
      logger.info(
        '🔄 P2PService: Opening hotspot settings for manual enable...',
      );
      await openWifiHotspotSettings();

      // Wait a moment for user to enable hotspot
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check again if hotspot is now enabled
      const hotspotNowEnabled = await this.checkHotspotStatus();
      if (hotspotNowEnabled) {
        logger.info('✅ P2PService: Hotspot fallback successful');
        return true;
      } else {
        logger.warn('⚠️ P2PService: Hotspot not enabled by user');
        return false;
      }
    } catch (error: any) {
      logger.error('❌ P2PService: Hotspot fallback failed:', error);
      return false;
    }
  }

  async startReceiverMode(): Promise<boolean> {
    try {
      logger.info('📥 P2PService: Starting receiver mode...');

      // Check if service is already initialized
      if (!this.state.isInitialized) {
        logger.warn(
          '⚠️ P2PService: Service not initialized, cannot start receiver mode',
        );
        return false;
      }

      // Check if we're in an emulator (P2P doesn't work in emulators)
      try {
        const { Platform } = require('react-native');
        if (Platform.OS === 'android') {
          // Try to check if we're in emulator without requiring react-native-device-info
          // This is a fallback since the module might not be available
          try {
            const DeviceInfo = require('react-native-device-info');
            if (DeviceInfo && typeof DeviceInfo.isEmulator === 'function') {
              const isEmulator = await DeviceInfo.isEmulator();
              if (isEmulator) {
                logger.warn(
                  '⚠️ P2PService: Running in emulator, P2P functionality limited',
                );
                return false;
              }
            }
          } catch (deviceInfoError) {
            // react-native-device-info not available, continue without emulator check
            logger.warn(
              '⚠️ P2PService: react-native-device-info not available, skipping emulator check',
            );
          }
        }
      } catch (deviceCheckError) {
        // Ignore device check errors, continue with P2P attempt
        logger.warn(
          '⚠️ P2PService: Could not check device type:',
          deviceCheckError,
        );
      }

      // Try to create group to make device discoverable
      try {
        const groupCreated = await this.createGroup();
        if (groupCreated) {
          logger.info(
            '✅ P2PService: Receiver mode active - device is discoverable',
          );
          return true;
        }
      } catch (groupError) {
        logger.warn('⚠️ P2PService: Group creation failed:', groupError);
      }

      // Fallback to discovery mode
      logger.warn(
        '⚠️ P2PService: Group creation failed, falling back to discovery',
      );
      return await this.startDiscovery();
    } catch (error: any) {
      logger.error('❌ P2PService: Receiver mode failed:', error);
      this.updateState({
        error: error.message || 'Failed to start receiver mode',
      });
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
          error: null,
        });
        return true;
      } else {
        console.log('❌ Connection validation failed:', freshInfo);
        this.updateState({
          isConnected: false,
          connectionInfo: null,
          error: 'Connection not established',
        });
        return false;
      }
    } catch (error: any) {
      console.error('❌ Connection validation error:', error);
      this.updateState({
        isConnected: false,
        connectionInfo: null,
        error: error.message,
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
        connectionMethod: this.state.connectionMethod,
        error: this.state.error,
      });

      // Use Google Nearby if that's the active connection method
      if (this.state.connectionMethod === 'google_nearby') {
        logger.info('🔄 P2PService: Using Google Nearby for file transfer');
        return await this.sendFileNearby(filePath);
      }

      // Force a fresh connection state check
      console.log('🔄 Forcing fresh connection state check...');
      const freshInfo = await this.getConnectionInfo();
      console.log('🔄 Fresh connection info:', freshInfo);

      // Update state with fresh info
      if (freshInfo) {
        this.updateState({
          connectionInfo: freshInfo,
          isConnected: freshInfo.groupFormed,
          isGroupOwner: freshInfo.isGroupOwner,
        });
      }

      // More flexible connection check - check both isConnected and connectionInfo
      const hasValidConnection =
        this.state.isConnected ||
        (this.state.connectionInfo && this.state.connectionInfo.groupFormed);

      if (!hasValidConnection) {
        console.error('❌ No valid connection found after fresh check');
        console.error('❌ Connection state details:', {
          isConnected: this.state.isConnected,
          connectionInfo: this.state.connectionInfo,
          groupFormed: this.state.connectionInfo?.groupFormed,
          isGroupOwner: this.state.connectionInfo?.isGroupOwner,
          groupOwnerAddress: this.state.connectionInfo?.groupOwnerAddress,
          freshInfo: freshInfo,
        });

        throw new Error(
          'Not connected to any device. Please connect to a device first.',
        );
      }

      // Check if the file path is a URL or key instead of a local path
      if (filePath.startsWith('http') || filePath.startsWith('https')) {
        console.error('❌ Cannot send remote URL directly:', filePath);
        throw new Error(
          'Cannot send remote URL. Please download the file first.',
        );
      }

      if (filePath.includes('videoKey') || filePath.includes('src')) {
        console.error('❌ Invalid file path format:', filePath);
        throw new Error(
          'Invalid file path. Expected local file path, got: ' + filePath,
        );
      }

      console.log('📤 Attempting to send file:', filePath);
      console.log(
        '📤 Group owner address:',
        this.state.connectionInfo.groupOwnerAddress?.hostAddress,
      );

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
        retryCount,
      });

      // Handle EADDRINUSE error with retry
      if (
        error.message &&
        error.message.includes('EADDRINUSE') &&
        retryCount < maxRetries
      ) {
        console.log(
          `🔄 Port in use, retrying in 2 seconds... (attempt ${
            retryCount + 1
          }/${maxRetries})`,
        );

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
      let RNFS: any = null;
      let cleanMovieTitle: any = null;

      try {
        RNFS = require('react-native-fs');
        const { cleanMovieTitle: cleanTitle } = require('../helpers/utils');
        cleanMovieTitle = cleanTitle;
      } catch (importError) {
        console.error('❌ Failed to import required modules:', importError);
        // Fallback: create a simple clean function if import fails
        cleanMovieTitle = (title: string) =>
          title?.replace(/[^a-zA-Z0-9\s]/g, '').trim() || 'Unknown Title';
        console.warn('⚠️ Using fallback cleanMovieTitle function');
      }

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

          console.log(
            `  - Checking folder: ${folderPath}, exists: ${folderExists}`,
          );

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

  async receiveFile(retryCount: number = 0): Promise<string | null> {
    const maxRetries = 3;

    try {
      logger.info(
        `📥 P2PService: Starting file receive process (attempt ${
          retryCount + 1
        }/${maxRetries + 1})...`,
      );

      // Initialize SpredFileService and ensure directories exist
      const spredFileService = SpredFileService.getInstance();
      await spredFileService.initializeDirectories();

      // Get temporary path for receiving the file
      const tempPath = spredFileService.getSafeFilePath(
        'temp_received_file',
        'temp',
      );

      // Check if framework is busy before attempting receive
      if (retryCount > 0) {
        logger.info('🔄 Waiting for framework to be ready...');
        await new Promise(resolve =>
          setTimeout(resolve, 2000 + retryCount * 1000),
        ); // Increasing delay
      }

      try {
        // Automatically accept and receive the file to temp location
        await receiveFile(tempPath, 'auto');
        logger.info('✅ P2PService: File received to temp location:', tempPath);
      } catch (receiveError: any) {
        logger.error('❌ Native receiveFile error:', receiveError);

        // Handle framework busy error with retry
        if (
          receiveError.message &&
          (receiveError.message.includes('framework is busy') ||
            receiveError.message.includes('EADDRINUSE') ||
            receiveError.message.includes('busy') ||
            receiveError.message.includes('operation failed')) &&
          retryCount < maxRetries
        ) {
          logger.warn(
            `⚠️ Framework busy, retrying in ${
              2 + retryCount
            } seconds... (attempt ${retryCount + 1}/${maxRetries})`,
          );

          // Try to clean up any lingering connections
          try {
            await this.cleanupFrameworkState();
          } catch (cleanupError) {
            logger.warn('⚠️ Cleanup error during retry:', cleanupError);
          }

          // Retry with exponential backoff
          return this.receiveFile(retryCount + 1);
        }

        throw receiveError; // Re-throw if it's not a framework busy error or max retries reached
      }

      // Process the received file through SpredFileService
      const result = await this.processReceivedFile(tempPath);

      if (result.success && result.filePath) {
        logger.info(
          '✅ P2PService: File processed successfully:',
          result.filePath,
        );
        this.updateState({ error: null });
        return result.filePath;
      } else {
        logger.error('❌ P2PService: File processing failed:', result.error);
        this.updateState({ error: result.error || 'File processing failed' });
        return null;
      }
    } catch (error: any) {
      logger.error(
        `❌ P2PService: receiveFile error (attempt ${retryCount + 1}):`,
        error,
      );

      // Handle framework busy error with retry
      if (
        error.message &&
        (error.message.includes('framework is busy') ||
          error.message.includes('EADDRINUSE') ||
          error.message.includes('busy') ||
          error.message.includes('operation failed')) &&
        retryCount < maxRetries
      ) {
        logger.warn(
          `⚠️ Framework busy, retrying receive in ${
            2 + retryCount
          } seconds... (attempt ${retryCount + 1}/${maxRetries})`,
        );

        // Try to clean up framework state
        try {
          await this.cleanupFrameworkState();
        } catch (cleanupError) {
          logger.warn('⚠️ Cleanup error during retry:', cleanupError);
        }

        // Retry with exponential backoff
        return this.receiveFile(retryCount + 1);
      }

      // Provide user-friendly error message
      let userFriendlyError = error.message;
      if (error.message && error.message.includes('framework is busy')) {
        userFriendlyError =
          'WiFi Direct is busy. Please wait a moment and try again.';
      } else if (error.message && error.message.includes('operation failed')) {
        userFriendlyError =
          'Transfer failed. Please ensure both devices are connected and try again.';
      }

      this.updateState({ error: userFriendlyError || 'File receive failed' });
      return null;
    }
  }

  /**
   * Clean up framework state to resolve "framework is busy" issues
   */
  private async cleanupFrameworkState(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up framework state...');

      // Stop any ongoing discovery
      if (this.state.isDiscovering) {
        try {
          await this.stopDiscovery();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.warn('⚠️ Error stopping discovery during cleanup:', error);
        }
      }

      // Clear any lingering group connections
      if (this.state.isConnected || this.state.isGroupOwner) {
        try {
          await this.removeGroup();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          logger.warn('⚠️ Error removing group during cleanup:', error);
        }
      }

      // Reset internal state
      this.updateState({
        isDiscovering: false,
        isConnected: false,
        isGroupOwner: false,
        error: null,
      });

      logger.info('✅ Framework state cleanup completed');
    } catch (error) {
      logger.error('❌ Error during framework cleanup:', error);
    }
  }

  private async processReceivedFile(
    tempPath: string,
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const spredFileService = SpredFileService.getInstance();

      // Extract filename from temp path
      const fileName = tempPath.split('/').pop() || 'received_file';

      // Use SpredFileService to handle the received file
      const result = await spredFileService.handleReceivedFile(
        tempPath,
        fileName,
      );

      return result;
    } catch (error: any) {
      logger.error('❌ P2PService: processReceivedFile error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process received file',
      };
    }
  }

  async refreshDeviceList(): Promise<Device[]> {
    try {
      logger.info('🔄 P2PService: Getting available peers...');
      const { devices } = await getAvailablePeers();
      logger.info(
        '🔄 P2PService: Native module returned',
        devices.length,
        'devices',
      );

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
    logger.info(
      '➕ P2PService: Manually adding discovered device:',
      device.deviceName,
    );
    const currentDevices = this.state.discoveredDevices || [];
    const mergedDevices = this.mergeDeviceLists(currentDevices, [device]);
    this.updateState({ discoveredDevices: mergedDevices });
  }

  // Method to keep devices alive (reset their last seen time)
  keepDevicesAlive() {
    const currentDevices = this.state.discoveredDevices || [];
    if (currentDevices.length > 0) {
      logger.info(
        '💓 P2PService: Keeping',
        currentDevices.length,
        'devices alive',
      );
      const refreshedDevices = this.mergeDeviceLists(
        currentDevices,
        currentDevices,
      );
      this.updateState({ discoveredDevices: refreshedDevices });
    }
  }

  getErrorGuidance(errorMessage: string): {
    title: string;
    message: string;
    actions: string[];
  } {
    if (errorMessage.includes('permission')) {
      return {
        title: 'Permission Required',
        message: 'WiFi Direct needs specific permissions to work properly.',
        actions: [
          'Go to Settings → Apps → SPRED → Permissions',
          'Enable "Location" permission (required for device discovery)',
          'Enable "Nearby devices" permission (if available)',
          'Restart the app and try again',
        ],
      };
    }

    if (
      errorMessage.includes('location') ||
      errorMessage.includes('Location')
    ) {
      return {
        title: 'Location Services Required',
        message:
          'WiFi Direct requires location services to discover nearby devices.',
        actions: [
          'Go to Settings → Location',
          'Turn ON location services',
          'Set accuracy to "High accuracy"',
          'Restart the app and try again',
        ],
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
          'Try connecting again',
        ],
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('discover')) {
      return {
        title: 'Discovery Issues',
        message:
          'Unable to find nearby devices. This could be due to several factors.',
        actions: [
          'Make sure both devices are within 30 feet',
          'Check that both devices have WiFi and Location enabled',
          'Restart WiFi on both devices',
          'Try using QR code pairing instead',
          'Ensure no other WiFi Direct connections are active',
        ],
      };
    }

    return {
      title: 'Connection Error',
      message: 'An unexpected error occurred during P2P operation.',
      actions: [
        'Check that both devices support WiFi Direct',
        'Restart the app on both devices',
        'Try moving devices closer together',
        'Contact support if the problem persists',
      ],
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
        error: null,
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
