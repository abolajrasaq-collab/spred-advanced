
import {Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const isSamsungS21Ultra = (): boolean => {
  if (Platform.OS === 'android') {
    const brand = DeviceInfo.getBrand();
    const model = DeviceInfo.getModel();
    return brand.toLowerCase() === 'samsung' && model.toLowerCase().includes('sm-g998');
  }
  return false;
};
