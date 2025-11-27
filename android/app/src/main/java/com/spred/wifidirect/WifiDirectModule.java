package com.spred.wifidirect;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.wifi.p2p.WifiP2pManager;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import android.net.wifi.p2p.WifiP2pDevice;
import android.net.wifi.p2p.WifiP2pDeviceList;

import android.net.wifi.p2p.WifiP2pInfo;
import android.net.wifi.p2p.WifiP2pConfig;
import android.net.wifi.WpsInfo;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.DataOutputStream;
import java.io.DataInputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.channels.FileChannel;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import androidx.core.content.ContextCompat;

import android.os.Build;

public class WifiDirectModule extends ReactContextBaseJavaModule implements WifiP2pManager.PeerListListener, WifiP2pManager.ConnectionInfoListener {
    private static final String TAG = "WifiDirectModule";
    private final ReactApplicationContext reactContext;
    private WifiP2pManager manager;
    private WifiP2pManager.Channel channel;
    private BroadcastReceiver receiver;
    private IntentFilter intentFilter;

    // Maintain list of discovered peers
    private WritableArray discoveredPeers = Arguments.createArray();

    // Socket server for file transfers
    private ServerSocket fileTransferServer;
    private Thread serverThread;
    private boolean isServerRunning = false;

    // Transfer tracking
    private CountDownLatch transferComplete;

    // Receive tracking
    private String receiveDestination;
    private Promise receivePromise;

    public WifiDirectModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "WifiDirectModule";
    }

    @ReactMethod
    public void init(Promise promise) {
        Log.d(TAG, "init() called");
        manager = (WifiP2pManager) reactContext.getSystemService(Context.WIFI_P2P_SERVICE);
        if (manager == null) {
            Log.e(TAG, "Cannot get WifiP2pManager service.");
            promise.reject("UNSUPPORTED", "Wi-Fi Direct is not supported on this device.");
            return;
        }

        channel = manager.initialize(reactContext, reactContext.getMainLooper(), null);
        if (channel == null) {
            Log.e(TAG, "Cannot initialize WifiP2pManager channel.");
            promise.reject("INITIALIZATION_ERROR", "Failed to initialize Wi-Fi Direct.");
            return;
        }

        receiver = new WifiDirectBroadcastReceiver(manager, channel, this);
        intentFilter = new IntentFilter();
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_STATE_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_PEERS_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_CONNECTION_CHANGED_ACTION);
        intentFilter.addAction(WifiP2pManager.WIFI_P2P_THIS_DEVICE_CHANGED_ACTION);

        reactContext.registerReceiver(receiver, intentFilter);
        promise.resolve(null);
    }

    @ReactMethod
    public void share(String filePath, Promise promise) {
        // TODO: Implement Wi-Fi Direct sharing logic
        promise.resolve("Sharing " + filePath);
    }

    @Override
    public void onPeersAvailable(WifiP2pDeviceList peerList) {
        Log.d(TAG, "onPeersAvailable() called");
        Log.d(TAG, "Peers available: " + peerList.getDeviceList().size());
        
        // Create a new array for storing discovered peers
        WritableArray newDiscoveredPeers = Arguments.createArray();
        
        for (WifiP2pDevice device : peerList.getDeviceList()) {
            WritableMap peer = Arguments.createMap();
            peer.putString("name", device.deviceName);
            peer.putString("address", device.deviceAddress);
            peer.putInt("status", device.status); // Add device status
            peer.putString("primaryDeviceType", device.primaryDeviceType); // Add primary device type
            peer.putString("secondaryDeviceType", device.secondaryDeviceType); // Add secondary device type
            // 🔒 SECURITY FIX: Only add Spred-verified devices
            if (device.deviceName != null && device.deviceName.contains("Spred")) {
                newDiscoveredPeers.pushMap(peer);
                Log.d(TAG, "✅ Security: Added verified Spred device: " + device.deviceName);
            } else {
                Log.w(TAG, "🔒 Security: Skipped non-Spred device: " + device.deviceName);
            }
        }
        
        // Update the stored discovered peers
        discoveredPeers = newDiscoveredPeers;
        
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onPeersFound", newDiscoveredPeers);
    }

    @ReactMethod
    public void connect(String deviceAddress, Promise promise) {
        if (manager == null || channel == null) {
            Log.e(TAG, "connect: Manager or Channel not initialized");
            promise.reject("NOT_INITIALIZED", "Wi-Fi Direct has not been initialized.");
            return;
        }

        // Check if device address is valid before attempting connection
        if (deviceAddress == null || deviceAddress.trim().isEmpty()) {
            Log.e(TAG, "connect: Invalid device address: " + deviceAddress);
            promise.reject("INVALID_ADDRESS", "Device address is invalid.");

        // 🔒 SECURITY FIX: Verify device is a Spred device before connecting
        if (!isVerifiedSpredDevice(deviceAddress)) {
            String errorMsg = "Connection rejected: Device is not a verified Spred device. Only Spred devices can connect.";
            Log.e(TAG, "❌ Security: " + errorMsg);
            promise.reject("SECURITY_ERROR", errorMsg);
            return;
        }
            return;
        }

        Log.d(TAG, "Attempting to connect to device: " + deviceAddress);
        
        WifiP2pConfig config = new WifiP2pConfig();
        config.deviceAddress = deviceAddress;
        config.wps.setup = WpsInfo.PBC; // Use Push Button Configuration
        
        manager.connect(channel, config, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Connection to " + deviceAddress + " initiated successfully.");
                
                // Wait for connection info to be available
                manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
                    @Override
                    public void onConnectionInfoAvailable(WifiP2pInfo info) {
                        Log.d(TAG, "Connection info available in connect method: " + info.groupFormed);
                        if (info.groupFormed) {
                            Log.d(TAG, "✅ Group formed successfully, device connected");
                            promise.resolve(null);
                        } else {
                            Log.w(TAG, "⚠️ Group not formed yet after connection");
                            // In some cases, the group formation takes time after connection is initiated
                            // We'll resolve the promise since the connection was initiated successfully
                            promise.resolve(null);
                        }
                    }
                });
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "Connection to " + deviceAddress + " failed with reason: " + reason);
                
                String errorMessage = "Failed to connect to peer. ";
                switch (reason) {
                    case WifiP2pManager.P2P_UNSUPPORTED:
                        errorMessage += "Wi-Fi Direct is not supported on this device.";
                        break;
                    case WifiP2pManager.BUSY:
                        errorMessage += "Wi-Fi Direct is busy. Please try again in a few seconds.";
                        break;
                    case WifiP2pManager.ERROR:
                        errorMessage += "Wi-Fi Direct internal error occurred. Ensure Wi-Fi and Location are enabled.";
                        break;
                    default:
                        errorMessage += "Error code: " + reason;
                        break;
                }
                
                promise.reject("CONNECTION_FAILED", errorMessage);
            }
        });
    }

    @Override
    public void onConnectionInfoAvailable(WifiP2pInfo info) {
        Log.d(TAG, "Connection info available.");
        if (info.groupFormed) {
            WritableMap connectionInfo = Arguments.createMap();
            connectionInfo.putBoolean("groupFormed", info.groupFormed);
            connectionInfo.putBoolean("isGroupOwner", info.isGroupOwner);
            if (info.groupFormed && info.groupOwnerAddress != null) {
                connectionInfo.putString("groupOwnerAddress", info.groupOwnerAddress.getHostAddress());
                Log.d(TAG, "✅ Group owner address: " + info.groupOwnerAddress.getHostAddress());
            } else {
                Log.e(TAG, "❌ Group owner address is null!");
            }
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onConnectionInfoAvailable", connectionInfo);
        } else {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onConnectionRequest", null);
        }
    }

    @ReactMethod
    public void acceptConnection(Promise promise) {
        if (manager == null || channel == null) {
            promise.reject("NOT_INITIALIZED", "Wi-Fi Direct has not been initialized.");
            return;
        }

        // CRITICAL FIX: Clean up any existing group before creating new one
        // This prevents "WiFi Direct is busy" error
        manager.removeGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "✅ Existing group cleared, waiting 2 seconds for system to stabilize...");
                // Wait 2 seconds after cleanup to ensure system is stable
                new Thread(() -> {
                    try {
                        Thread.sleep(2000);
                        Log.d(TAG, "⏱️ Wait complete, now creating new group for accept connection...");
                        createGroupForAccept(promise);
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Wait interrupted", e);
                        createGroupForAccept(promise);
                    }
                }).start();
            }

            @Override
            public void onFailure(int reason) {
                Log.w(TAG, "⚠️ No existing group to clear or clear failed: " + reason + ", waiting 1.5 seconds...");
                // Wait before trying to create group even if cleanup failed
                new Thread(() -> {
                    try {
                        Thread.sleep(1500);
                        Log.d(TAG, "⏱️ Wait complete after cleanup failure, attempting group creation...");
                        createGroupForAccept(promise);
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Wait interrupted", e);
                        createGroupForAccept(promise);
                    }
                }).start();
            }
        });
    }

    private void createGroupForAccept(Promise promise) {
        manager.createGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "✅ Group created (connection accepted).");

                // After creating group, wait for IP address to be assigned, then get our IP address as group owner
                new Thread(() -> {
                    try {
                        // Wait 3 seconds for IP assignment to complete
                        Thread.sleep(3000);
                        
                        // Retry getting connection info multiple times with delay
                        getConnectionInfoWithRetry(promise, 5); // Try 5 times
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Group creation wait interrupted", e);
                        promise.reject("ACCEPT_FAILED", "Group creation interrupted");
                    }
                }).start();
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "❌ Failed to create group (accept connection) with reason: " + reason);
                promise.reject("ACCEPT_FAILED", "Failed to accept connection.");
            }
        });
    }

    private void getConnectionInfoWithRetry(Promise originalPromise, int maxAttempts) {
        getConnectionInfoWithRetry(originalPromise, maxAttempts, 0);
    }

    private void getConnectionInfoWithRetry(Promise originalPromise, int maxAttempts, int currentAttempt) {
        if (currentAttempt >= maxAttempts) {
            Log.e(TAG, "❌ Failed to get connection info after " + maxAttempts + " attempts");
            originalPromise.reject("CONNECTION_INFO_FAILED", "Failed to get connection info after retries");
            return;
        }

        manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
            @Override
            public void onConnectionInfoAvailable(WifiP2pInfo wifiP2pInfo) {
                Log.d(TAG, "getConnectionInfoWithRetry - Attempt " + (currentAttempt + 1) + 
                      " - groupFormed: " + wifiP2pInfo.groupFormed + 
                      ", isGroupOwner: " + wifiP2pInfo.isGroupOwner + 
                      ", groupOwnerAddress: " + (wifiP2pInfo.groupOwnerAddress != null ? wifiP2pInfo.groupOwnerAddress.getHostAddress() : "null"));

                if (wifiP2pInfo.groupFormed && wifiP2pInfo.isGroupOwner) {
                    if (wifiP2pInfo.groupOwnerAddress != null) {
                        String groupOwnerIP = wifiP2pInfo.groupOwnerAddress.getHostAddress();
                        
                        // Validate that group owner address is a valid IP (not 0.0.0.0)
                        if (groupOwnerIP != null && !groupOwnerIP.equals("0.0.0.0") && !groupOwnerIP.isEmpty()) {
                            Log.d(TAG, "✅ Valid group owner IP: " + groupOwnerIP);

                            // Emit group owner IP to sender
                            WritableMap ipData = Arguments.createMap();
                            ipData.putString("groupOwnerIP", groupOwnerIP);
                            ipData.putInt("serverPort", 8989);
                            ipData.putBoolean("isGroupOwner", true);

                            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("onGroupOwnerIPAvailable", ipData);

                            Log.d(TAG, "📡 Emitted group owner IP to sender: " + groupOwnerIP);
                            originalPromise.resolve(null);
                        } else {
                            Log.w(TAG, "⚠️ Group owner IP is invalid (" + groupOwnerIP + "), retrying...");
                            // Wait 1.5 seconds before next attempt
                            new Thread(() -> {
                                try {
                                    Thread.sleep(1500);
                                    getConnectionInfoWithRetry(originalPromise, maxAttempts, currentAttempt + 1);
                                } catch (InterruptedException e) {
                                    Log.e(TAG, "Retry interrupted", e);
                                    originalPromise.reject("CONNECTION_INFO_FAILED", "Connection info retrieval interrupted");
                                }
                            }).start();
                        }
                    } else {
                        Log.w(TAG, "⚠️ Group owner address is null, retrying...");
                        // Wait 1.5 seconds before next attempt
                        new Thread(() -> {
                            try {
                                Thread.sleep(1500);
                                getConnectionInfoWithRetry(originalPromise, maxAttempts, currentAttempt + 1);
                            } catch (InterruptedException e) {
                                Log.e(TAG, "Retry interrupted", e);
                                originalPromise.reject("CONNECTION_INFO_FAILED", "Connection info retrieval interrupted");
                            }
                        }).start();
                    }
                } else {
                    Log.w(TAG, "⚠️ Group not formed or not group owner, retrying...");
                    // Wait 1.5 seconds before next attempt
                    new Thread(() -> {
                        try {
                            Thread.sleep(1500);
                            getConnectionInfoWithRetry(originalPromise, maxAttempts, currentAttempt + 1);
                        } catch (InterruptedException e) {
                            Log.e(TAG, "Retry interrupted", e);
                            originalPromise.reject("CONNECTION_INFO_FAILED", "Connection info retrieval interrupted");
                        }
                    }).start();
                }
            }
        });
    }

    @ReactMethod
    public void discoverPeers(Promise promise) {
        if (manager == null || channel == null) {
            Log.e(TAG, "discoverPeers: Manager or Channel not initialized");
            promise.reject("NOT_INITIALIZED", "Wi-Fi Direct has not been initialized.");
            return;
        }

        // Check if Wi-Fi Direct is enabled
        if (!isWifiP2pEnabled()) {
            Log.e(TAG, "discoverPeers: Wi-Fi Direct is not enabled");
            promise.reject("WIFI_P2P_DISABLED", "Wi-Fi Direct is not enabled on this device. Please enable it in settings.");
            return;
        }

        manager.discoverPeers(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Peer discovery started successfully.");
                promise.resolve(null);
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "discoverPeers onFailure with reason code: " + reason);
                String errorMessage;
                switch (reason) {
                    case WifiP2pManager.P2P_UNSUPPORTED:
                        errorMessage = "Wi-Fi Direct is not supported on this device.";
                        Log.e(TAG, "Wi-Fi Direct not supported by hardware");
                        break;
                    case WifiP2pManager.BUSY:
                        errorMessage = "Wi-Fi Direct is busy. Please try again in a few seconds.";
                        Log.e(TAG, "Wi-Fi Direct is busy");
                        break;
                    case WifiP2pManager.ERROR:
                        errorMessage = "Wi-Fi Direct internal error occurred. Make sure Wi-Fi and Location are enabled.";
                        Log.e(TAG, "Wi-Fi Direct internal error");
                        break;
                    default:
                        errorMessage = "An internal error occurred (code: " + reason + "). Please try again.";
                        Log.e(TAG, "Unknown error code: " + reason);
                        break;
                }
                Log.e(TAG, "Failed to start peer discovery: " + errorMessage);
                promise.reject("DISCOVERY_FAILED", errorMessage);
            }
        });
    }

    // Helper method to check if Wi-Fi Direct is enabled
    private boolean isWifiP2pEnabled() {
        // Note: This is a workaround since the direct API isn't available
        // In a real implementation, you'd need a proper way to check P2P state
        return true; // Assume enabled for now
    }

    // Additional methods needed by SpredP2PService interface
    
    @ReactMethod
    public void startDiscoveringPeers(Promise promise) {
        // This method should match the TypeScript interface
        discoverPeers(promise);
    }

    @ReactMethod
    public void connectToDevice(String deviceAddress, Promise promise) {
        // This method should match the TypeScript interface
        connect(deviceAddress, promise);
    }

    
    @ReactMethod
    public void isWiFiDirectSupported(Promise promise) {
        if (manager == null) {
            Log.e(TAG, "isWiFiDirectSupported: manager is null");
            promise.resolve(false);
            return;
        }

        // Check if device supports Wi-Fi Direct capability
        boolean isSupported = reactContext.getPackageManager()
            .hasSystemFeature(PackageManager.FEATURE_WIFI_DIRECT);
        
        Log.d(TAG, "isWiFiDirectSupported: " + isSupported);
        
        // Additionally check if it's enabled
        if (isSupported) {
            // Note: We can't directly check if Wi-Fi Direct is enabled through public APIs
            // This requires checking if the device allows Wi-Fi Direct operations
            promise.resolve(true);
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void isLocationEnabled(Promise promise) {
        try {
            int locationMode = android.provider.Settings.Secure.getInt(
                reactContext.getContentResolver(),
                android.provider.Settings.Secure.LOCATION_MODE
            );
            boolean isEnabled = locationMode != android.provider.Settings.Secure.LOCATION_MODE_OFF;
            promise.resolve(isEnabled);
        } catch (android.provider.Settings.SettingNotFoundException e) {
            Log.e(TAG, "Could not determine location status", e);
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void isWiFiEnabled(Promise promise) {
        // For Wi-Fi Direct, we check if Wi-Fi Direct is enabled rather than regular WiFi
        // Wi-Fi Direct manager can tell us this status
        if (manager != null) {
            // Note: manager.isWifiP2pEnabled is not available in public API
            // We'll assume it's enabled if manager is initialized
            promise.resolve(true);
        } else {
            promise.resolve(false);
        }
    }

    @ReactMethod
    public void stopDiscoveringPeers(Promise promise) {
        // Stop peer discovery - Android doesn't have a direct stop method
        // This is handled automatically by the system
        promise.resolve(null);
    }

    @ReactMethod
    public void getAvailablePeers(Promise promise) {
        try {
            Log.d(TAG, "getAvailablePeers() called - discoveredPeers size: " + discoveredPeers.size());

            WritableMap result = Arguments.createMap();

            // Create a new array each time to avoid "Array already consumed" error
            WritableArray peersArray = Arguments.createArray();
            for (int i = 0; i < discoveredPeers.size(); i++) {
                WritableMap peer = (WritableMap) discoveredPeers.getMap(i);
                Log.d(TAG, "Adding peer: " + peer.getString("name") + " (" + peer.getString("address") + ")");
                peersArray.pushMap(peer);
            }

            result.putArray("devices", peersArray);
            Log.d(TAG, "Returning " + peersArray.size() + " peers to JavaScript");
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "getAvailablePeers error:", e);
            promise.reject("GET_AVAILABLE_PEERS_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void disconnect(Promise promise) {
        if (manager == null || channel == null) {
            promise.resolve(null);
            return;
        }

        manager.removeGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "Disconnected from P2P group");
                promise.resolve(null);
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "Failed to disconnect: " + reason);
                promise.resolve(null); // Resolve anyway to avoid blocking
            }
        });
    }

    @ReactMethod
    public void getConnectionInfo(Promise promise) {
        // Return current connection info
        WritableMap info = Arguments.createMap();
        info.putBoolean("connected", false);
        promise.resolve(info);
    }

    @ReactMethod
    public void sendFile(String filePath, String targetAddress, Promise promise) {
        // Real file transfer implementation with progress tracking
        try {
            File sourceFile = new File(filePath);
            if (!sourceFile.exists()) {
                promise.reject("FILE_NOT_FOUND", "Source file not found: " + filePath);
                return;
            }

            Log.d(TAG, "Starting real file transfer: " + sourceFile.getName() + " to " + targetAddress);

            // FIX: Don't create another group - connect to receiver's existing group and server
            Log.d(TAG, "📡 Connecting to receiver's server at 192.168.49.1:8989...");
            connectToReceiverAndTransfer(sourceFile, targetAddress, promise);

        } catch (Exception e) {
            Log.e(TAG, "File transfer setup failed", e);
            promise.reject("TRANSFER_FAILED", "File transfer setup failed: " + e.getMessage());
        }
    }

    private void connectToReceiverAndTransfer(File sourceFile, String receiverAddress, Promise promise) {
        try {
            // Create WiFi Direct config to connect to receiver
            WifiP2pConfig config = new WifiP2pConfig();
            config.deviceAddress = receiverAddress;
            config.wps.setup = WpsInfo.PBC;

            Log.d(TAG, "📡 Connecting to receiver: " + receiverAddress);

            manager.connect(channel, config, new WifiP2pManager.ActionListener() {
                @Override
                public void onSuccess() {
                    Log.d(TAG, "✅ Connected to receiver's group!");

                    // Wait for connection to establish, then connect to receiver's server
                    new Thread(() -> {
                        try {
                            Thread.sleep(3000); // Wait for group formation

                            // Get connection info
                            manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
                                @Override
                                public void onConnectionInfoAvailable(WifiP2pInfo wifiP2pInfo) {
                                    if (wifiP2pInfo.groupFormed) {
                                        if (wifiP2pInfo.isGroupOwner) {
                                            // We're the group owner (shouldn't happen in this flow)
                                            Log.w(TAG, "⚠️ We became Group Owner, adjusting flow...");
                                            startFileTransfer(sourceFile, receiverAddress, promise);
                                        } else {
                                            // We're the client - connect to receiver's server (192.168.49.1 is default GO IP)
                                            String receiverIP = "192.168.49.1"; // Standard GO IP
                                            Log.d(TAG, "✅ Connected as client, connecting to receiver's server at " + receiverIP + ":8989");
                                            connectToReceiverServer(sourceFile, receiverIP, 8989, promise);
                                        }
                                    } else {
                                        Log.e(TAG, "❌ Group not formed");
                                        promise.reject("CONNECTION_FAILED", "Failed to form WiFi Direct group");
                                    }
                                }
                            });
                        } catch (InterruptedException e) {
                            Log.e(TAG, "Connection wait interrupted", e);
                            promise.reject("CONNECTION_FAILED", "Connection interrupted");
                        }
                    }).start();
                }

                @Override
                public void onFailure(int reason) {
                    Log.e(TAG, "❌ Failed to connect to receiver: " + reason);
                    promise.reject("CONNECTION_FAILED", "Failed to connect to receiver: " + reason);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "❌ Connect to receiver failed", e);
            promise.reject("CONNECTION_FAILED", "Failed to connect to receiver: " + e.getMessage());
        }
    }

    private void connectToReceiverServer(File sourceFile, String receiverIP, int port, Promise promise) {
        new Thread(() -> {
            Socket socket = null;
            try {
                Log.d(TAG, "📡 Connecting to receiver server: " + receiverIP + ":" + port);

                // Create socket connection to receiver's server
                socket = new Socket();
                socket.connect(new InetSocketAddress(receiverIP, port), 15000); // Increased timeout to 15 seconds
                socket.setSoTimeout(30000); // 30 second read timeout

                Log.d(TAG, "✅ Connected to receiver server");

                // Send file
                sendFileOverSocket(sourceFile, socket, promise);

            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to connect to receiver server", e);
                promise.reject("CONNECTION_FAILED", "Failed to connect to receiver server: " + e.getMessage());
            } finally {
                // Close the socket to prevent resource leaks
                if (socket != null && !socket.isClosed()) {
                    try {
                        socket.close();
                    } catch (IOException ioEx) {
                        Log.e(TAG, "Error closing socket in finally", ioEx);
                    }
                }
            }
        }).start();
    }

    private void sendFileOverSocket(File sourceFile, Socket socket, Promise promise) {
        try {
            String fileName = sourceFile.getName();
            long fileSize = sourceFile.length();

            // Get output stream to receiver
            OutputStream outputStream = socket.getOutputStream();
            DataOutputStream dataOutputStream = new DataOutputStream(outputStream);

            // Send file metadata first
            dataOutputStream.writeUTF(fileName);
            dataOutputStream.writeLong(fileSize);
            dataOutputStream.flush();

            // Send file content
            FileInputStream fileInputStream = new FileInputStream(sourceFile);
            byte[] buffer = new byte[8192];
            long totalBytesSent = 0;
            int bytesRead;

            Log.d(TAG, "📤 Starting file streaming: " + fileName + " (" + fileSize + " bytes)");

            while ((bytesRead = fileInputStream.read(buffer)) != -1) {
                dataOutputStream.write(buffer, 0, bytesRead);
                totalBytesSent += bytesRead;

                // Calculate and emit progress
                int progress = (int) ((totalBytesSent * 100) / fileSize);

                // Create separate maps for event emission and logging
                WritableMap progressData = Arguments.createMap();
                progressData.putString("fileName", fileName);
                progressData.putInt("progress", progress);
                progressData.putDouble("bytesTransferred", totalBytesSent);
                progressData.putDouble("totalBytes", fileSize);
                progressData.putString("targetAddress", socket.getInetAddress().getHostAddress());
                progressData.putString("status", "sending");

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onTransferProgress", progressData);

                Log.d(TAG, "📤 Transfer progress: " + progress + "% (" + totalBytesSent + "/" + fileSize + " bytes)");
            }

            // Clean up
            fileInputStream.close();
            dataOutputStream.flush();
            dataOutputStream.close();

            Log.d(TAG, "✅ File transfer completed: " + fileName);

            // Create result for promise resolution
            WritableMap result = Arguments.createMap();
            result.putString("status", "success");
            result.putString("filePath", sourceFile.getAbsolutePath());
            result.putString("fileName", fileName);
            result.putDouble("fileSize", fileSize);
            result.putString("targetAddress", socket.getInetAddress().getHostAddress());
            result.putString("transferType", "wifi-direct");

            // Create separate map for completion event
            WritableMap completionData = Arguments.createMap();
            completionData.putString("status", "success");
            completionData.putString("filePath", sourceFile.getAbsolutePath());
            completionData.putString("fileName", fileName);
            completionData.putDouble("fileSize", fileSize);
            completionData.putString("targetAddress", socket.getInetAddress().getHostAddress());
            completionData.putString("transferType", "wifi-direct");

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onTransferComplete", completionData);

            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "❌ File transfer over socket failed", e);
            promise.reject("SOCKET_TRANSFER_FAILED", "Socket transfer failed: " + e.getMessage());
        } finally {
            try {
                socket.close();
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to close socket", e);
            }
        }
    }

    private void startFileTransfer(File sourceFile, String targetAddress, Promise promise) {
        new Thread(() -> {
            try {
                // Wait 3 seconds for connection to fully stabilize
                Log.d(TAG, "⏳ Waiting 3 seconds for connection to stabilize...");
                Thread.sleep(3000);

                performRealFileTransfer(sourceFile, targetAddress, promise);
            } catch (Exception e) {
                Log.e(TAG, "File transfer thread failed", e);
                promise.reject("TRANSFER_FAILED", "File transfer failed: " + e.getMessage());
            }
        }).start();
    }

    private void createGroupAndTransfer(File sourceFile, String targetAddress, Promise promise) {
        // Create a group first, then transfer the file
        manager.createGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "✅ WiFi Direct group created, now waiting for IP assignment and starting transfer...");

                // Wait for IP assignment before starting the transfer
                new Thread(() -> {
                    try {
                        // Wait 4 seconds for IP assignment to complete
                        Thread.sleep(4000);

                        // Verify that we're in a group before transferring
                        manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
                            @Override
                            public void onConnectionInfoAvailable(WifiP2pInfo wifiP2pInfo) {
                                if (wifiP2pInfo.groupFormed && wifiP2pInfo.isGroupOwner) {
                                    Log.d(TAG, "✅ Confirmed in WiFi Direct group as Group Owner, starting transfer...");
                                    startFileTransfer(sourceFile, targetAddress, promise);
                                } else {
                                    Log.e(TAG, "❌ Not in proper WiFi Direct group after group creation");
                                    promise.reject("GROUP_FORMATION_FAILED", "Failed to establish proper WiFi Direct group for file transfer");
                                }
                            }
                        });
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Group creation wait interrupted", e);
                        promise.reject("TRANSFER_SETUP_FAILED", "File transfer setup interrupted");
                    }
                }).start();
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "❌ Failed to create WiFi Direct group for file transfer: " + reason);
                String errorMessage = "Failed to create WiFi Direct group. ";
                switch (reason) {
                    case WifiP2pManager.P2P_UNSUPPORTED:
                        errorMessage += "Wi-Fi Direct is not supported on this device.";
                        break;
                    case WifiP2pManager.BUSY:
                        errorMessage += "Wi-Fi Direct is busy. Please try again in a few seconds.";
                        break;
                    case WifiP2pManager.ERROR:
                        errorMessage += "Wi-Fi Direct internal error occurred. Ensure Wi-Fi and Location are enabled.";
                        break;
                    default:
                        errorMessage += "Error code: " + reason;
                        break;
                }
                promise.reject("GROUP_CREATION_FAILED", errorMessage);
            }
        });
    }

    private void performRealFileTransfer(File sourceFile, String targetAddress, Promise promise) {
        try {
            String fileName = sourceFile.getName();
            long fileSize = sourceFile.length();

            Log.d(TAG, "🚀 Starting REAL WiFi Direct file transfer: " + fileName + " (" + fileSize + " bytes) to " + targetAddress);

            // First, try to clear any existing group
            Log.d(TAG, "📡 Clearing any existing WiFi Direct group...");
            manager.removeGroup(channel, new WifiP2pManager.ActionListener() {
                @Override
                public void onSuccess() {
                    Log.d(TAG, "✅ Existing group cleared, now creating new group...");
                    // Now create the group after clearing
                    createGroupWithRetry(sourceFile, targetAddress, promise, 0);
                }

                @Override
                public void onFailure(int reason) {
                    Log.w(TAG, "⚠️ No existing group to clear or clear failed: " + reason);
                    // Continue anyway and try to create group
                    createGroupWithRetry(sourceFile, targetAddress, promise, 0);
                }
            });

        } catch (Exception e) {
            Log.e(TAG, "❌ WiFi Direct file transfer setup failed", e);
            promise.reject("TRANSFER_SETUP_FAILED", "WiFi Direct transfer setup failed: " + e.getMessage());
        }
    }

    private void createGroupWithRetry(File sourceFile, String targetAddress, Promise promise, int attemptCount) {
        if (attemptCount >= 5) { // Increased from 3 to 5 attempts
            Log.e(TAG, "❌ Failed to create WiFi Direct group after 5 attempts");
            promise.reject("GROUP_CREATION_FAILED", "Failed to create WiFi Direct group after retries. Please try again.");
            return;
        }

        Log.d(TAG, "📡 Attempt " + (attemptCount + 1) + "/5 - Creating WiFi Direct group...");

        // CRITICAL FIX: Clean up any existing group/connection before creating new one
        // This prevents "WiFi Direct is busy" error
        manager.removeGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "✅ Existing group cleared, waiting 2 seconds for system to stabilize...");
                // Wait 2 seconds after cleanup to ensure system is stable
                new Thread(() -> {
                    try {
                        Thread.sleep(2000);
                        Log.d(TAG, "⏱️ Wait complete, now creating new group...");
                        createGroupAfterCleanup(sourceFile, targetAddress, promise, attemptCount);
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Wait interrupted", e);
                        createGroupAfterCleanup(sourceFile, targetAddress, promise, attemptCount);
                    }
                }).start();
            }

            @Override
            public void onFailure(int reason) {
                Log.w(TAG, "⚠️ No existing group to clear or clear failed: " + reason + ", waiting 1.5 seconds...");
                // Wait before trying to create group even if cleanup failed
                new Thread(() -> {
                    try {
                        Thread.sleep(1500);
                        Log.d(TAG, "⏱️ Wait complete after cleanup failure, attempting group creation...");
                        createGroupAfterCleanup(sourceFile, targetAddress, promise, attemptCount);
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Wait interrupted", e);
                        createGroupAfterCleanup(sourceFile, targetAddress, promise, attemptCount);
                    }
                }).start();
            }
        });
    }

    private void createGroupAfterCleanup(File sourceFile, String targetAddress, Promise promise, int attemptCount) {
        manager.createGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "✅ WiFi Direct group created successfully on attempt " + (attemptCount + 1));
                
                // After creating the group, wait a bit for the group formation to fully complete
                new Thread(() -> {
                    try {
                        // Wait 3 seconds for group formation to fully complete and IP address to be assigned
                        Thread.sleep(3000);
                        Log.d(TAG, "⏳ Group formation wait completed, now starting socket server and transfer");
                        startSocketServerAndTransfer(sourceFile, targetAddress, promise);
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Group formation wait interrupted", e);
                        promise.reject("GROUP_CREATION_FAILED", "WiFi Direct group formation interrupted");
                    }
                }).start();
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "❌ Failed to create WiFi Direct group (attempt " + (attemptCount + 1) + "): " + reason);

                if (reason == 2) { // ERROR code 2 - try again
                    Log.d(TAG, "🔄 Retrying in 1.5 seconds...");
                    try {
                        Thread.sleep(1500);
                        createGroupWithRetry(sourceFile, targetAddress, promise, attemptCount + 1);
                    } catch (InterruptedException ie) {
                        Log.e(TAG, "Retry interrupted", ie);
                        promise.reject("GROUP_CREATION_FAILED", "WiFi Direct group creation interrupted");
                    }
                } else {
                    promise.reject("GROUP_CREATION_FAILED", "Failed to create WiFi Direct group: " + reason);
                }
            }
        });
    }

    private void startSocketServerAndTransfer(File sourceFile, String targetAddress, Promise promise) {
        try {
            // Start socket server in background thread
            serverThread = new Thread(() -> {
                ServerSocket localServerSocket = null;
                try {
                    // Create server socket on a dynamically assigned port to avoid conflicts
                    localServerSocket = new ServerSocket(0); // 0 means system will assign an available port
                    int assignedPort = localServerSocket.getLocalPort();
                    fileTransferServer = localServerSocket; // Store reference for cleanup
                    isServerRunning = true;
                    Log.d(TAG, "📡 File transfer server started on port " + assignedPort);

                    // Send connection info to target device via WiFi Direct with the correct port
                    sendConnectionRequestToTarget(targetAddress, sourceFile.getName(), sourceFile.length(), assignedPort, promise);

                    // Set socket timeout for client connection acceptance
                    localServerSocket.setSoTimeout(30000); // 30 seconds timeout
                    
                    // Wait for client to connect
                    Socket clientSocket = localServerSocket.accept();
                    Log.d(TAG, "✅ Client connected: " + clientSocket.getInetAddress().getHostAddress());

                    // Transfer file over socket
                    transferFileOverSocket(sourceFile, clientSocket, promise);

                } catch (Exception e) {
                    Log.e(TAG, "❌ Socket server failed", e);
                    promise.reject("SOCKET_SERVER_FAILED", "Socket server failed: " + e.getMessage());
                } finally {
                    // Close the local server socket
                    if (localServerSocket != null && !localServerSocket.isClosed()) {
                        try {
                            localServerSocket.close();
                        } catch (IOException ioEx) {
                            Log.e(TAG, "Error closing server socket in finally", ioEx);
                        }
                    }
                    cleanupServer();
                }
            });
            serverThread.start();

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start socket server", e);
            promise.reject("SERVER_START_FAILED", "Failed to start socket server: " + e.getMessage());
        }
    }

    private void sendConnectionRequestToTarget(String targetAddress, String fileName, long fileSize, int port, Promise outerPromise) {
        try {
            // Get our own IP address (group owner) with retry mechanism using the assigned port
            requestGroupOwnerAddressWithRetry(targetAddress, fileName, fileSize, port, outerPromise, 0);
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to send connection request", e);
        }
    }

    private void requestGroupOwnerAddressWithRetry(String targetAddress, String fileName, long fileSize, int port, Promise outerPromise, int attemptCount) {
        if (attemptCount >= 10) { // Increased from 5 to 10 attempts
            Log.e(TAG, "❌ Failed to get group owner IP address after 10 attempts");
            outerPromise.reject("INVALID_ADDRESS", "Failed to get group owner IP address after retries");
            return;
        }

        manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
            @Override
            public void onConnectionInfoAvailable(WifiP2pInfo wifiP2pInfo) {
                Log.d(TAG, "onConnectionInfoAvailable called - groupFormed: " + wifiP2pInfo.groupFormed + 
                      ", isGroupOwner: " + wifiP2pInfo.isGroupOwner + 
                      ", groupOwnerAddress: " + (wifiP2pInfo.groupOwnerAddress != null ? wifiP2pInfo.groupOwnerAddress.getHostAddress() : "null"));

                if (wifiP2pInfo.groupFormed && wifiP2pInfo.isGroupOwner) {
                    String groupOwnerAddress = null;

                    if (wifiP2pInfo.groupOwnerAddress != null) {
                        groupOwnerAddress = wifiP2pInfo.groupOwnerAddress.getHostAddress();
                        
                        // Validate that group owner address is a valid IP (not 0.0.0.0)
                        if (groupOwnerAddress != null && !groupOwnerAddress.equals("0.0.0.0") && !groupOwnerAddress.isEmpty()) {
                            Log.d(TAG, "✅ Valid group owner address retrieved: " + groupOwnerAddress);

                            Log.d(TAG, "📡 Sending connection request to " + targetAddress + " - Connect to: " + groupOwnerAddress + ":" + port);

                            // Send connection request via WiFi Direct
                            WritableMap connectionData = Arguments.createMap();
                            connectionData.putString("type", "FILE_TRANSFER_REQUEST");
                            connectionData.putString("fileName", fileName);
                            connectionData.putDouble("fileSize", fileSize);
                            connectionData.putString("serverAddress", groupOwnerAddress);
                            connectionData.putInt("serverPort", port);

                            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                                .emit("p2pConnectionRequest", connectionData);
                        } else {
                            // IP address is not valid yet (0.0.0.0 or empty), retry after delay
                            Log.w(TAG, "⚠️ Group owner address is invalid (" + groupOwnerAddress + ") on attempt " + (attemptCount + 1) + ", retrying in 1.5 seconds...");
                            try {
                                Thread.sleep(1500); // Increased delay to 1.5 seconds
                                requestGroupOwnerAddressWithRetry(targetAddress, fileName, fileSize, port, outerPromise, attemptCount + 1);
                            } catch (InterruptedException e) {
                                Log.e(TAG, "Retry interrupted", e);
                                outerPromise.reject("INVALID_ADDRESS", "Failed to get group owner IP address");
                            }
                        }
                    } else {
                        // IP address not ready yet, retry after delay
                        Log.w(TAG, "⚠️ Group owner address is null on attempt " + (attemptCount + 1) + ", retrying in 1.5 seconds...");
                        try {
                            Thread.sleep(1500); // Increased delay to 1.5 seconds
                            requestGroupOwnerAddressWithRetry(targetAddress, fileName, fileSize, port, outerPromise, attemptCount + 1);
                        } catch (InterruptedException e) {
                            Log.e(TAG, "Retry interrupted", e);
                            outerPromise.reject("INVALID_ADDRESS", "Failed to get group owner IP address");
                        }
                    }
                } else {
                    Log.e(TAG, "❌ Group not formed or not group owner");
                    outerPromise.reject("INVALID_ADDRESS", "Group not formed or not group owner");
                }
            }
        });
    }

    private void transferFileOverSocket(File sourceFile, Socket clientSocket, Promise promise) {
        try {
            String fileName = sourceFile.getName();
            long fileSize = sourceFile.length();

            // Get output stream to client
            OutputStream outputStream = clientSocket.getOutputStream();
            DataOutputStream dataOutputStream = new DataOutputStream(outputStream);

            // Send file metadata first
            dataOutputStream.writeUTF(fileName);
            dataOutputStream.writeLong(fileSize);
            dataOutputStream.flush();

            // Send file content
            FileInputStream fileInputStream = new FileInputStream(sourceFile);
            byte[] buffer = new byte[8192];
            long totalBytesSent = 0;
            int bytesRead;

            Log.d(TAG, "📤 Starting file streaming: " + fileName + " (" + fileSize + " bytes)");

            while ((bytesRead = fileInputStream.read(buffer)) != -1) {
                dataOutputStream.write(buffer, 0, bytesRead);
                totalBytesSent += bytesRead;

                // Calculate and emit progress
                int progress = (int) ((totalBytesSent * 100) / fileSize);

                // Create separate maps for event emission and logging
                WritableMap progressData = Arguments.createMap();
                progressData.putString("fileName", fileName);
                progressData.putInt("progress", progress);
                progressData.putDouble("bytesTransferred", totalBytesSent);
                progressData.putDouble("totalBytes", fileSize);
                progressData.putString("targetAddress", clientSocket.getInetAddress().getHostAddress());
                progressData.putString("status", "sending");

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onTransferProgress", progressData);

                Log.d(TAG, "📤 Transfer progress: " + progress + "% (" + totalBytesSent + "/" + fileSize + " bytes)");
            }

            // Clean up
            fileInputStream.close();
            dataOutputStream.flush();
            dataOutputStream.close();

            Log.d(TAG, "✅ File transfer completed: " + fileName);

            // Create result for promise resolution (different object from progressData)
            WritableMap result = Arguments.createMap();
            result.putString("status", "success");
            result.putString("filePath", sourceFile.getAbsolutePath()); // Source file was sent successfully
            result.putString("fileName", fileName);
            result.putDouble("fileSize", fileSize);
            result.putString("targetAddress", clientSocket.getInetAddress().getHostAddress());
            result.putString("transferType", "wifi-direct");

            // Create separate map for completion event
            WritableMap completionData = Arguments.createMap();
            completionData.putString("status", "success");
            completionData.putString("filePath", sourceFile.getAbsolutePath());
            completionData.putString("fileName", fileName);
            completionData.putDouble("fileSize", fileSize);
            completionData.putString("targetAddress", clientSocket.getInetAddress().getHostAddress());
            completionData.putString("transferType", "wifi-direct");

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onTransferComplete", completionData);

            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "❌ File transfer over socket failed", e);
            promise.reject("SOCKET_TRANSFER_FAILED", "Socket transfer failed: " + e.getMessage());
        } finally {
            try {
                clientSocket.close();
            } catch (Exception e) {
                Log.e(TAG, "❌ Failed to close client socket", e);
            }
        }
    }

    private void cleanupServer() {
        try {
            isServerRunning = false;
            if (fileTransferServer != null && !fileTransferServer.isClosed()) {
                fileTransferServer.close();
                fileTransferServer = null;
            }
            Log.d(TAG, "📡 Socket server cleaned up");
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to cleanup server", e);
        }
    }

    private String getGroupOwnerIPAddress() {
        try {
            // Get the group owner's IP address
            // For simplicity, return a default WiFi Direct IP
            // In real implementation, this would get the actual group owner IP
            return "192.168.49.1"; // Default WiFi Direct group owner IP
        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to get group owner IP", e);
            return "192.168.49.1"; // Fallback to default
        }
    }

    @ReactMethod
    public void handleP2PConnectionRequest(String serverAddress, int serverPort, String fileName, double fileSize, Promise promise) {
        try {
            Log.d(TAG, "📨 handleP2PConnectionRequest called: " + fileName + " from " + serverAddress + ":" + serverPort);

            // Handle the connection request
            handleConnectionRequest(serverAddress, serverPort, fileName, (long) fileSize);

            // Resolve promise immediately - the actual file transfer will resolve its own promise
            WritableMap result = Arguments.createMap();
            result.putString("status", "connection_request_handled");
            result.putString("serverAddress", serverAddress);
            result.putInt("serverPort", serverPort);
            result.putString("fileName", fileName);
            promise.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to handle P2P connection request", e);
            promise.reject("CONNECTION_REQUEST_FAILED", "Failed to handle connection request: " + e.getMessage());
        }
    }

    @ReactMethod
    public void receiveFile(String destination, Promise promise) {
        Log.d(TAG, "🔥🔥🔥 receiveFile() CALLED! Destination: " + destination);
        // Real file receiving implementation
        try {
            Log.d(TAG, "Starting real file receive to: " + destination);

            // Start file receive in background thread
            Log.d(TAG, "🧵 Starting new Thread for receiveFile...");
            new Thread(() -> {
                Log.d(TAG, "🧵 Thread STARTED, calling performRealFileReceive()...");
                try {
                    performRealFileReceive(destination, promise);
                } catch (Exception e) {
                    Log.e(TAG, "File receive thread failed", e);
                    promise.reject("RECEIVE_FAILED", "File receive failed: " + e.getMessage());
                }
            }).start();
            Log.d(TAG, "🧵 Thread started, waiting...");

        } catch (Exception e) {
            Log.e(TAG, "File receive setup failed", e);
            promise.reject("RECEIVE_FAILED", "File receive setup failed: " + e.getMessage());
        }
    }

    private void performRealFileReceive(String destination, Promise promise) {
        try {
            Log.d(TAG, "📡 Starting REAL WiFi Direct file receive mode...");
            Log.d(TAG, "📋 Manager: " + (manager != null ? "initialized" : "NULL"));
            Log.d(TAG, "📋 Channel: " + (channel != null ? "initialized" : "NULL"));

            // Ensure destination directory exists
            File destDir = new File(destination);
            if (!destDir.exists()) {
                destDir.mkdirs();
                Log.d(TAG, "📁 Created directory: " + destination);
            }

            // CRITICAL FIX: Clean up any existing group before creating new one
            // This prevents "WiFi Direct is busy" error
            Log.d(TAG, "🔧 Cleaning up any existing groups before creating receiver group...");

            if (manager == null || channel == null) {
                Log.e(TAG, "❌ Manager or Channel is NULL! Cannot proceed with receive setup.");
                promise.reject("INITIALIZATION_ERROR", "WiFi Direct manager or channel not initialized");
                return;
            }

            try {
                manager.removeGroup(channel, new WifiP2pManager.ActionListener() {
                    @Override
                    public void onSuccess() {
                        Log.d(TAG, "✅ Existing group cleared, now creating new group for receiver...");
                        createGroupForReceive(destination, promise);
                    }

                    @Override
                    public void onFailure(int reason) {
                        Log.w(TAG, "⚠️ No existing group to clear or clear failed: " + reason + ", proceeding to create group...");
                        createGroupForReceive(destination, promise);
                    }
                });
            } catch (Exception e) {
                Log.w(TAG, "⚠️ Exception in removeGroup (no existing group?), proceeding anyway: " + e.getMessage());
                // No group to remove - this is fine, proceed
                createGroupForReceive(destination, promise);
            }
        } catch (Exception e) {
            Log.e(TAG, "❌ WiFi Direct file receive setup failed", e);
            promise.reject("RECEIVE_SETUP_FAILED", "WiFi Direct receive setup failed: " + e.getMessage());
        }
    }

    private void createGroupForReceive(String destination, Promise promise) {
        // FIXED: Create a WiFi Direct group to become Group Owner and run server
        Log.d(TAG, "🔧 Creating WiFi Direct group to become Group Owner (receiver)...");
        manager.createGroup(channel, new WifiP2pManager.ActionListener() {
            @Override
            public void onSuccess() {
                Log.d(TAG, "✅ Group created successfully! Device is now Group Owner (receiver)");

                // Wait for IP address assignment, then start server
                new Thread(() -> {
                    try {
                        // Wait 3 seconds for IP assignment
                        Thread.sleep(3000);

                        // Get connection info to confirm we're Group Owner
                        manager.requestConnectionInfo(channel, new WifiP2pManager.ConnectionInfoListener() {
                            @Override
                            public void onConnectionInfoAvailable(WifiP2pInfo wifiP2pInfo) {
                                if (wifiP2pInfo.groupFormed && wifiP2pInfo.isGroupOwner) {
                                    if (wifiP2pInfo.groupOwnerAddress != null) {
                                        String receiverIP = wifiP2pInfo.groupOwnerAddress.getHostAddress();
                                        Log.d(TAG, "✅ Receiver Group Owner IP: " + receiverIP);

                                        // Start file receive server
                                        startReceiveServer(receiverIP, 8989, destination, promise);
                                    } else {
                                        Log.e(TAG, "❌ Group owner address is null");
                                        promise.reject("RECEIVE_SETUP_FAILED", "Failed to get receiver IP address");
                                    }
                                } else {
                                    Log.e(TAG, "❌ Failed to become Group Owner");
                                    promise.reject("RECEIVE_SETUP_FAILED", "Failed to establish Group Owner mode");
                                }
                            }
                        });
                    } catch (InterruptedException e) {
                        Log.e(TAG, "Group creation wait interrupted", e);
                        promise.reject("RECEIVE_SETUP_FAILED", "Receiver setup interrupted");
                    }
                }).start();
            }

            @Override
            public void onFailure(int reason) {
                Log.e(TAG, "❌ Failed to create group for receiving: " + reason);
                promise.reject("RECEIVE_SETUP_FAILED", "Failed to setup receiver mode: " + reason);
            }
        });
    }

    private void startReceiveServer(String receiverIP, int port, String destination, Promise promise) {
        new Thread(() -> {
            try {
                Log.d(TAG, "📡 Starting file receive server on " + receiverIP + ":" + port);

                // Store destination and promise for when file arrives
                receiveDestination = destination;
                receivePromise = promise;

                // Create server socket
                ServerSocket serverSocket = new ServerSocket(port);
                Log.d(TAG, "✅ File receive server started, waiting for connections...");

                // Emit event to JavaScript with receiver info
                WritableMap receiverData = Arguments.createMap();
                receiverData.putString("type", "RECEIVER_READY");
                receiverData.putString("receiverIP", receiverIP);
                receiverData.putInt("receiverPort", port);
                receiverData.putBoolean("isGroupOwner", true);

                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onReceiverReady", receiverData);

                // CRITICAL FIX: Resolve promise immediately after server starts
                Log.d(TAG, "✅ Receiver mode ready - resolving promise");
                promise.resolve(destination);

                // Now wait for sender to connect (separate from Promise resolution)
                Socket clientSocket = serverSocket.accept();
                Log.d(TAG, "✅ Sender connected: " + clientSocket.getInetAddress().getHostAddress());

                // Receive file (use a separate promise for this specific transfer)
                receiveFileOverSocket(clientSocket, null, 0, destination, promise);

            } catch (Exception e) {
                Log.e(TAG, "❌ File receive server failed", e);
                if (receivePromise != null) {
                    receivePromise.reject("RECEIVE_SERVER_FAILED", "Receive server failed: " + e.getMessage());
                }
            }
        }).start();
    }

    private void startConnectionListener(String destination, Promise promise) {
        try {
            // This method will be called when we receive a connection request via event
            Log.d(TAG, "📡 Connection listener started - waiting for p2pConnectionRequest events...");

            // Store the destination and promise for when connection request comes in
            this.receiveDestination = destination;
            this.receivePromise = promise;

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start connection listener", e);
            promise.reject("LISTENER_FAILED", "Failed to start connection listener: " + e.getMessage());
        }
    }

    // New method to handle incoming connection requests
    private void handleConnectionRequest(String serverAddress, int serverPort, String fileName, long fileSize) {
        try {
            Log.d(TAG, "📨 Handling connection request: " + fileName + " from " + serverAddress + ":" + serverPort);

            if (receivePromise == null) {
                Log.e(TAG, "❌ No active receive promise");
                return;
            }

            // Connect to server as socket client
            connectToServerAndReceive(serverAddress, serverPort, fileName, fileSize, receiveDestination, receivePromise);

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to handle connection request", e);
            if (receivePromise != null) {
                receivePromise.reject("CONNECTION_REQUEST_FAILED", "Failed to handle connection request: " + e.getMessage());
            }
        }
    }

    private void connectToServerAndReceive(String serverAddress, int serverPort, String fileName, long fileSize, String destination, Promise promise) {
        try {
            // Start socket client in background thread
            new Thread(() -> {
                Socket socket = null;
                try {
                    Log.d(TAG, "📡 Connecting to server: " + serverAddress + ":" + serverPort);

                    // Create socket connection to server
                    socket = new Socket();
                    socket.connect(new InetSocketAddress(serverAddress, serverPort), 15000); // Increased timeout to 15 seconds
                    socket.setSoTimeout(30000); // 30 second read timeout

                    Log.d(TAG, "✅ Connected to server: " + serverAddress);

                    // Receive file over socket
                    receiveFileOverSocket(socket, fileName, fileSize, destination, promise);

                } catch (Exception e) {
                    Log.e(TAG, "❌ Failed to connect to server", e);
                    promise.reject("SERVER_CONNECTION_FAILED", "Failed to connect to server: " + e.getMessage());
                } finally {
                    // Close the socket in finally block to prevent resource leaks
                    if (socket != null && !socket.isClosed()) {
                        try {
                            socket.close();
                        } catch (IOException ioEx) {
                            Log.e(TAG, "Error closing socket in finally", ioEx);
                        }
                    }
                }
            }).start();

        } catch (Exception e) {
            Log.e(TAG, "❌ Failed to start client connection", e);
            promise.reject("CLIENT_CONNECTION_FAILED", "Failed to start client connection: " + e.getMessage());
        }
    }

    private void receiveFileOverSocket(Socket socket, String expectedFileName, long expectedFileSize, String destination, Promise promise) {
        try {
            // Get input stream from server
            InputStream inputStream = socket.getInputStream();
            DataInputStream dataInputStream = new DataInputStream(inputStream);

            // Read file metadata
            String receivedFileName = dataInputStream.readUTF();
            long receivedFileSize = dataInputStream.readLong();

            Log.d(TAG, "📥 Receiving file: " + receivedFileName + " (" + receivedFileSize + " bytes)");

            // Create destination file
            String receivedPath = destination + "/" + receivedFileName;
            File receivedFile = new File(receivedPath);

            // Receive file content
            FileOutputStream fileOutputStream = new FileOutputStream(receivedFile);
            byte[] buffer = new byte[8192];
            long totalBytesReceived = 0;
            int bytesRead;

            // Emit receive start event
            WritableMap startData = Arguments.createMap();
            startData.putString("fileName", receivedFileName);
            startData.putDouble("totalBytes", receivedFileSize);
            startData.putString("status", "receiving");
            startData.putString("serverAddress", socket.getInetAddress().getHostAddress());

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onReceiveStart", startData);

            Log.d(TAG, "📥 Starting file download: " + receivedFileName + " (" + receivedFileSize + " bytes)");

            while ((bytesRead = dataInputStream.read(buffer)) != -1) {
                fileOutputStream.write(buffer, 0, bytesRead);
                totalBytesReceived += bytesRead;

                // Calculate and emit progress
                int progress = (int) ((totalBytesReceived * 100) / receivedFileSize);

                WritableMap progressData = Arguments.createMap();
                progressData.putString("fileName", receivedFileName);
                progressData.putInt("progress", progress);
                progressData.putDouble("bytesReceived", totalBytesReceived);
                progressData.putDouble("totalBytes", receivedFileSize);
                progressData.putString("status", "receiving");
                progressData.putString("serverAddress", socket.getInetAddress().getHostAddress());

                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("onReceiveProgress", progressData);

                Log.d(TAG, "📥 Receive progress: " + progress + "% (" + totalBytesReceived + "/" + receivedFileSize + " bytes)");
            }

            // Clean up
            fileOutputStream.close();
            dataInputStream.close();
            socket.close();

            Log.d(TAG, "✅ File receive completed: " + receivedFileName);

            // Emit completion event
            WritableMap result = Arguments.createMap();
            result.putString("status", "success");
            result.putString("receivedPath", receivedPath);
            result.putString("fileName", receivedFileName);
            result.putDouble("fileSize", receivedFileSize);
            result.putString("serverAddress", socket.getInetAddress().getHostAddress());
            result.putString("transferType", "wifi-direct");

            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit("onReceiveComplete", result);

            Log.d(TAG, "✅ File receive completed: " + receivedFileName + " (" + receivedFileSize + " bytes)");
            promise.resolve(receivedPath);

        } catch (Exception e) {
            Log.e(TAG, "❌ File receive over socket failed", e);
            promise.reject("SOCKET_RECEIVE_FAILED", "Socket receive failed: " + e.getMessage());
        }
    }

    @ReactMethod
    public void checkPermissions(Promise promise) {
        // Check all required permissions for P2P functionality
        List<String> requiredPermissions = new ArrayList<>();
        requiredPermissions.add(Manifest.permission.ACCESS_WIFI_STATE);
        requiredPermissions.add(Manifest.permission.CHANGE_WIFI_STATE);
        requiredPermissions.add(Manifest.permission.ACCESS_FINE_LOCATION);

        // For Android 13+ (API 33+), NEARBY_WIFI_DEVICES is required
        // For Android 12 (API 31-32), ACCESS_FINE_LOCATION is sufficient
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requiredPermissions.add(Manifest.permission.NEARBY_WIFI_DEVICES);
        }

        boolean allGranted = true;
        List<String> missingPermissions = new ArrayList<>();

        for (String permission : requiredPermissions) {
            if (ContextCompat.checkSelfPermission(reactContext, permission) != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                missingPermissions.add(permission);
            }
        }

        Log.d(TAG, "checkPermissions: API Level=" + Build.VERSION.SDK_INT +
                   ", allGranted=" + allGranted + ", missing=" + missingPermissions);
        promise.resolve(allGranted);
    }

    @ReactMethod
    public void requestPermissions(Promise promise) {
        // For React Native, permissions are typically handled at the JS layer using react-native-permissions
        // This method exists to match the interface but actual permission requests should be done in JS
        Log.w(TAG, "requestPermissions called - should be handled in JS layer with react-native-permissions");
        // For now, just return true as a placeholder
        promise.resolve(true);
    }

    @ReactMethod
    public void getSpredReceivedVideos(Promise promise) {
        // Return list of received P2P videos by scanning the file system
        WritableArray videos = Arguments.createArray();

        try {
            // P2P videos are stored in a separate folder: ExternalFilesDir/SpredP2PReceived/
            String p2pReceivedPath = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/SpredP2PReceived/";
            Log.d(TAG, "Scanning for P2P received videos in: " + p2pReceivedPath);

            java.io.File p2pFolder = new java.io.File(p2pReceivedPath);
            if (p2pFolder.exists() && p2pFolder.isDirectory()) {
                java.io.File[] files = p2pFolder.listFiles();
                if (files != null) {
                    for (java.io.File file : files) {
                        if (file.isFile() && (file.getName().endsWith(".mp4") ||
                                            file.getName().endsWith(".mov") ||
                                            file.getName().endsWith(".avi") ||
                                            file.getName().endsWith(".mkv"))) {

                            // All files in the SpredP2PReceived folder are P2P received videos
                            String fileName = file.getName();
                            WritableMap video = Arguments.createMap();
                            video.putString("name", fileName.replaceAll("\\.[^.]+$", "")); // Remove extension
                            video.putString("fileName", fileName);
                            video.putString("filePath", file.getAbsolutePath());
                            video.putDouble("fileSize", file.length());
                            video.putString("receivedPath", file.getAbsolutePath());
                            video.putString("transferId", "p2p_" + file.lastModified());
                            video.putString("folderSource", "P2P Received");

                            videos.pushMap(video);
                            Log.d(TAG, "Found P2P video: " + fileName + " (" + file.length() + " bytes)");
                        }
                    }
                }
            } else {
                Log.d(TAG, "P2P received folder does not exist: " + p2pReceivedPath);
            }

            Log.d(TAG, "Total P2P videos found: " + videos.size());
            promise.resolve(videos);

        } catch (Exception e) {
            Log.e(TAG, "Error scanning P2P received videos", e);
            promise.reject("SCAN_ERROR", "Failed to scan P2P videos: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getReceivedVideosCount(Promise promise) {
        // Return count of received videos
        try {
            String p2pReceivedPath = reactContext.getExternalFilesDir(null).getAbsolutePath() + "/SpredP2PReceived/";
            java.io.File p2pFolder = new java.io.File(p2pReceivedPath);

            if (p2pFolder.exists() && p2pFolder.isDirectory()) {
                java.io.File[] files = p2pFolder.listFiles();
                int count = 0;
                if (files != null) {
                    for (java.io.File file : files) {
                        if (file.isFile() && (file.getName().endsWith(".mp4") ||
                                            file.getName().endsWith(".mov") ||
                                            file.getName().endsWith(".avi") ||
                                            file.getName().endsWith(".mkv"))) {

                            // All files in the SpredP2PReceived folder are P2P files
                            count++;
                        }
                    }
                }
                Log.d(TAG, "P2P received videos count: " + count);
                promise.resolve(count);
            } else {
                Log.d(TAG, "P2P received folder does not exist, count = 0");
                promise.resolve(0);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting P2P videos count", e);
            promise.resolve(0);
        }
    }

    @ReactMethod
    public void isReceivedSpredVideo(String videoPath, Promise promise) {
        // Check if video was received via P2P
        // For simplicity, return false
        promise.resolve(false);
    }

    // Helper method to copy files (for actual file transfer)
    private void copyFile(File source, File dest) throws IOException {
        try (FileInputStream inStream = new FileInputStream(source);
             FileOutputStream outStream = new FileOutputStream(dest);
             FileChannel inChannel = inStream.getChannel();
             FileChannel outChannel = outStream.getChannel()) {
            inChannel.transferTo(0, inChannel.size(), outChannel);
        }
    }

    /**
     * 🔒 SECURITY: Verify if a device is a Spred device before allowing connection
     */
    private boolean isVerifiedSpredDevice(String deviceAddress) {
        try {
            for (int i = 0; i < discoveredPeers.size(); i++) {
                WritableMap peer = (WritableMap) discoveredPeers.getMap(i);
                String address = peer.getString("address");
                String name = peer.getString("name");

                if (address != null && address.equals(deviceAddress)) {
                    return name != null && name.contains("Spred");
                }
            }
            return false;
        } catch (Exception e) {
            Log.e(TAG, "❌ Security: Error verifying device: " + e.getMessage(), e);
            return false;
        }
    }
}