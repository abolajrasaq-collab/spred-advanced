import { NativeModules, Platform } from 'react-native';

const { SystemUIModule } = NativeModules;

export interface SystemUIModuleInterface {
  hideSystemUI(): void;
  showSystemUI(): void;
  toggleSystemUI(): void;
}

const SystemUI: SystemUIModuleInterface = {
  hideSystemUI: () => {
    if (Platform.OS === 'android') {
      SystemUIModule?.hideSystemUI();
    }
  },
  showSystemUI: () => {
    if (Platform.OS === 'android') {
      SystemUIModule?.showSystemUI();
    }
  },
  toggleSystemUI: () => {
    if (Platform.OS === 'android') {
      SystemUIModule?.toggleSystemUI();
    }
  },
};

export default SystemUI;
