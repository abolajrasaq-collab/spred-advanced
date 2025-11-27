/**
 * Global Permission API Patch
 * 
 * This module patches the React Native PermissionsAndroid API to prevent
 * the native crash that occurs when permission methods return null.
 * 
 * This is a temporary emergency fix to prevent app crashes while we
 * migrate all permission calls to use SafePermissionManager.
 */

import { Platform, PermissionsAndroid } from 'react-native';
import logger from './logger';

let isPatched = false;

export const patchPermissionsAndroid = () => {
  if (isPatched) {
    logger.info('🔧 Permission patch already applied');
    return;
  }

  if (Platform.OS !== 'android') {
    logger.info('🔧 Not on Android, skipping permission patch');
    return;
  }

  if (!PermissionsAndroid) {
    logger.warn('⚠️ PermissionsAndroid not available, cannot apply patch');
    return;
  }

  try {
    logger.info('🔧 Applying AGGRESSIVE emergency permission API patch...');

    // Store original methods
    const originalCheck = PermissionsAndroid.check;
    const originalRequestMultiple = PermissionsAndroid.requestMultiple;
    
    logger.info('🔧 Original methods stored:', {
      hasCheck: !!originalCheck,
      hasRequestMultiple: !!originalRequestMultiple
    });

    // Patch check method with MAXIMUM safety
    if (originalCheck) {
      PermissionsAndroid.check = async (permission: any) => {
        logger.info(`🔧 PATCHED CALL: Permission check for ${permission}`);
        
        try {
          // Pre-emptively check for problematic conditions
          if (!permission || permission === null || permission === undefined) {
            logger.warn(`⚠️ Patched: Invalid permission parameter: ${permission}`);
            return false;
          }
          
          logger.debug(`🔧 Calling original check method for: ${permission}`);
          const result = await originalCheck.call(PermissionsAndroid, permission);
          
          logger.debug(`🔧 Original check result for ${permission}:`, result);
          
          if (result === null || result === undefined) {
            logger.warn(`⚠️ PATCHED: Permission check returned null for ${permission}, returning false`);
            return false;
          }
          
          logger.debug(`✅ Patched check successful for ${permission}: ${result}`);
          return result;
        } catch (error: any) {
          logger.error(`❌ PATCHED: Permission check CRASHED for ${permission}:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          // This is the exact crash we're trying to prevent
          logger.warn(`🛡️ PATCH PREVENTED CRASH for ${permission} - returning false safely`);
          return false;
        }
      };
      
      logger.info('✅ PermissionsAndroid.check method patched successfully');
    } else {
      logger.warn('⚠️ PermissionsAndroid.check method not found, cannot patch');
    }

    // Patch requestMultiple method
    if (originalRequestMultiple) {
      PermissionsAndroid.requestMultiple = async (permissions: any) => {
        try {
          logger.debug(`🔧 Patched permission request for:`, permissions);
          const result = await originalRequestMultiple.call(PermissionsAndroid, permissions);
          
          if (result === null || result === undefined) {
            logger.warn(`⚠️ Patched: Permission request returned null, creating safe fallback`);
            
            // Create a safe fallback result
            const fallbackResult: any = {};
            if (Array.isArray(permissions)) {
              permissions.forEach(permission => {
                fallbackResult[permission] = PermissionsAndroid.RESULTS.DENIED;
              });
            }
            return fallbackResult;
          }
          
          return result;
        } catch (error: any) {
          logger.error(`❌ Patched: Permission request failed:`, error);
          
          // Check if this is the specific native crash
          if (error.message?.includes('null') || 
              error.stack?.includes('checkSelfPermission') ||
              error.stack?.includes('PermissionsModule')) {
            logger.warn(`⚠️ Patched: Native permission request crash detected - returning safe fallback`);
            
            // Create a safe fallback result
            const fallbackResult: any = {};
            if (Array.isArray(permissions)) {
              permissions.forEach(permission => {
                fallbackResult[permission] = PermissionsAndroid.RESULTS.DENIED;
              });
            }
            return fallbackResult;
          }
          
          // For other errors, return safe fallback
          const fallbackResult: any = {};
          if (Array.isArray(permissions)) {
            permissions.forEach(permission => {
              fallbackResult[permission] = PermissionsAndroid.RESULTS.DENIED;
            });
          }
          return fallbackResult;
        }
      };
    }

    isPatched = true;
    logger.info('✅ Emergency permission API patch applied successfully');
    
  } catch (patchError) {
    logger.error('❌ Failed to apply permission API patch:', patchError);
  }
};

// Test function to verify patch is working
export const testPatch = async () => {
  if (Platform.OS !== 'android' || !PermissionsAndroid) {
    logger.info('🧪 Patch test skipped - not Android or no PermissionsAndroid');
    return;
  }

  try {
    logger.info('🧪 Testing permission patch...');
    
    // Try a simple permission check to see if patch intercepts it
    const testPermission = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
    const result = await PermissionsAndroid.check(testPermission);
    
    logger.info('🧪 Patch test completed successfully:', result);
  } catch (error) {
    logger.error('🧪 Patch test failed:', error);
  }
};

// Auto-apply the patch when this module is imported
patchPermissionsAndroid();

// Test the patch after a short delay
setTimeout(() => {
  testPatch();
}, 1000);

export default patchPermissionsAndroid;