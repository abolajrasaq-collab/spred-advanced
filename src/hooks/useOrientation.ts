import { useEffect, useState, useCallback } from 'react';
import Orientation from 'react-native-orientation-locker';

export type OrientationType = 'PORTRAIT' | 'LANDSCAPE' | 'AUTO';

export const useOrientation = () => {
  const [currentOrientation, setCurrentOrientation] =
    useState<OrientationType>('AUTO');
  const [deviceOrientation, setDeviceOrientation] =
    useState<string>('PORTRAIT');

  useEffect(() => {
    // Configure orientation listener only
    const orientationListener = Orientation.addOrientationListener(
      orientation => {
        setDeviceOrientation(orientation);
      },
    );

    // Don't set any global orientation locks here
    // Let individual components manage their own orientation needs

    // Cleanup function - just remove the listener, don't change global orientation
    return () => {
      // Only remove the listener, don't change global orientation state
    };
  }, []);

  const lockToPortrait = useCallback(() => {
    setCurrentOrientation('PORTRAIT');
    Orientation.lockToPortrait();
  }, []);

  const lockToLandscape = useCallback(() => {
    setCurrentOrientation('LANDSCAPE');
    Orientation.lockToLandscape();
  }, []);

  const unlockAllOrientations = useCallback(() => {
    setCurrentOrientation('AUTO');
    Orientation.unlockAllOrientations();
  }, []);

  const isLandscape = deviceOrientation.includes('LANDSCAPE');
  const isPortrait = deviceOrientation === 'PORTRAIT';

  return {
    currentOrientation,
    deviceOrientation,
    isLandscape,
    isPortrait,
    lockToPortrait,
    lockToLandscape,
    unlockAllOrientations,
  };
};
