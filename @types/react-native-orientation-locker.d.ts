declare module 'react-native-orientation-locker' {
  export default class Orientation {
    static lockToPortrait(): void;
    static lockToLandscape(): void;
    static lockToLandscapeLeft(): void;
    static lockToLandscapeRight(): void;
    static unlockAllOrientations(): void;
    static getOrientation(callback: (orientation: string) => void): void;
    static getDeviceOrientation(callback: (orientation: string) => void): void;
    static addOrientationListener(
      callback: (orientation: string) => void,
    ): void;
    static removeOrientationListener(
      callback: (orientation: string) => void,
    ): void;
    static addDeviceOrientationListener(
      callback: (orientation: string) => void,
    ): void;
    static removeDeviceOrientationListener(
      callback: (orientation: string) => void,
    ): void;
  }
}
