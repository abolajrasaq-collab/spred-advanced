"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribeOnThisDeviceChanged = exports.subscribeOnPeersUpdates = exports.subscribeOnConnectionInfoUpdates = exports.subscribeOnClientUpdated = exports.stopDiscoveringPeers = exports.startDiscoveringPeers = exports.shouldEnableLocation = exports.sendFileTo = exports.sendFile = exports.requestPermissions = exports.removeGroup = exports.receiveFile = exports.openWifiSettings = exports.openWifiHotspotSettings = exports.openLocationSettings = exports.openAppSettings = exports.isWifiHotspotEnabled = exports.isWifiEnabled = exports.isLocationEnabled = exports.initialize = exports.getGroupInfo = exports.getConnectionInfo = exports.getAvailablePeers = exports.createGroup = exports.connectWithConfig = exports.connect = exports.checkPermissions = exports.cancelConnect = void 0;
var _reactNative = require("react-native");
var _reasonCode = require("./reasonCode");
const LINKING_ERROR = `The package 'p2p-file-transfer' doesn't seem to be linked. Make sure: \n\n` + _reactNative.Platform.select({
  ios: "- You have run 'pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
const P2pFileTransfer = _reactNative.NativeModules.P2pFileTransfer ? _reactNative.NativeModules.P2pFileTransfer : new Proxy({}, {
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
  return _reactNative.DeviceEventEmitter.addListener(`${MODULE_NAME}:${event}`, callback);
};

/**
 * Check if permissions have been granted
 */
const checkPermissions = () => P2pFileTransfer.checkPermissions();

/**
 * Should location be enabled
 */
exports.checkPermissions = checkPermissions;
const shouldEnableLocation = () => P2pFileTransfer.shouldEnableLocation();

/**
 * Checks if location is enabled
 */
exports.shouldEnableLocation = shouldEnableLocation;
const isLocationEnabled = () => P2pFileTransfer.isLocationEnabled();

/**
 * Checks if Wi-Fi is enabled
 */
exports.isLocationEnabled = isLocationEnabled;
const isWifiEnabled = () => P2pFileTransfer.isWifiEnabled();

/**
 * Checks if Wi-Fi hotspot is enabled
 */
exports.isWifiEnabled = isWifiEnabled;
const isWifiHotspotEnabled = () => P2pFileTransfer.isWifiApEnabled();

/**
 * Request app permissions
 */
exports.isWifiHotspotEnabled = isWifiHotspotEnabled;
const requestPermissions = () => P2pFileTransfer.requestPermissions();

/**
 * Open app settings
 */
exports.requestPermissions = requestPermissions;
const openAppSettings = () => P2pFileTransfer.openAppSettings();

/**
 * Open Wi-Fi settings
 */
exports.openAppSettings = openAppSettings;
const openWifiSettings = () => P2pFileTransfer.openWifiSettings();

/**
 * Open Wi-Fi hotspot settings
 */
exports.openWifiSettings = openWifiSettings;
const openWifiHotspotSettings = () => P2pFileTransfer.openWifiApSettings();

/**
 * Open location settings
 */
exports.openWifiHotspotSettings = openWifiHotspotSettings;
const openLocationSettings = () => P2pFileTransfer.openLocationSettings();

/**
 * Initialize the module
 */
exports.openLocationSettings = openLocationSettings;
const initialize = () => P2pFileTransfer.init();

/**
 * Subscribe to this device changes
 *
 * @param callback the callback to be called when the device changes
 */
exports.initialize = initialize;
const subscribeOnThisDeviceChanged = callback => subscribeOnEvent(THIS_DEVICE_CHANGED_ACTION, callback);

/**
 * Subscribe to clients updates
 *
 * @param callback the callback to be called when the clients are updated
 */
exports.subscribeOnThisDeviceChanged = subscribeOnThisDeviceChanged;
const subscribeOnClientUpdated = callback => subscribeOnEvent(CLIENTS_UPDATED, callback);

/**
 * Start discovering peers
 */
exports.subscribeOnClientUpdated = subscribeOnClientUpdated;
const startDiscoveringPeers = () => new Promise((resolve, reject) => {
  P2pFileTransfer.discoverPeers((reasonCode, message) => {
    reasonCode === undefined ? resolve('success') : reject((0, _reasonCode.getError)(reasonCode, message));
  });
});

/**
 * Subscribe to peers updates
 *
 * @param callback the callback to be called when the peers are updated
 */
exports.startDiscoveringPeers = startDiscoveringPeers;
const subscribeOnPeersUpdates = callback => subscribeOnEvent(PEERS_UPDATED_ACTION, callback);

/**
 * Get the list of available peers
 */
exports.subscribeOnPeersUpdates = subscribeOnPeersUpdates;
const getAvailablePeers = () => P2pFileTransfer.getAvailablePeersList();

/**
 * Stop discovering peers
 */
exports.getAvailablePeers = getAvailablePeers;
const stopDiscoveringPeers = () => new Promise((resolve, reject) => {
  P2pFileTransfer.stopPeerDiscovery(reasonCode => {
    reasonCode === undefined ? resolve(reasonCode) : reject((0, _reasonCode.getError)(reasonCode));
  });
});

/**
 * Connect to a device with the given address
 *
 * @param deviceAddress the address of the device
 */
exports.stopDiscoveringPeers = stopDiscoveringPeers;
const connect = deviceAddress => connectWithConfig({
  deviceAddress
});

/**
 * Connect to a device with the given config
 *
 * @param config the connection config
 */
exports.connect = connect;
const connectWithConfig = config => new Promise((resolve, reject) => {
  P2pFileTransfer.connectWithConfig(config, status => {
    status === undefined ? resolve(undefined) : reject((0, _reasonCode.getError)(status));
  });
});

/**
 * Subscribe to connection info updates
 * @param callback the callback to be called when the connection info is updated
 */
exports.connectWithConfig = connectWithConfig;
const subscribeOnConnectionInfoUpdates = callback => subscribeOnEvent(CONNECTION_INFO_UPDATED_ACTION, callback);

/**
 * Retrieve the connection info
 */
exports.subscribeOnConnectionInfoUpdates = subscribeOnConnectionInfoUpdates;
const getConnectionInfo = () => P2pFileTransfer.getConnectionInfo();

/**
 * Cancel any ongoing connection
 */
exports.getConnectionInfo = getConnectionInfo;
const cancelConnect = () => new Promise((resolve, reject) => {
  P2pFileTransfer.cancelConnect(status => {
    status === undefined ? resolve(undefined) : reject((0, _reasonCode.getError)(status));
  });
});

/**
 * Create a group
 */
exports.cancelConnect = cancelConnect;
const createGroup = () => new Promise((resolve, reject) => {
  P2pFileTransfer.createGroup(reasonCode => {
    reasonCode === undefined ? resolve(undefined) : reject((0, _reasonCode.getError)(reasonCode));
  });
});

/**
 * Get the group info
 */
exports.createGroup = createGroup;
const getGroupInfo = () => P2pFileTransfer.getGroupInfo();

/**
 * Exit the current group
 */
exports.getGroupInfo = getGroupInfo;
const removeGroup = () => new Promise((resolve, reject) => {
  P2pFileTransfer.removeGroup(reasonCode => {
    reasonCode === undefined ? resolve(undefined) : reject((0, _reasonCode.getError)(reasonCode));
  });
});

/**
 * Send a file to the group owner
 *
 * @param pathToFile the path to the file
 */
exports.removeGroup = removeGroup;
const sendFile = pathToFile => P2pFileTransfer.sendFile(pathToFile);

/**
 * Send a file to a specific device
 *
 * @param pathToFile the path to the file
 * @param address the address of the device
 */
exports.sendFile = sendFile;
const sendFileTo = (pathToFile, address) => P2pFileTransfer.sendFileTo(pathToFile, address);

/**
 *
 * @param destination The destination directory
 * @param name The name of the file (optional)
 * @param forceToScanGallery If true, the file will be scanned by the media scanner
 */
exports.sendFileTo = sendFileTo;
const receiveFile = (destination, name = null, forceToScanGallery = false) => new Promise((resolve, reject) => {
  P2pFileTransfer.receiveFile(destination, name, forceToScanGallery, (error, pathToFile) => {
    error ? reject(error) : resolve(pathToFile);
  });
});
exports.receiveFile = receiveFile;
//# sourceMappingURL=index.js.map