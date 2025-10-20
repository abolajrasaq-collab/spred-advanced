import logger from '../utils/logger';
import { P2PService, P2PServiceState, Device, WifiP2pInfo, GroupInfo } from './P2PService';

export interface HotspotStatus {
  isActive: boolean;
  mode: 'wifi-direct' | 'hotspot-fallback' | 'disabled';
  groupInfo: GroupInfo | null;
  discoveryState: 'idle' | 'discovering' | 'advertising';
  connectionCount: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  serviceHealth: 'healthy' | 'degraded' | 'unhealthy';
}

export interface DiagnosticReport {
  timestamp: Date;
  hotspotStatus: HotspotStatus;
  validationResult: ValidationResult;
  p2pServiceState: P2PServiceState;
  systemChecks: {
    permissions: boolean;
    wifiEnabled: boolean;
    locationEnabled: boolean;
    wifiDirectSupport: boolean;
  };
  performance: {
    initializationTime?: number;
    discoveryTime?: number;
    connectionTime?: number;
  };
  errorHistory: string[];
}

export interface StatusReport {
  summary: {
    hotspotActive: boolean;
    mode: string;
    deviceCount: number;
    lastError?: string;
  };
  details: {
    p2pService: P2PServiceState;
    permissions: boolean;
    networkState: {
      wifiEnabled: boolean;
      locationEnabled: boolean;
      hotspotEnabled: boolean;
    };
  };
  diagnostics: string[];
  timestamp: Date;
}

export type StatusCallback = (status: HotspotStatus) => void;
export type Unsubscribe = () => void;

export class HotspotStatusChecker {
  private static instance: HotspotStatusChecker;
  private p2pService: P2PService;
  private statusCallbacks: StatusCallback[] = [];
  private currentStatus: HotspotStatus;
  private errorHistory: string[] = [];
  private performanceMetrics: { [key: string]: number } = {};

  private constructor() {
    this.p2pService = P2PService.getInstance();
    this.currentStatus = {
      isActive: false,
      mode: 'disabled',
      groupInfo: null,
      discoveryState: 'idle',
      connectionCount: 0,
    };
    
    // Subscribe to P2P service state changes
    this.p2pService.subscribe(this.handleP2PStateChange.bind(this));
  }

  static getInstance(): HotspotStatusChecker {
    if (!HotspotStatusChecker.instance) {
      HotspotStatusChecker.instance = new HotspotStatusChecker();
    }
    return HotspotStatusChecker.instance;
  }

  /**
   * Check the current hotspot status by analyzing P2P group state
   * Requirements: 1.1, 1.5
   */
  async checkHotspotStatus(): Promise<HotspotStatus> {
    try {
      logger.info('🔍 HotspotStatusChecker: Checking hotspot status...');
      
      const p2pState = this.p2pService.getState();
      const groupInfo = await this.p2pService.getGroupInfo();
      
      // Determine if hotspot is active
      const isActive = p2pState.isInitialized && 
                      (p2pState.isGroupOwner || p2pState.isConnected || p2pState.isDiscovering);
      
      // Determine mode
      let mode: 'wifi-direct' | 'hotspot-fallback' | 'disabled' = 'disabled';
      if (isActive) {
        if (p2pState.isGroupOwner || groupInfo) {
          mode = 'wifi-direct';
        } else {
          // Check if using hotspot fallback
          const hotspotEnabled = await this.p2pService.checkHotspotStatus();
          mode = hotspotEnabled ? 'hotspot-fallback' : 'wifi-direct';
        }
      }
      
      // Determine discovery state
      let discoveryState: 'idle' | 'discovering' | 'advertising' = 'idle';
      if (p2pState.isDiscovering) {
        discoveryState = 'discovering';
      } else if (p2pState.isGroupOwner || groupInfo) {
        discoveryState = 'advertising';
      }
      
      // Count connections
      const connectionCount = p2pState.discoveredDevices?.length || 0;
      
      this.currentStatus = {
        isActive,
        mode,
        groupInfo,
        discoveryState,
        connectionCount,
        error: p2pState.error || undefined,
      };
      
      logger.info('🔍 HotspotStatusChecker: Status checked:', this.currentStatus);
      return this.currentStatus;
      
    } catch (error: any) {
      logger.error('❌ HotspotStatusChecker: Error checking status:', error);
      this.currentStatus = {
        isActive: false,
        mode: 'disabled',
        groupInfo: null,
        discoveryState: 'idle',
        connectionCount: 0,
        error: error.message,
      };
      return this.currentStatus;
    }
  }

  /**
   * Validate P2P service health and configuration
   * Requirements: 1.1, 1.5
   */
  async validateP2PService(): Promise<ValidationResult> {
    try {
      logger.info('🔍 HotspotStatusChecker: Validating P2P service...');
      
      const issues: string[] = [];
      const recommendations: string[] = [];
      const p2pState = this.p2pService.getState();
      
      // Check initialization
      if (!p2pState.isInitialized) {
        issues.push('P2P service is not initialized');
        recommendations.push('Initialize P2P service before using hotspot functionality');
      }
      
      // Check permissions
      if (!p2pState.hasPermissions) {
        issues.push('Required permissions not granted');
        recommendations.push('Grant location and nearby devices permissions');
      }
      
      // Check WiFi
      if (!p2pState.isWifiEnabled) {
        issues.push('WiFi is not enabled');
        recommendations.push('Enable WiFi to use hotspot functionality');
      }
      
      // Check location
      if (!p2pState.isLocationEnabled) {
        issues.push('Location services are not enabled');
        recommendations.push('Enable location services for device discovery');
      }
      
      // Check for errors
      if (p2pState.error) {
        issues.push(`Service error: ${p2pState.error}`);
        recommendations.push('Resolve service errors before proceeding');
      }
      
      // Determine service health
      let serviceHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (issues.length === 0) {
        serviceHealth = 'healthy';
      } else if (issues.length <= 2) {
        serviceHealth = 'degraded';
      } else {
        serviceHealth = 'unhealthy';
      }
      
      const result: ValidationResult = {
        isValid: issues.length === 0,
        issues,
        recommendations,
        serviceHealth,
      };
      
      logger.info('🔍 HotspotStatusChecker: Validation result:', result);
      return result;
      
    } catch (error: any) {
      logger.error('❌ HotspotStatusChecker: Error validating service:', error);
      return {
        isValid: false,
        issues: [`Validation error: ${error.message}`],
        recommendations: ['Check service configuration and try again'],
        serviceHealth: 'unhealthy',
      };
    }
  }

  /**
   * Get detailed status information for comprehensive reporting
   * Requirements: 1.1, 1.5
   */
  async getDetailedStatus(): Promise<StatusReport> {
    try {
      logger.info('🔍 HotspotStatusChecker: Getting detailed status...');
      
      const hotspotStatus = await this.checkHotspotStatus();
      const p2pState = this.p2pService.getState();
      const validation = await this.validateP2PService();
      
      // Check network state
      const wifiEnabled = p2pState.isWifiEnabled;
      const locationEnabled = p2pState.isLocationEnabled;
      const hotspotEnabled = await this.p2pService.checkHotspotStatus();
      
      const report: StatusReport = {
        summary: {
          hotspotActive: hotspotStatus.isActive,
          mode: hotspotStatus.mode,
          deviceCount: hotspotStatus.connectionCount,
          lastError: hotspotStatus.error,
        },
        details: {
          p2pService: p2pState,
          permissions: p2pState.hasPermissions,
          networkState: {
            wifiEnabled,
            locationEnabled,
            hotspotEnabled,
          },
        },
        diagnostics: validation.issues,
        timestamp: new Date(),
      };
      
      logger.info('🔍 HotspotStatusChecker: Detailed status generated');
      return report;
      
    } catch (error: any) {
      logger.error('❌ HotspotStatusChecker: Error getting detailed status:', error);
      
      // Return minimal error report
      return {
        summary: {
          hotspotActive: false,
          mode: 'disabled',
          deviceCount: 0,
          lastError: error.message,
        },
        details: {
          p2pService: this.p2pService.getState(),
          permissions: false,
          networkState: {
            wifiEnabled: false,
            locationEnabled: false,
            hotspotEnabled: false,
          },
        },
        diagnostics: [`Error generating status: ${error.message}`],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Handle P2P service state changes and update hotspot status
   */
  private handleP2PStateChange(p2pState: P2PServiceState) {
    logger.info('🔄 HotspotStatusChecker: P2P state changed, updating status...');
    
    // Update error history
    if (p2pState.error && !this.errorHistory.includes(p2pState.error)) {
      this.errorHistory.push(p2pState.error);
      // Keep only last 10 errors
      if (this.errorHistory.length > 10) {
        this.errorHistory = this.errorHistory.slice(-10);
      }
    }
    
    // Trigger status update
    this.checkHotspotStatus().then(status => {
      this.notifyStatusCallbacks(status);
    }).catch(error => {
      logger.error('❌ HotspotStatusChecker: Error updating status:', error);
    });
  }

  /**
   * Subscribe to status changes with callback system
   * Requirements: 4.1, 4.2
   */
  subscribeToStatusChanges(callback: StatusCallback): Unsubscribe {
    logger.info('📡 HotspotStatusChecker: Adding status change subscriber');
    
    this.statusCallbacks.push(callback);
    
    // Immediately notify with current status
    this.checkHotspotStatus().then(status => {
      callback(status);
    }).catch(error => {
      logger.error('❌ HotspotStatusChecker: Error getting initial status for subscriber:', error);
    });
    
    // Return unsubscribe function
    return () => {
      const index = this.statusCallbacks.indexOf(callback);
      if (index > -1) {
        this.statusCallbacks.splice(index, 1);
        logger.info('📡 HotspotStatusChecker: Status change subscriber removed');
      }
    };
  }

  /**
   * Start automatic status refresh mechanism
   * Requirements: 4.1, 4.2
   */
  private statusRefreshInterval: NodeJS.Timeout | null = null;
  
  startAutomaticStatusRefresh(intervalMs: number = 5000) {
    logger.info(`🔄 HotspotStatusChecker: Starting automatic status refresh (${intervalMs}ms interval)`);
    
    // Clear any existing interval
    this.stopAutomaticStatusRefresh();
    
    this.statusRefreshInterval = setInterval(async () => {
      try {
        const status = await this.checkHotspotStatus();
        
        // Only notify if status has changed significantly
        if (this.hasStatusChanged(status)) {
          logger.info('🔄 HotspotStatusChecker: Status changed, notifying subscribers');
          this.notifyStatusCallbacks(status);
        }
      } catch (error) {
        logger.error('❌ HotspotStatusChecker: Error during automatic status refresh:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic status refresh mechanism
   */
  stopAutomaticStatusRefresh() {
    if (this.statusRefreshInterval) {
      clearInterval(this.statusRefreshInterval);
      this.statusRefreshInterval = null;
      logger.info('🛑 HotspotStatusChecker: Automatic status refresh stopped');
    }
  }

  /**
   * Detect if status has changed significantly
   */
  private previousStatus: HotspotStatus | null = null;
  
  private hasStatusChanged(newStatus: HotspotStatus): boolean {
    if (!this.previousStatus) {
      this.previousStatus = { ...newStatus };
      return true;
    }
    
    const changed = 
      this.previousStatus.isActive !== newStatus.isActive ||
      this.previousStatus.mode !== newStatus.mode ||
      this.previousStatus.discoveryState !== newStatus.discoveryState ||
      this.previousStatus.connectionCount !== newStatus.connectionCount ||
      this.previousStatus.error !== newStatus.error;
    
    if (changed) {
      this.previousStatus = { ...newStatus };
    }
    
    return changed;
  }

  /**
   * Force a status update and notify all subscribers
   * Requirements: 4.1, 4.2
   */
  async forceStatusUpdate(): Promise<HotspotStatus> {
    logger.info('🔄 HotspotStatusChecker: Forcing status update...');
    
    const status = await this.checkHotspotStatus();
    this.notifyStatusCallbacks(status);
    
    return status;
  }

  /**
   * Get current cached status without performing new checks
   */
  getCurrentStatus(): HotspotStatus {
    return { ...this.currentStatus };
  }

  /**
   * Run comprehensive diagnostics for hotspot functionality
   * Requirements: 3.1, 3.4, 3.5
   */
  async runDiagnostics(): Promise<DiagnosticReport> {
    logger.info('🔍 HotspotStatusChecker: Running comprehensive diagnostics...');
    
    const startTime = Date.now();
    
    try {
      // Get current status and validation
      const hotspotStatus = await this.checkHotspotStatus();
      const validationResult = await this.validateP2PService();
      const p2pServiceState = this.p2pService.getState();
      
      // Run system checks
      const systemChecks = await this.runSystemChecks();
      
      // Collect performance metrics
      const performance = { ...this.performanceMetrics };
      
      const report: DiagnosticReport = {
        timestamp: new Date(),
        hotspotStatus,
        validationResult,
        p2pServiceState,
        systemChecks,
        performance,
        errorHistory: [...this.errorHistory],
      };
      
      const diagnosticTime = Date.now() - startTime;
      logger.info(`🔍 HotspotStatusChecker: Diagnostics completed in ${diagnosticTime}ms`);
      
      return report;
      
    } catch (error: any) {
      logger.error('❌ HotspotStatusChecker: Error running diagnostics:', error);
      
      // Return minimal error report
      return {
        timestamp: new Date(),
        hotspotStatus: this.currentStatus,
        validationResult: {
          isValid: false,
          issues: [`Diagnostic error: ${error.message}`],
          recommendations: ['Check service configuration and try again'],
          serviceHealth: 'unhealthy',
        },
        p2pServiceState: this.p2pService.getState(),
        systemChecks: {
          permissions: false,
          wifiEnabled: false,
          locationEnabled: false,
          wifiDirectSupport: false,
        },
        performance: {},
        errorHistory: [...this.errorHistory],
      };
    }
  }

  /**
   * Generate comprehensive status report with detailed information
   * Requirements: 3.1, 3.4, 3.5
   */
  async generateStatusReport(): Promise<StatusReport> {
    logger.info('📊 HotspotStatusChecker: Generating comprehensive status report...');
    
    try {
      const detailedStatus = await this.getDetailedStatus();
      const diagnosticReport = await this.runDiagnostics();
      
      // Enhance the status report with diagnostic information
      const enhancedReport: StatusReport = {
        ...detailedStatus,
        diagnostics: [
          ...detailedStatus.diagnostics,
          `Service Health: ${diagnosticReport.validationResult.serviceHealth}`,
          `WiFi Direct Support: ${diagnosticReport.systemChecks.wifiDirectSupport ? 'Yes' : 'No'}`,
          `Error History: ${diagnosticReport.errorHistory.length} errors recorded`,
        ],
      };
      
      logger.info('📊 HotspotStatusChecker: Status report generated successfully');
      return enhancedReport;
      
    } catch (error: any) {
      logger.error('❌ HotspotStatusChecker: Error generating status report:', error);
      
      // Fallback to basic detailed status
      return this.getDetailedStatus();
    }
  }

  /**
   * Analyze errors and provide actionable guidance
   * Requirements: 3.1, 3.4, 3.5
   */
  generateErrorGuidance(error?: string): { title: string; message: string; actions: string[]; canAutoFix: boolean } {
    const errorToAnalyze = error || this.currentStatus.error || 'Unknown error';
    
    logger.info('🔍 HotspotStatusChecker: Generating error guidance for:', errorToAnalyze);
    
    // Use P2P service's error guidance as base
    const baseGuidance = this.p2pService.getErrorGuidance(errorToAnalyze);
    
    // Enhance with hotspot-specific guidance
    if (errorToAnalyze.includes('hotspot') || errorToAnalyze.includes('group')) {
      return {
        title: 'Hotspot Configuration Issue',
        message: 'There is an issue with the WiFi Direct hotspot configuration.',
        actions: [
          'Check that WiFi hotspot is disabled in system settings',
          'Ensure WiFi Direct is supported on this device',
          'Try restarting the WiFi service',
          'Create a new WiFi Direct group',
          ...baseGuidance.actions,
        ],
        canAutoFix: true,
      };
    }
    
    if (errorToAnalyze.includes('discovery') || errorToAnalyze.includes('timeout')) {
      return {
        title: 'Device Discovery Problem',
        message: 'Unable to discover nearby devices for hotspot connection.',
        actions: [
          'Ensure both devices are within 30 feet of each other',
          'Check that both devices have the app open and active',
          'Verify that both devices support WiFi Direct',
          'Try restarting device discovery',
          ...baseGuidance.actions,
        ],
        canAutoFix: true,
      };
    }
    
    // Return enhanced base guidance
    return {
      ...baseGuidance,
      canAutoFix: false,
    };
  }

  /**
   * Run system checks for hotspot functionality
   */
  private async runSystemChecks(): Promise<{
    permissions: boolean;
    wifiEnabled: boolean;
    locationEnabled: boolean;
    wifiDirectSupport: boolean;
  }> {
    try {
      const p2pState = this.p2pService.getState();
      
      // Check WiFi Direct support
      const wifiDirectSupport = await this.p2pService.checkWifiDirectSupport();
      
      return {
        permissions: p2pState.hasPermissions,
        wifiEnabled: p2pState.isWifiEnabled,
        locationEnabled: p2pState.isLocationEnabled,
        wifiDirectSupport,
      };
    } catch (error: any) {
      logger.error('❌ HotspotStatusChecker: Error running system checks:', error);
      return {
        permissions: false,
        wifiEnabled: false,
        locationEnabled: false,
        wifiDirectSupport: false,
      };
    }
  }

  /**
   * Record performance metrics for diagnostic purposes
   */
  recordPerformanceMetric(metric: string, value: number) {
    this.performanceMetrics[metric] = value;
    logger.debug(`📊 HotspotStatusChecker: Recorded performance metric ${metric}: ${value}ms`);
  }

  /**
   * Get error history for troubleshooting
   */
  getErrorHistory(): string[] {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearErrorHistory() {
    this.errorHistory = [];
    logger.info('🧹 HotspotStatusChecker: Error history cleared');
  }

  /**
   * Notify all status callbacks of status changes
   */
  private notifyStatusCallbacks(status: HotspotStatus) {
    logger.info(`📢 HotspotStatusChecker: Notifying ${this.statusCallbacks.length} status callbacks`);
    
    this.statusCallbacks.forEach((callback, index) => {
      try {
        callback(status);
        logger.debug(`📢 Status callback ${index + 1} notified successfully`);
      } catch (error) {
        logger.error(`❌ Error notifying status callback ${index + 1}:`, error);
      }
    });
  }
}