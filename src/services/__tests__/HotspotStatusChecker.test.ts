import { HotspotStatusChecker } from '../HotspotStatusChecker';
import { P2PService } from '../P2PService';

// Mock the P2PService
jest.mock('../P2PService');

describe('HotspotStatusChecker', () => {
  let hotspotStatusChecker: HotspotStatusChecker;
  let mockP2PService: jest.Mocked<P2PService>;

  beforeEach(() => {
    // Reset the singleton instance
    (HotspotStatusChecker as any).instance = undefined;
    
    // Create mock P2P service
    mockP2PService = {
      getState: jest.fn(),
      getGroupInfo: jest.fn(),
      checkHotspotStatus: jest.fn(),
      checkWifiDirectSupport: jest.fn(),
      getErrorGuidance: jest.fn(),
      subscribe: jest.fn(),
    } as any;

    // Mock P2PService.getInstance to return our mock
    (P2PService.getInstance as jest.Mock).mockReturnValue(mockP2PService);

    hotspotStatusChecker = HotspotStatusChecker.getInstance();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkHotspotStatus', () => {
    it('should return disabled status when P2P service is not initialized', async () => {
      mockP2PService.getState.mockReturnValue({
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
      });
      mockP2PService.getGroupInfo.mockResolvedValue(null);

      const status = await hotspotStatusChecker.checkHotspotStatus();

      expect(status.isActive).toBe(false);
      expect(status.mode).toBe('disabled');
      expect(status.discoveryState).toBe('idle');
      expect(status.connectionCount).toBe(0);
    });

    it('should return active status when P2P service is initialized and discovering', async () => {
      mockP2PService.getState.mockReturnValue({
        isInitialized: true,
        hasPermissions: true,
        isLocationEnabled: true,
        isWifiEnabled: true,
        isDiscovering: true,
        isConnected: false,
        isGroupOwner: false,
        discoveredDevices: [{ id: '1', name: 'Device 1' }],
        connectionInfo: null,
        transferProgress: null,
        error: null,
      });
      mockP2PService.getGroupInfo.mockResolvedValue(null);

      const status = await hotspotStatusChecker.checkHotspotStatus();

      expect(status.isActive).toBe(true);
      expect(status.mode).toBe('wifi-direct');
      expect(status.discoveryState).toBe('discovering');
      expect(status.connectionCount).toBe(1);
    });

    it('should return group owner status when acting as hotspot', async () => {
      const mockGroupInfo = { groupOwner: true, networkName: 'DIRECT-test' };
      
      mockP2PService.getState.mockReturnValue({
        isInitialized: true,
        hasPermissions: true,
        isLocationEnabled: true,
        isWifiEnabled: true,
        isDiscovering: false,
        isConnected: true,
        isGroupOwner: true,
        discoveredDevices: [],
        connectionInfo: { isGroupOwner: true, groupFormed: true },
        transferProgress: null,
        error: null,
      });
      mockP2PService.getGroupInfo.mockResolvedValue(mockGroupInfo);

      const status = await hotspotStatusChecker.checkHotspotStatus();

      expect(status.isActive).toBe(true);
      expect(status.mode).toBe('wifi-direct');
      expect(status.discoveryState).toBe('advertising');
      expect(status.groupInfo).toEqual(mockGroupInfo);
    });
  });

  describe('validateP2PService', () => {
    it('should return valid result when all checks pass', async () => {
      mockP2PService.getState.mockReturnValue({
        isInitialized: true,
        hasPermissions: true,
        isLocationEnabled: true,
        isWifiEnabled: true,
        isDiscovering: false,
        isConnected: false,
        isGroupOwner: false,
        discoveredDevices: [],
        connectionInfo: null,
        transferProgress: null,
        error: null,
      });

      const result = await hotspotStatusChecker.validateP2PService();

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.serviceHealth).toBe('healthy');
    });

    it('should return invalid result with issues when checks fail', async () => {
      mockP2PService.getState.mockReturnValue({
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
        error: 'Test error',
      });

      const result = await hotspotStatusChecker.validateP2PService();

      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.serviceHealth).toBe('unhealthy');
      expect(result.issues).toContain('P2P service is not initialized');
      expect(result.issues).toContain('Required permissions not granted');
    });
  });

  describe('subscribeToStatusChanges', () => {
    it('should add callback and return unsubscribe function', async () => {
      const mockCallback = jest.fn();
      
      mockP2PService.getState.mockReturnValue({
        isInitialized: true,
        hasPermissions: true,
        isLocationEnabled: true,
        isWifiEnabled: true,
        isDiscovering: false,
        isConnected: false,
        isGroupOwner: false,
        discoveredDevices: [],
        connectionInfo: null,
        transferProgress: null,
        error: null,
      });
      mockP2PService.getGroupInfo.mockResolvedValue(null);

      const unsubscribe = hotspotStatusChecker.subscribeToStatusChanges(mockCallback);

      // Wait for initial status callback
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
        isActive: true,
        mode: 'wifi-direct',
      }));

      // Test unsubscribe
      unsubscribe();
      
      // Verify callback is removed (this is internal state, so we can't directly test it)
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('runDiagnostics', () => {
    it('should return comprehensive diagnostic report', async () => {
      mockP2PService.getState.mockReturnValue({
        isInitialized: true,
        hasPermissions: true,
        isLocationEnabled: true,
        isWifiEnabled: true,
        isDiscovering: false,
        isConnected: false,
        isGroupOwner: false,
        discoveredDevices: [],
        connectionInfo: null,
        transferProgress: null,
        error: null,
      });
      mockP2PService.getGroupInfo.mockResolvedValue(null);
      mockP2PService.checkWifiDirectSupport.mockResolvedValue(true);

      const report = await hotspotStatusChecker.runDiagnostics();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('hotspotStatus');
      expect(report).toHaveProperty('validationResult');
      expect(report).toHaveProperty('p2pServiceState');
      expect(report).toHaveProperty('systemChecks');
      expect(report).toHaveProperty('performance');
      expect(report).toHaveProperty('errorHistory');

      expect(report.systemChecks.permissions).toBe(true);
      expect(report.systemChecks.wifiEnabled).toBe(true);
      expect(report.systemChecks.locationEnabled).toBe(true);
      expect(report.systemChecks.wifiDirectSupport).toBe(true);
    });
  });

  describe('generateErrorGuidance', () => {
    it('should provide hotspot-specific guidance for hotspot errors', () => {
      mockP2PService.getErrorGuidance.mockReturnValue({
        title: 'Base Error',
        message: 'Base message',
        actions: ['Base action'],
      });

      const guidance = hotspotStatusChecker.generateErrorGuidance('hotspot configuration failed');

      expect(guidance.title).toBe('Hotspot Configuration Issue');
      expect(guidance.message).toContain('WiFi Direct hotspot configuration');
      expect(guidance.actions).toContain('Check that WiFi hotspot is disabled in system settings');
      expect(guidance.canAutoFix).toBe(true);
    });

    it('should provide discovery-specific guidance for discovery errors', () => {
      mockP2PService.getErrorGuidance.mockReturnValue({
        title: 'Base Error',
        message: 'Base message',
        actions: ['Base action'],
      });

      const guidance = hotspotStatusChecker.generateErrorGuidance('discovery timeout');

      expect(guidance.title).toBe('Device Discovery Problem');
      expect(guidance.message).toContain('discover nearby devices');
      expect(guidance.actions).toContain('Ensure both devices are within 30 feet of each other');
      expect(guidance.canAutoFix).toBe(true);
    });
  });
});