import { Platform } from 'react-native';
import NearbyService, { NearbyDevice, FileTransferProgress } from './NearbyService';
import QRFallbackService, { QRShareData } from './QRFallbackService';
import logger from '../utils/logger';

// Error context interface for detailed debugging
interface ErrorContext {
  operation: string;
  component: string;
  timestamp: number;
  platform: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
    nativeError?: any;
  };
  context: {
    videoPath?: string;
    method?: string;
    state?: any;
    permissions?: any;
  };
}

export interface ShareResult {
  success: boolean;
  method: 'nearby' | 'qr_cloud' | 'qr_local';
  deviceName?: string;
  deviceId?: string;
  qrData?: string;
  downloadUrl?: string;
  error?: string;
  duration?: number; // milliseconds
}

export interface SharingState {
  isSharing: boolean;
  isReceiving: boolean;
  currentMethod: 'nearby' | 'qr_fallback' | null;
  discoveredDevices: NearbyDevice[];
  transferProgress?: FileTransferProgress;
  qrData?: string;
  status: string;
  error?: string;
}

type SharingStateListener = (state: SharingState) => void;

export class CrossPlatformSharingService {
  private static instance: CrossPlatformSharingService;
  private nearbyService: NearbyService;
  private qrFallbackService: QRFallbackService;
  private state: SharingState;
  private listeners: SharingStateListener[] = [];
  private shareStartTime: number = 0;

  private constructor() {
    this.nearbyService = NearbyService.getInstance();
    this.qrFallbackService = QRFallbackService.getInstance();
    
    this.state = {
      isSharing: false,
      isReceiving: false,
      currentMethod: null,
      discoveredDevices: [],
      status: 'Ready'
    };

    this.setupNearbyServiceListener();
  }

  static getInstance(): CrossPlatformSharingService {
    if (!CrossPlatformSharingService.instance) {
      CrossPlatformSharingService.instance = new CrossPlatformSharingService();
    }
    return CrossPlatformSharingService.instance;
  }

  // Subscribe to sharing state changes
  subscribe(listener: SharingStateListener): () => void {
    this.listeners.push(listener);
    listener(this.state); // Send current state immediately
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get nearby service instance for direct testing
  getNearbyService(): NearbyService {
    return this.nearbyService;
  }

  private updateState(updates: Partial<SharingState>) {
    this.state = { ...this.state, ...updates };
    logger.info('🔄 CrossPlatformSharing state updated:', updates);
    
    // Notify all listeners with error handling
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        const errorContext = this.createErrorContext('listener_notification', error as Error, {
          updates,
          currentState: this.state
        });
        logger.error('❌ Error notifying sharing listener:', errorContext);
      }
    });
  }

  // Create detailed error context for debugging
  private createErrorContext(operation: string, error: Error, context: any = {}): ErrorContext {
    return {
      operation,
      component: 'CrossPlatformSharingService',
      timestamp: Date.now(),
      platform: Platform.OS,
      error: {
        message: error.message || 'Unknown error',
        stack: error.stack,
        code: (error as any).code,
        nativeError: (error as any).nativeError
      },
      context: {
        ...context,
        currentState: this.state,
        nearbyServiceState: this.nearbyService.getState()
      }
    };
  }

  // Get user-friendly error message based on error context
  private getUserFriendlyErrorMessage(errorContext: ErrorContext): string {
    const { operation, error } = errorContext;
    
    if (operation === 'permission_check' || error.message.includes('permission')) {
      return 'Unable to access device permissions. The app will use test mode instead.';
    }
    
    if (operation === 'nearby_init' || error.message.includes('initialization')) {
      return 'Nearby sharing is not available on this device. Using QR code sharing instead.';
    }
    
    if (operation === 'device_discovery' || error.message.includes('timeout')) {
      return 'No nearby devices found. Using QR code sharing instead.';
    }
    
    if (error.message.includes('null') || error.message.includes('undefined')) {
      return 'System error detected. The app will use test mode instead.';
    }
    
    return 'Something went wrong, but you can still test the sharing features using QR codes.';
  }

  // Setup listener for Nearby service state changes
  private setupNearbyServiceListener() {
    this.nearbyService.subscribe((nearbyState) => {
      this.updateState({
        discoveredDevices: nearbyState.discoveredDevices,
        transferProgress: nearbyState.currentTransfer,
        error: nearbyState.error
      });
    });
  }

  // Main method: Share video with automatic fallback
  async shareVideo(videoPath: string): Promise<ShareResult> {
    try {
      this.shareStartTime = Date.now();
      logger.info('🚀 Starting cross-platform video sharing:', videoPath);
      
      this.updateState({
        isSharing: true,
        currentMethod: 'nearby',
        status: 'Looking for nearby devices...',
        error: undefined
      });

      // Method 1: Try Nearby API first (10 second timeout)
      const nearbyResult = await this.tryNearbySharing(videoPath, 10000);
      if (nearbyResult.success) {
        return nearbyResult;
      }

      logger.info('📱 Nearby sharing failed, trying QR fallback...');
      
      // Method 2: Fallback to QR code sharing
      this.updateState({
        currentMethod: 'qr_fallback',
        status: 'Generating QR code for sharing...'
      });

      const qrResult = await this.tryQRFallback(videoPath);
      return qrResult;

    } catch (error: any) {
      logger.error('❌ Video sharing failed completely:', error);
      
      const failureResult: ShareResult = {
        success: false,
        method: 'nearby',
        error: error.message || 'Sharing failed',
        duration: Date.now() - this.shareStartTime
      };

      this.updateState({
        isSharing: false,
        currentMethod: null,
        status: 'Sharing failed',
        error: failureResult.error
      });

      return failureResult;
    }
  }

  // Try sharing via Nearby API with enhanced error handling
  private async tryNearbySharing(videoPath: string, timeoutMs: number): Promise<ShareResult> {
    try {
      logger.info('📡 Attempting Nearby API sharing with enhanced error handling...');

      // Initialize Nearby service if needed with safe error handling
      const currentState = this.nearbyService.getState();
      if (!currentState.isInitialized) {
        logger.info('🔧 Initializing Nearby service safely...');
        
        try {
          const initialized = await this.nearbyService.initialize();
          if (!initialized) {
            const updatedState = this.nearbyService.getState();
            const errorMsg = updatedState.error || 'Failed to initialize Nearby service';
            const reason = updatedState.initializationReason || 'Unknown initialization failure';
            
            logger.warn('⚠️ Nearby service initialization failed:', { errorMsg, reason });
            
            // Check if we're in mock mode due to fallback
            if (updatedState.initializationMode === 'mock') {
              logger.info('📱 Continuing with mock mode after fallback');
              // Continue with mock mode - don't throw error
            } else {
              throw new Error(`${errorMsg} (${reason})`);
            }
          }
        } catch (initError: any) {
          logger.error('❌ Critical error during Nearby service initialization:', initError);
          
          // Provide detailed error information
          const detailedError = {
            message: initError.message || 'Initialization failed',
            type: 'initialization_error',
            platform: Platform.OS,
            timestamp: new Date().toISOString()
          };
          
          throw new Error(`Nearby API initialization failed: ${detailedError.message}`);
        }
      }

      // Check the final state after initialization
      const finalState = this.nearbyService.getState();
      if (finalState.initializationMode === 'mock') {
        logger.info('📱 Using mock mode for nearby sharing');
        this.updateState({
          status: `Using test mode: ${finalState.initializationReason || 'Mock mode active'}`
        });
      }

      // Start discovery with timeout and enhanced error handling
      try {
        const discoveryPromise = this.discoverAndConnect(videoPath);
        const timeoutPromise = new Promise<ShareResult>((_, reject) => 
          setTimeout(() => reject(new Error('Nearby sharing timeout - no devices found within time limit')), timeoutMs)
        );

        const result = await Promise.race([discoveryPromise, timeoutPromise]);
        
        this.updateState({
          isSharing: false,
          currentMethod: null,
          status: 'Video sent successfully!'
        });

        return result;
      } catch (discoveryError: any) {
        logger.error('❌ Discovery and connection failed:', discoveryError);
        throw new Error(`Device discovery failed: ${discoveryError.message}`);
      }

    } catch (error: any) {
      logger.error('❌ Nearby sharing failed with detailed context:', {
        error: error.message,
        stack: error.stack,
        videoPath,
        timeoutMs,
        timestamp: new Date().toISOString()
      });

      // Provide user-friendly error message based on error type
      let userFriendlyError = error.message || 'Nearby sharing failed';
      if (error.message?.includes('permission')) {
        userFriendlyError = 'Permission denied - using QR code sharing instead';
      } else if (error.message?.includes('timeout')) {
        userFriendlyError = 'No nearby devices found - using QR code sharing instead';
      } else if (error.message?.includes('initialization')) {
        userFriendlyError = 'Nearby sharing not available - using QR code sharing instead';
      }

      return {
        success: false,
        method: 'nearby',
        error: userFriendlyError,
        duration: Date.now() - this.shareStartTime
      };
    }
  }

  // Discover devices and connect
  private async discoverAndConnect(videoPath: string): Promise<ShareResult> {
    // Start discovery
    await this.nearbyService.startDiscovery();
    
    // Wait for devices to be discovered
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds with 500ms intervals
    
    while (attempts < maxAttempts) {
      const devices = this.nearbyService.getDiscoveredDevices();
      
      if (devices.length > 0) {
        // Try to connect to the first available device
        const targetDevice = devices.find(d => d.status === 'discovered');
        
        if (targetDevice) {
          logger.info('🔗 Attempting to connect to:', targetDevice.name);
          
          const connected = await this.nearbyService.connectToDevice(targetDevice.id);
          if (connected) {
            // Send the file
            this.updateState({ status: `Sending video to ${targetDevice.name}...` });
            
            const sent = await this.nearbyService.sendFile(videoPath, targetDevice.id);
            if (sent) {
              return {
                success: true,
                method: 'nearby',
                deviceName: targetDevice.name,
                deviceId: targetDevice.id,
                duration: Date.now() - this.shareStartTime
              };
            }
          }
        }
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    throw new Error('No devices found or connection failed');
  }

  // Try QR code fallback
  private async tryQRFallback(videoPath: string): Promise<ShareResult> {
    try {
      logger.info('📱 Attempting QR fallback sharing...');

      // Generate QR code (prefer local server for speed)
      const qrResult = await this.qrFallbackService.generateQRForVideo(videoPath, 'local_server');
      
      if (!qrResult.success) {
        throw new Error(qrResult.error || 'Failed to generate QR code');
      }

      this.updateState({
        qrData: qrResult.qrData,
        status: 'QR code ready - scan from receiving device'
      });

      const result: ShareResult = {
        success: true,
        method: 'qr_local',
        qrData: qrResult.qrData,
        downloadUrl: qrResult.downloadUrl,
        duration: Date.now() - this.shareStartTime
      };

      this.updateState({
        isSharing: false,
        currentMethod: null
      });

      return result;
    } catch (error: any) {
      logger.error('❌ QR fallback failed:', error);
      logger.error('❌ QR Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        toString: error.toString()
      });
      return {
        success: false,
        method: 'qr_local',
        error: error.message || error.toString() || 'QR fallback failed',
        duration: Date.now() - this.shareStartTime
      };
    }
  }

  // Start receiver mode
  async startReceiver(): Promise<boolean> {
    try {
      logger.info('📥 Starting receiver mode...');
      
      this.updateState({
        isReceiving: true,
        status: 'Ready to receive videos from nearby devices'
      });

      // Start Nearby service in receiver mode
      const nearbyStarted = await this.nearbyService.startReceiving();
      
      if (nearbyStarted) {
        logger.info('✅ Receiver mode started successfully');
        return true;
      } else {
        throw new Error('Failed to start Nearby receiver');
      }
    } catch (error: any) {
      logger.error('❌ Failed to start receiver mode:', error);
      this.updateState({
        isReceiving: false,
        status: 'Failed to start receiver mode',
        error: error.message
      });
      return false;
    }
  }

  // Stop receiver mode
  async stopReceiver(): Promise<void> {
    try {
      logger.info('🛑 Stopping receiver mode...');
      
      await this.nearbyService.stop();
      
      this.updateState({
        isReceiving: false,
        status: 'Receiver stopped'
      });
      
      logger.info('✅ Receiver mode stopped');
    } catch (error: any) {
      logger.error('❌ Error stopping receiver mode:', error);
    }
  }

  // Process scanned QR code
  async processQRCode(qrString: string): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      logger.info('🔍 Processing scanned QR code...');
      
      this.updateState({
        status: 'Processing QR code...'
      });

      const result = await this.qrFallbackService.processQRCode(qrString);
      
      if (result.success) {
        this.updateState({
          status: 'Video received successfully!'
        });
      } else {
        this.updateState({
          status: 'Failed to process QR code',
          error: result.error
        });
      }

      return result;
    } catch (error: any) {
      logger.error('❌ Error processing QR code:', error);
      
      this.updateState({
        status: 'QR code processing failed',
        error: error.message
      });

      return {
        success: false,
        error: error.message || 'Failed to process QR code'
      };
    }
  }

  // Get current sharing state
  getState(): SharingState {
    return { ...this.state };
  }

  // Check if currently sharing
  isSharing(): boolean {
    return this.state.isSharing;
  }

  // Check if currently receiving
  isReceiving(): boolean {
    return this.state.isReceiving;
  }

  // Get discovered devices
  getDiscoveredDevices(): NearbyDevice[] {
    return [...this.state.discoveredDevices];
  }

  // Cleanup all services
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up CrossPlatformSharingService...');
      
      await Promise.all([
        this.nearbyService.stop(),
        this.qrFallbackService.cleanup()
      ]);
      
      this.updateState({
        isSharing: false,
        isReceiving: false,
        currentMethod: null,
        discoveredDevices: [],
        transferProgress: undefined,
        qrData: undefined,
        status: 'Ready',
        error: undefined
      });
      
      logger.info('✅ CrossPlatformSharingService cleanup completed');
    } catch (error: any) {
      logger.error('❌ Error during cleanup:', error);
    }
  }
}

export default CrossPlatformSharingService;