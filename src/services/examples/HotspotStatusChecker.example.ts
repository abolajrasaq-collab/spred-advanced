/**
 * Example usage of HotspotStatusChecker service
 * This demonstrates how to use the service for monitoring hotspot status
 */

import { HotspotStatusChecker, HotspotStatus } from '../HotspotStatusChecker';
import logger from '../../utils/logger';

export class HotspotStatusExample {
  private statusChecker: HotspotStatusChecker;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.statusChecker = HotspotStatusChecker.getInstance();
  }

  /**
   * Example: Basic status checking
   */
  async checkBasicStatus() {
    logger.info('📱 Example: Checking basic hotspot status...');
    
    const status = await this.statusChecker.checkHotspotStatus();
    
    logger.info('📱 Hotspot Status:', {
      isActive: status.isActive,
      mode: status.mode,
      discoveryState: status.discoveryState,
      connectionCount: status.connectionCount,
      error: status.error,
    });
    
    return status;
  }

  /**
   * Example: Service validation
   */
  async validateService() {
    logger.info('🔍 Example: Validating P2P service...');
    
    const validation = await this.statusChecker.validateP2PService();
    
    logger.info('🔍 Validation Result:', {
      isValid: validation.isValid,
      serviceHealth: validation.serviceHealth,
      issueCount: validation.issues.length,
      recommendationCount: validation.recommendations.length,
    });
    
    if (!validation.isValid) {
      logger.warn('⚠️ Service Issues:', validation.issues);
      logger.info('💡 Recommendations:', validation.recommendations);
    }
    
    return validation;
  }

  /**
   * Example: Real-time status monitoring
   */
  startStatusMonitoring() {
    logger.info('📡 Example: Starting real-time status monitoring...');
    
    this.unsubscribe = this.statusChecker.subscribeToStatusChanges((status: HotspotStatus) => {
      logger.info('📡 Status Update:', {
        timestamp: new Date().toISOString(),
        isActive: status.isActive,
        mode: status.mode,
        discoveryState: status.discoveryState,
        connectionCount: status.connectionCount,
      });
      
      // Handle specific status changes
      if (status.error) {
        logger.error('❌ Hotspot Error:', status.error);
        this.handleError(status.error);
      }
      
      if (status.isActive && status.connectionCount > 0) {
        logger.info('✅ Devices connected to hotspot:', status.connectionCount);
      }
    });
    
    // Start automatic refresh
    this.statusChecker.startAutomaticStatusRefresh(3000); // Every 3 seconds
  }

  /**
   * Example: Stop monitoring
   */
  stopStatusMonitoring() {
    logger.info('🛑 Example: Stopping status monitoring...');
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.statusChecker.stopAutomaticStatusRefresh();
  }

  /**
   * Example: Run comprehensive diagnostics
   */
  async runDiagnostics() {
    logger.info('🔍 Example: Running comprehensive diagnostics...');
    
    const report = await this.statusChecker.runDiagnostics();
    
    logger.info('🔍 Diagnostic Report:', {
      timestamp: report.timestamp,
      hotspotActive: report.hotspotStatus.isActive,
      serviceHealth: report.validationResult.serviceHealth,
      systemChecks: report.systemChecks,
      errorCount: report.errorHistory.length,
    });
    
    // Log performance metrics if available
    if (Object.keys(report.performance).length > 0) {
      logger.info('📊 Performance Metrics:', report.performance);
    }
    
    return report;
  }

  /**
   * Example: Generate status report
   */
  async generateReport() {
    logger.info('📊 Example: Generating status report...');
    
    const report = await this.statusChecker.generateStatusReport();
    
    logger.info('📊 Status Report Summary:', {
      hotspotActive: report.summary.hotspotActive,
      mode: report.summary.mode,
      deviceCount: report.summary.deviceCount,
      lastError: report.summary.lastError,
      diagnosticCount: report.diagnostics.length,
    });
    
    return report;
  }

  /**
   * Example: Handle errors with guidance
   */
  private handleError(error: string) {
    const guidance = this.statusChecker.generateErrorGuidance(error);
    
    logger.info('💡 Error Guidance:', {
      title: guidance.title,
      message: guidance.message,
      canAutoFix: guidance.canAutoFix,
      actionCount: guidance.actions.length,
    });
    
    // Log specific actions
    guidance.actions.forEach((action, index) => {
      logger.info(`   ${index + 1}. ${action}`);
    });
  }

  /**
   * Example: Complete workflow
   */
  async runCompleteExample() {
    logger.info('🚀 Example: Running complete hotspot status workflow...');
    
    try {
      // 1. Check basic status
      await this.checkBasicStatus();
      
      // 2. Validate service
      await this.validateService();
      
      // 3. Start monitoring
      this.startStatusMonitoring();
      
      // 4. Wait for some status updates
      await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds
      
      // 5. Run diagnostics
      await this.runDiagnostics();
      
      // 6. Generate report
      await this.generateReport();
      
      // 7. Stop monitoring
      this.stopStatusMonitoring();
      
      logger.info('✅ Example: Complete workflow finished');
      
    } catch (error) {
      logger.error('❌ Example: Workflow error:', error);
    }
  }
}

// Usage example:
// const example = new HotspotStatusExample();
// example.runCompleteExample();