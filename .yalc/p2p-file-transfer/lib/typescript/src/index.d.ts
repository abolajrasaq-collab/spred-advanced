import { type EmitterSubscription } from 'react-native';
/**
 * Check if permissions have been granted
 */
export declare const checkPermissions: () => Promise<boolean>;
/**
 * Should location be enabled
 */
export declare const shouldEnableLocation: () => Promise<boolean>;
/**
 * Checks if location is enabled
 */
export declare const isLocationEnabled: () => Promise<boolean>;
/**
 * Checks if Wi-Fi is enabled
 */
export declare const isWifiEnabled: () => Promise<boolean>;
/**
 * Checks if Wi-Fi hotspot is enabled
 */
export declare const isWifiHotspotEnabled: () => Promise<boolean>;
/**
 * Request app permissions
 */
export declare const requestPermissions: () => Promise<boolean>;
/**
 * Open app settings
 */
export declare const openAppSettings: () => Promise<void>;
/**
 * Open Wi-Fi settings
 */
export declare const openWifiSettings: () => Promise<void>;
/**
 * Open Wi-Fi hotspot settings
 */
export declare const openWifiHotspotSettings: () => Promise<void>;
/**
 * Open location settings
 */
export declare const openLocationSettings: () => Promise<void>;
/**
 * Initialize the module
 */
export declare const initialize: () => any;
/**
 * Subscribe to this device changes
 *
 * @param callback the callback to be called when the device changes
 */
export declare const subscribeOnThisDeviceChanged: (callback: (data: GroupInfo) => void) => EmitterSubscription;
/**
 * Subscribe to clients updates
 *
 * @param callback the callback to be called when the clients are updated
 */
export declare const subscribeOnClientUpdated: (callback: (data: ClientsUpdated) => void) => EmitterSubscription;
/**
 * Start discovering peers
 */
export declare const startDiscoveringPeers: () => Promise<string>;
/**
 * Subscribe to peers updates
 *
 * @param callback the callback to be called when the peers are updated
 */
export declare const subscribeOnPeersUpdates: (callback: (data: {
    devices: Device[];
}) => void) => EmitterSubscription;
/**
 * Get the list of available peers
 */
export declare const getAvailablePeers: () => Promise<{
    devices: Device[];
}>;
/**
 * Stop discovering peers
 */
export declare const stopDiscoveringPeers: () => Promise<void>;
/**
 * Connect to a device with the given address
 *
 * @param deviceAddress the address of the device
 */
export declare const connect: (deviceAddress: string) => Promise<void>;
/**
 * Connect to a device with the given config
 *
 * @param config the connection config
 */
export declare const connectWithConfig: (config: ConnectionArgs) => Promise<void>;
/**
 * Subscribe to connection info updates
 * @param callback the callback to be called when the connection info is updated
 */
export declare const subscribeOnConnectionInfoUpdates: (callback: (value: WifiP2pInfo) => void) => EmitterSubscription;
/**
 * Retrieve the connection info
 */
export declare const getConnectionInfo: () => Promise<WifiP2pInfo>;
/**
 * Cancel any ongoing connection
 */
export declare const cancelConnect: () => Promise<void>;
/**
 * Create a group
 */
export declare const createGroup: () => Promise<void>;
/**
 * Get the group info
 */
export declare const getGroupInfo: () => Promise<GroupInfo>;
/**
 * Exit the current group
 */
export declare const removeGroup: () => Promise<void>;
/**
 * Send a file to the group owner
 *
 * @param pathToFile the path to the file
 */
export declare const sendFile: (pathToFile: string) => Promise<File>;
/**
 * Send a file to a specific device
 *
 * @param pathToFile the path to the file
 * @param address the address of the device
 */
export declare const sendFileTo: (pathToFile: string, address: string) => Promise<File>;
/**
 *
 * @param destination The destination directory
 * @param name The name of the file (optional)
 * @param forceToScanGallery If true, the file will be scanned by the media scanner
 */
export declare const receiveFile: (destination: string, name?: string | null, forceToScanGallery?: boolean) => Promise<string>;
export interface Device {
    deviceAddress: string;
    deviceName: string;
    isGroupOwner: boolean;
    primaryDeviceType: string | null;
    secondaryDeviceType: string | null;
    status: number;
}
export interface ConnectionArgs {
    deviceAddress: string;
    groupOwnerIntent?: number;
}
export interface GroupInfo {
    interface: string;
    networkName: string;
    passphrase: string;
    owner: Device;
    clients: Array<Device>;
}
export interface WifiP2pInfo {
    groupOwnerAddress: {
        hostAddress: string;
        isLoopbackAddress: boolean;
    } | null;
    groupFormed: boolean;
    isGroupOwner: boolean;
}
export interface File {
    time: number;
    file: string;
}
export interface ClientsUpdated {
    clients: Array<string>;
}
//# sourceMappingURL=index.d.ts.map