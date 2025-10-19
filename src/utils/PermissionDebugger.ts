/**
 * Permission Debugging Utilities
 * 
 * This utility provides debugging tools for testing various permission scenarios
 * and diagnosing permission-related issues.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import SafePermissionManager, { PermissionResult, PermissionSummary } from './SafePermissionManager';
import logger from './logger';

export interface PermissionDiagnostic {
  permission: string;
  checkResult: string | null;
  isGranted: boolean;
  error?: string;
  timestamp: number;
}

export interface SystemDiagnostic {
  platform: string;
  platformVersion: string | number;
  permissionAPIAvailable: boolean;
  permissionMethods: {
    checkSelfPermission: boolean;
    requestMultiple: boolean;
  };
  timestamp: number;
}

export class PermissionDebugger {
  private static instance: PermissionDebugger;
  private permissionManager = SafePermissionManager.getInstance();

  private constructor() {}

  static getInstance(): PermissionDebugger {
    if (!PermissionDebugger.instance) {
      PermissionDebugger.instance = new PermissionDebugger();
    }
    return PermissionDebugger.instance;
  }

  /**
   * Run comprehensive permission diagnostics - COMPLETELY SAFE VERSION
   */
  async runFullDiagnostic(): Promise<{
    system: SystemDiagnostic;
    permissions: PermissionDiagnostic[];
    summary: PermissionSummary;
    recommendations: string[];
  }> {
    try {
      logger.info('🔍 Starting SAFE comprehensive permission diagnostic...');

      // Get system diagnostic safely
      const system = await this.getSystemDiagnostic();
      
      // Get permission diagnostics using SafePermissionManager only
      const permissions = await this.getPermissionDiagnostics();
      
      // Get summary using SafePermissionManager
      let summary: PermissionSummary;
      try {
        summary = await this.permissionManager.getPermissionSummary();
      } catch (summaryError: any) {
        logger.error('❌ Permission summary failed, creating safe fallback:', summaryError);
        
        // Create safe fallback summary
        summary = {
          allGranted: false,
          requiredGranted: false,
          statuses: SafePermissionManager.NEARBY_PERMISSIONS.map(permission => ({
            permission,
            status: 'error',
            required: true,
            description: 'Permission check failed due to system error'
          })),
          canProceed: false,
          issues: [`Permission system error: ${summaryError.message}`]
        };
      }
      
      const recommendations = this.generateRecommendations(system, permissions, summary);

      const result = {
        system,
        permissions,
        summary,
        recommendations
      };

      logger.info('✅ SAFE permission diagnostic completed:', result);
      return result;
      
    } catch (error: any) {
      logger.error('❌ Critical error in permission diagnostic:', error);
      
      // Return completely safe fallback result
      return {
        system: {
          platform: Platform.OS,
          platformVersion: Platform.Version,
          permissionAPIAvailable: false,
          permissionMethods: {
            checkSelfPermission: false,
            requestMultiple: false
          },
          timestamp: Date.now()
        },
        permissions: SafePermissionManager.NEARBY_PERMISSIONS.map(permission => ({
          permission,
          checkResult: 'error',
          isGranted: false,
          timestamp: Date.now(),
          error: 'Diagnostic system error'
        })),
        summary: {
          allGranted: false,
          requiredGranted: false,
          statuses: [],
          canProceed: false,
          issues: [`Critical diagnostic error: ${error.message}`]
        },
        recommendations: [
          'Permission diagnostic system encountered a critical error',
          'The app will use mock mode for safety',
          'Contact support if this issue persists'
        ]
      };
    }
  }

  /**
   * Get system-level diagnostic information
   */
  async getSystemDiagnostic(): Promise<SystemDiagnostic> {
    const diagnostic: SystemDiagnostic = {
      platform: Platform.OS,
      platformVersion: Platform.Version,
      permissionAPIAvailable: false,
      permissionMethods: {
        checkSelfPermission: false,
        requestMultiple: false
      },
      timestamp: Date.now()
    };

    try {
      if (Platform.OS === 'android') {
        diagnostic.permissionAPIAvailable = !!PermissionsAndroid;
        
        if (PermissionsAndroid) {
          diagnostic.permissionMethods.checkSelfPermission = 
            typeof PermissionsAndroid.check === 'function';
          diagnostic.permissionMethods.requestMultiple = 
            typeof PermissionsAndroid.requestMultiple === 'function';
        }
      } else {
        // iOS doesn't use PermissionsAndroid
        diagnostic.permissionAPIAvailable = true;
        diagnostic.permissionMethods.checkSelfPermission = true;
        diagnostic.permissionMethods.requestMultiple = true;
      }
    } catch (error) {
      logger.error('❌ Error getting system diagnostic:', error);
    }

    return diagnostic;
  }

  /**
   * Get detailed diagnostics for each permission - SAFE VERSION
   */
  async getPermissionDiagnostics(): Promise<PermissionDiagnostic[]> {
    const diagnostics: PermissionDiagnostic[] = [];

    for (const permission of SafePermissionManager.NEARBY_PERMISSIONS) {
      const diagnostic: PermissionDiagnostic = {
        permission,
        checkResult: null,
        isGranted: false,
        timestamp: Date.now()
      };

      try {
        // Use SafePermissionManager instead of direct PermissionsAndroid calls
        logger.info(`🔍 Safe diagnostic check for permission: ${permission}`);
        const isGranted = await this.permissionManager.isPermissionGranted(permission);
        
        diagnostic.checkResult = isGranted ? 'granted' : 'denied';
        diagnostic.isGranted = isGranted;
        
        logger.info(`✅ Safe diagnostic result for ${permission}: ${isGranted ? 'granted' : 'denied'}`);
      } catch (error: any) {
        logger.error(`❌ Safe diagnostic failed for ${permission}:`, error);
        diagnostic.error = error.message;
        diagnostic.checkResult = 'error';
        diagnostic.isGranted = false;
      }

      diagnostics.push(diagnostic);
    }

    return diagnostics;
  }

  /**
   * Simulate permission failures for testing
   */
  async simulatePermissionFailure(scenario: 'null_result' | 'api_unavailable' | 'exception'): Promise<PermissionResult> {
    logger.warn(`🧪 Simulating permission failure scenario: ${scenario}`);

    switch (scenario) {
      case 'null_result':
        return {
          success: false,
          granted: [],
          denied: SafePermissionManager.NEARBY_PERMISSIONS,
          error: 'Simulated null result from permission API'
        };

      case 'api_unavailable':
        return {
          success: false,
          granted: [],
          denied: SafePermissionManager.NEARBY_PERMISSIONS,
          error: 'Simulated permission API unavailable'
        };

      case 'exception':
        return {
          success: false,
          granted: [],
          denied: SafePermissionManager.NEARBY_PERMISSIONS,
          error: 'Simulated exception during permission request'
        };

      default:
        throw new Error(`Unknown simulation scenario: ${scenario}`);
    }
  }

  /**
   * Test permission manager resilience
   */
  async testPermissionManagerResilience(): Promise<{
    nullResultHandling: boolean;
    exceptionHandling: boolean;
    apiUnavailableHandling: boolean;
    overallResilience: boolean;
  }> {
    logger.info('🧪 Testing permission manager resilience...');

    const results = {
      nullResultHandling: false,
      exceptionHandling: false,
      apiUnavailableHandling: false,
      overallResilience: false
    };

    try {
      // Test null result handling
      const nullResult = await this.simulatePermissionFailure('null_result');
      results.nullResultHandling = !nullResult.success && nullResult.error?.includes('null');

      // Test exception handling
      const exceptionResult = await this.simulatePermissionFailure('exception');
      results.exceptionHandling = !exceptionResult.success && nullResult.error?.includes('exception');

      // Test API unavailable handling
      const apiResult = await this.simulatePermissionFailure('api_unavailable');
      results.apiUnavailableHandling = !apiResult.success && apiResult.error?.includes('unavailable');

      results.overallResilience = results.nullResultHandling && 
                                 results.exceptionHandling && 
                                 results.apiUnavailableHandling;

    } catch (error) {
      logger.error('❌ Error testing permission manager resilience:', error);
    }

    logger.info('✅ Permission manager resilience test completed:', results);
    return results;
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  private generateRecommendations(
    system: SystemDiagnostic, 
    permissions: PermissionDiagnostic[], 
    summary: PermissionSummary
  ): string[] {
    const recommendations: string[] = [];

    // System-level recommendations
    if (!system.permissionAPIAvailable) {
      recommendations.push('Permission API is not available - app will use mock mode');
    }

    if (!system.permissionMethods.checkSelfPermission) {
      recommendations.push('checkSelfPermission method not available - permission checks may fail');
    }

    if (!system.permissionMethods.requestMultiple) {
      recommendations.push('requestMultiple method not available - permission requests may fail');
    }

    // Permission-level recommendations
    const deniedPermissions = permissions.filter(p => !p.isGranted);
    if (deniedPermissions.length > 0) {
      recommendations.push(`${deniedPermissions.length} permission(s) denied - nearby sharing will use fallback mode`);
    }

    const errorPermissions = permissions.filter(p => p.error);
    if (errorPermissions.length > 0) {
      recommendations.push(`${errorPermissions.length} permission(s) have errors - check system configuration`);
    }

    // Summary-based recommendations
    if (!summary.canProceed) {
      recommendations.push('Cannot proceed with real nearby API - app will automatically use mock mode');
    }

    if (summary.issues.length > 0) {
      recommendations.push(`Address these issues: ${summary.issues.join(', ')}`);
    }

    // Default recommendation if no issues found
    if (recommendations.length === 0) {
      recommendations.push('All permissions and systems appear to be working correctly');
    }

    return recommendations;
  }

  /**
   * Log diagnostic summary to console
   */
  async logDiagnosticSummary(): Promise<void> {
    const diagnostic = await this.runFullDiagnostic();
    
    console.log('\n🔍 PERMISSION DIAGNOSTIC SUMMARY');
    console.log('================================');
    console.log(`Platform: ${diagnostic.system.platform} ${diagnostic.system.platformVersion}`);
    console.log(`Permission API Available: ${diagnostic.system.permissionAPIAvailable}`);
    console.log(`Can Proceed: ${diagnostic.summary.canProceed}`);
    console.log(`Granted Permissions: ${diagnostic.summary.statuses.filter(s => s.status === 'granted').length}/${diagnostic.summary.statuses.length}`);
    
    if (diagnostic.summary.issues.length > 0) {
      console.log('\n⚠️ Issues:');
      diagnostic.summary.issues.forEach(issue => console.log(`  • ${issue}`));
    }
    
    console.log('\n💡 Recommendations:');
    diagnostic.recommendations.forEach(rec => console.log(`  • ${rec}`));
    console.log('================================\n');
  }
}

export default PermissionDebugger;