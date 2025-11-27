import { useEffect } from 'react';
import Orientation from 'react-native-orientation-locker';

export const useOrientation = () => {
  useEffect(() => {
    // Allow all orientations initially
    Orientation.unlockAllOrientations();

    // Cleanup function to reset to portrait when component unmounts
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  const lockToPortrait = () => {
    Orientation.lockToPortrait();
  };

  const lockToLandscape = () => {
    Orientation.lockToLandscape();
  };

  const unlockAllOrientations = () => {
    Orientation.unlockAllOrientations();
  };

  return {
    lockToPortrait,
    lockToLandscape,
    unlockAllOrientations,
  };
};