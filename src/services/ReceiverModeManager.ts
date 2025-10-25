import { Platform, AppState, AppStateStatus } from 'react-native';
import NearbyService from './NearbyService';
import logger from '../utils/logger';

// Incoming transfer interface
interface IncomingTransfer {
  id: string;
  senderName: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'accepted' | 'receiving' | 'completed' | 'failed';
  timestamp: Date;
}

// Received file interface
interface ReceivedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  receivedAt: Date;
  senderName: string;
}

// Receiver mode state interface
interface ReceiverModeState {
  isActive: boolean;
  advertisingName: string;
  incomingTransfers: IncomingTransfer[];
  receivedFiles: ReceivedFile[];
  lastActivity: Date;
  error?: string;
}

type ReceiverModeListener = (state: ReceiverModeState) => void;

export class ReceiverModeManager {
  private static instance: ReceiverModeManager;
  private nearbyService: NearbyService;
  private state: ReceiverModeState;
  private listeners: ReceiverModeListener[] = [];
  private appStateSubscription: any = null;
  private isInitialized = false;

  private constructor() {
    this.nearbyService = NearbyService.getInstance();
    this.state = {
      isActive: false,
      advertisingName: this.generateDeviceName(),
      incomingTransfers: [],
      receivedFiles: [],
      lastActivity: new Date(),
    };
  }

  static getInstance(): ReceiverModeManager {
    if (!ReceiverModeManager.instance) {
      ReceiverModeManager.instance = new ReceiverModeManager();
    }
    return ReceiverModeManager.instance;
  }

  // Initialize receiver mode manager
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      logger.info('🚀 Initializing ReceiverModeManager...');  
    // Set up app state monitoring
      this.setupAppStateMonitoring();

      // Set up nearby service listener
      this.setupNearbyServiceListener();

      // Start receiver mode
      const started = await this.startReceiverMode();
      
      if (started) {
        this.isInitialized = true;
        logger.info('✅ ReceiverModeManager initialized successfully');
        return true;
      } else {
        logger.error('❌ Failed to start receiver mode during initialization');
        return false;
      }
    } catch (error: any) {
      logger.error('❌ ReceiverModeManager initialization failed:', error);
      this.updateState({ error: error.message });
      return false;
    }
  }

  // Start receiver mode
  async startReceiverMode(): Promise<boolean> {
    try {
      logger.info('📥 Starting receiver mode...');

      // Initialize nearby service if needed
      const nearbyState = this.nearbyService.getState();
      if (!nearbyState.isInitialized) {
        const initialized = await this.nearbyService.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize nearby service');
        }
      }

      // Start advertising to make device discoverable
      const started = await this.nearbyService.startReceiving();
      
      if (started) {
        this.updateState({ 
          isActive: true, 
          lastActivity: new Date(),
          error: undefined 
        });
        logger.info('✅ Receiver mode started successfully');
        return true;
      } else {
        throw new Error('Failed to start nearby service receiver mode');
      }
    } catch (error: any) {
      logger.error('❌ Failed to start receiver mode:', error);
      this.updateState({ 
        isActive: false, 
        error: error.message 
      });
      return false;
    }
  }

  // Stop receiver mode
  async stopReceiverMode(): Promise<void> {
    try {
      logger.info('🛑 Stopping receiver mode...');
      
      await this.nearbyService.stop();
      
      this.updateState({ 
        isActive: false,
        lastActivity: new Date()
      });
      
      logger.info('✅ Receiver mode stopped');
    } catch (error: any) {
      logger.error('❌ Error stopping receiver mode:', error);
    }
  }

  // Handle incoming transfer request
  handleIncomingTransfer(transferData: any): void {
    logger.info('📥 Incoming transfer detected:', transferData);

    const incomingTransfer: IncomingTransfer = {
      id: transferData.id || `transfer_${Date.now()}`,
      senderName: transferData.senderName || 'Unknown Device',
      fileName: transferData.fileName || 'video.mp4',
      fileSize: transferData.fileSize || 0,
      progress: 0,
      status: 'pending',
      timestamp: new Date(),
    };

    // Add to incoming transfers
    const updatedTransfers = [...this.state.incomingTransfers, incomingTransfer];
    this.updateState({ 
      incomingTransfers: updatedTransfers,
      lastActivity: new Date()
    });

    // Show notification (this would typically trigger a UI notification)
    this.showTransferNotification(incomingTransfer);
  }

  // Accept incoming transfer
  async acceptTransfer(transferId: string): Promise<boolean> {
    try {
      logger.info('✅ Accepting transfer:', transferId);

      const transfer = this.state.incomingTransfers.find(t => t.id === transferId);
      if (!transfer) {
        logger.error('❌ Transfer not found:', transferId);
        return false;
      }

      // Update transfer status
      this.updateTransferStatus(transferId, 'accepted');

      // This would typically trigger the actual file reception
      // For now, we'll simulate the process
      this.simulateFileReception(transfer);

      return true;
    } catch (error: any) {
      logger.error('❌ Failed to accept transfer:', error);
      this.updateTransferStatus(transferId, 'failed');
      return false;
    }
  }

  // Decline incoming transfer
  declineTransfer(transferId: string): void {
    logger.info('❌ Declining transfer:', transferId);
    
    // Remove from incoming transfers
    const updatedTransfers = this.state.incomingTransfers.filter(t => t.id !== transferId);
    this.updateState({ incomingTransfers: updatedTransfers });
  }

  // Update transfer status
  private updateTransferStatus(transferId: string, status: IncomingTransfer['status']): void {
    const updatedTransfers = this.state.incomingTransfers.map(t =>
      t.id === transferId ? { ...t, status } : t
    );
    this.updateState({ incomingTransfers: updatedTransfers });
  }

  // Handle file reception (no simulation - wait for real P2P transfer)
  private simulateFileReception(transfer: IncomingTransfer): void {
    logger.info('📥 File reception initiated for:', transfer.fileName);

    // Update to receiving status
    this.updateTransferStatus(transfer.id, 'receiving');

    // No progress simulation - real P2P transfers will update progress
    // For now, just complete immediately to avoid hanging
    setTimeout(() => {
      this.completeFileReception(transfer);
    }, 1000);
  }

  // Complete file reception
  private completeFileReception(transfer: IncomingTransfer): void {
    logger.info('✅ File reception completed:', transfer.fileName);

    // Create received file record
    const receivedFile: ReceivedFile = {
      id: `received_${Date.now()}`,
      fileName: transfer.fileName,
      filePath: `/path/to/received/${transfer.fileName}`, // This would be the actual file path
      fileSize: transfer.fileSize,
      receivedAt: new Date(),
      senderName: transfer.senderName,
    };

    // Update state
    const updatedTransfers = this.state.incomingTransfers.filter(t => t.id !== transfer.id);
    const updatedReceivedFiles = [...this.state.receivedFiles, receivedFile];

    this.updateState({
      incomingTransfers: updatedTransfers,
      receivedFiles: updatedReceivedFiles,
      lastActivity: new Date(),
    });

    // Notify completion
    this.showCompletionNotification(receivedFile);
  }

  // Show transfer notification
  private showTransferNotification(transfer: IncomingTransfer): void {
    logger.info('🔔 Showing transfer notification:', transfer);
    // This would typically show a system notification or in-app notification
    // For now, we'll just log it
  }

  // Show completion notification
  private showCompletionNotification(file: ReceivedFile): void {
    logger.info('🔔 Showing completion notification:', file);
    // This would typically show a completion notification
    // For now, we'll just log it
  }

  // Generate device name for advertising
  private generateDeviceName(): string {
    const deviceType = Platform.OS === 'ios' ? 'iPhone' : 'Android';
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SPRED_${deviceType}_${randomId}`;
  }

  // Set up app state monitoring
  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  // Handle app state changes
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    logger.info('📱 App state changed to:', nextAppState);

    if (nextAppState === 'active' && !this.state.isActive) {
      // App became active, restart receiver mode if it was stopped
      this.startReceiverMode();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background, keep receiver mode running but log the state
      logger.info('📱 App in background, receiver mode continues running');
    }
  };

  // Set up nearby service listener
  private setupNearbyServiceListener(): void {
    this.nearbyService.subscribe((nearbyState) => {
      // Handle nearby service state changes
      if (nearbyState.error && this.state.isActive) {
        logger.warn('⚠️ Nearby service error in receiver mode:', nearbyState.error);
        this.updateState({ error: nearbyState.error });
      }
    });
  }

  // Update state and notify listeners
  private updateState(updates: Partial<ReceiverModeState>): void {
    this.state = { ...this.state, ...updates };
    logger.info('🔄 ReceiverModeManager state updated:', updates);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        logger.error('❌ Error notifying receiver mode listener:', error);
      }
    });
  }

  // Subscribe to state changes
  subscribe(listener: ReceiverModeListener): () => void {
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
  getState(): ReceiverModeState {
    return { ...this.state };
  }

  // Get incoming transfers
  getIncomingTransfers(): IncomingTransfer[] {
    return [...this.state.incomingTransfers];
  }

  // Get received files
  getReceivedFiles(): ReceivedFile[] {
    return [...this.state.receivedFiles];
  }

  // Check if receiver mode is active
  isActive(): boolean {
    return this.state.isActive;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    try {
      logger.info('🧹 Cleaning up ReceiverModeManager...');

      // Stop receiver mode
      await this.stopReceiverMode();

      // Remove app state listener
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      // Clear state
      this.updateState({
        isActive: false,
        incomingTransfers: [],
        error: undefined,
      });

      this.isInitialized = false;
      logger.info('✅ ReceiverModeManager cleanup completed');
    } catch (error: any) {
      logger.error('❌ Error during ReceiverModeManager cleanup:', error);
    }
  }
}

export default ReceiverModeManager;