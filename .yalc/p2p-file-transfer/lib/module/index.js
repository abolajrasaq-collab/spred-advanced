import { DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { getError } from './reasonCode';
const LINKING_ERROR = `The package 'p2p-file-transfer' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
const P2pFileTransfer = NativeModules.P2pFileTransfer ? NativeModules.P2pFileTransfer : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
const MODULE_NAME = 'P2pFileTransfer';
// ACTIONS
const PEERS_UPDATED_ACTION = 'PEERS_UPDATED';
const CONNECTION_INFO_UPDATED_ACTION = 'CONNECTION_INFO_UPDATED';
const THIS_DEVICE_CHANGED_ACTION = 'THIS_DEVICE_CHANGED_ACTION';
const CLIENTS_UPDATED = 'CLIENTS_UPDATED';
const subscribeOnEvent = (event, callback) => {
  return DeviceEventEmitter.addListener(`${MODULE_NAME}:${event}`, callback);
};

/**
 * Check if permissions have been granted
 */
export const checkPermissions = () => P2pFileTransfer.checkPermissions();

/**
 * Should location be enabled
 */
export const shouldEnableLocation = () => P2pFileTransfer.shouldEnableLocation();

/**
 * Checks if location is enabled
 */
export const isLocationEnabled = () => P2pFileTransfer.isLocationEnabled();

/**
 * Checks if Wi-Fi is enabled
 */
export const isWifiEnabled = () => P2pFileTransfer.isWifiEnabled();

/**
 * Checks if Wi-Fi hotspot is enabled
 */
export const isWifiHotspotEnabled = () => P2pFileTransfer.isWifiApEnabled();

/**
 * Request app permissions
 */
export const requestPermissions = () => P2pFileTransfer.requestPermissions();

/**
 * Open app settings
 */
export const openAppSettings = () => P2pFileTransfer.openAppSettings();

/**
 * Open Wi-Fi settings
 */
export const openWifiSettings = () => P2pFileTransfer.openWifiSettings();

/**
 * Open Wi-Fi hotspot settings
 */
export const openWifiHotspotSettings = () => P2pFileTransfer.openWifiApSettings();

/**
 * Open location settings
 */
export const openLocationSettings = () => P2pFileTransfer.openLocationSettings();

/**
 * Initialize the module
 */
export const initialize = () => P2pFileTransfer.init();

/**
 * Subscribe to this device changes
 *
 * @param callback the callback to be called when the device changes
 */
export const subscribeOnThisDeviceChanged = callback => subscribeOnEvent(THIS_DEVICE_CHANGED_ACTION, callback);

/**
 * Subscribe to clients updates
 *
 * @param callback the callback to be called when the clients are updated
 */
export const subscribeOnClientUpdated = callback => subscribeOnEvent(CLIENTS_UPDATED, callback);

/**
 * Start discovering peers
 */
export const startDiscoveringPeers = () => new Promise((resolve, reject) => {
  P2pFileTransfer.discoverPeers((reasonCode, message) => {
    reasonCode === undefined ? resolve('success') : reject(getError(reasonCode, message));
  });
});

/**
 * Subscribe to peers updates
 *
 * @param callback the callback to be called when the peers are updated
 */
export const subscribeOnPeersUpdates = callback => subscribeOnEvent(PEERS_UPDATED_ACTION, callback);

/**
 * Get the list of available peers
 */
export const getAvailablePeers = () => P2pFileTransfer.getAvailablePeersList();

/**
 * Stop discovering peers
 */
export const stopDiscoveringPeers = () => new Promise((resolve, reject) => {
  P2pFileTransfer.stopPeerDiscovery(reasonCode => {
    reasonCode === undefined ? resolve(reasonCode) : reject(getError(reasonCode));
  });
});

/**
 * Connect to a device with the given address
 *
 * @param deviceAddress the address of the device
 */
export const connect = deviceAddress => connectWithConfig({
  deviceAddress
});

/**
 * Connect to a device with the given config
 *
 * @param config the connection config
 */
export const connectWithConfig = config => new Promise((resolve, reject) => {
  P2pFileTransfer.connectWithConfig(config, status => {
    status === undefined ? resolve(undefined) : reject(getError(status));
  });
});

/**
 * Subscribe to connection info updates
 * @param callback the callback to be called when the connection info is updated
 */
export const subscribeOnConnectionInfoUpdates = callback => subscribeOnEvent(CONNECTION_INFO_UPDATED_ACTION, callback);

/**
 * Retrieve the connection info
 */
export const getConnectionInfo = () => P2pFileTransfer.getConnectionInfo();

/**
 * Cancel any ongoing connection
 */
export const cancelConnect = () => new Promise((resolve, reject) => {
  P2pFileTransfer.cancelConnect(status => {
    status === undefined ? resolve(undefined) : reject(getError(status));
  });
});

/**
 * Create a group
 */
export const createGroup = () => new Promise((resolve, reject) => {
  P2pFileTransfer.createGroup(reasonCode => {
    reasonCode === undefined ? resolve(undefined) : reject(getError(reasonCode));
  });
});

/**
 * Get the group info
 */
export const getGroupInfo = () => P2pFileTransfer.getGroupInfo();

/**
 * Exit the current group
 */
export const removeGroup = () => new Promise((resolve, reject) => {
  P2pFileTransfer.removeGroup(reasonCode => {
    reasonCode === undefined ? resolve(undefined) : reject(getError(reasonCode));
  });
});

/**
 * Send a file to the group owner
 *
 * @param pathToFile the path to the file
 */
export const sendFile = pathToFile => P2pFileTransfer.sendFile(pathToFile);

/**
 * Send a file to a specific device
 *
 * @param pathToFile the path to the file
 * @param address the address of the device
 */
export const sendFileTo = (pathToFile, address) => P2pFileTransfer.sendFileTo(pathToFile, address);

/**
 *
 * @param destination The destination directory
 * @param name The name of the file (optional)
 * @param forceToScanGallery If true, the file will be scanned by the media scanner
 */
export const receiveFile = (destination, name = null, forceToScanGallery = false) => new Promise((resolve, reject) => {
  P2pFileTransfer.receiveFile(destination, name, forceToScanGallery, (error, pathToFile) => {
    error ? reject(error) : resolve(pathToFile);
  });
});
//# sourceMappingURL=index.js.map