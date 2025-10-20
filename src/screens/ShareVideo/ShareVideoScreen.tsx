import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    StyleSheet,
    Animated,
    FlatList,
    Image,
    StatusBar,
    Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { P2PService, Device, P2PServiceState } from '../../services/P2PService';
import { Android12Button } from '../../components/Android12Button';
import { formatBytes } from '../../helpers/utils';

// Screen dimensions for responsive design
const { width: screenWidth } = Dimensions.get('window');

interface ShareVideoScreenProps {
    visible: boolean;
    onClose: () => void;
    videoPath: string;
    videoTitle: string;
    videoSize?: number;
    videoThumbnail?: string;
}

type ShareMode = 'discovery' | 'connecting' | 'transferring' | 'completed' | 'error';

const ShareVideoScreen: React.FC<ShareVideoScreenProps> = ({
    visible,
    onClose,
    videoPath,
    videoTitle,
    videoSize = 0,
    videoThumbnail,
}) => {
    // State Management
    const [shareMode, setShareMode] = useState<ShareMode>('discovery');
    const [p2pState, setP2PState] = useState<P2PServiceState | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [transferProgress, setTransferProgress] = useState(0);
    const [transferSpeed, setTransferSpeed] = useState('0 MB/s');
    const [timeRemaining, setTimeRemaining] = useState('--:--');
    const [errorMessage, setErrorMessage] = useState('');

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    const p2pService = P2PService.getInstance();

    // Initialize and cleanup
    useEffect(() => {
        if (visible) {
            initializeSharing();
            startAnimations();
        } else {
            cleanup();
        }

        return () => {
            cleanup();
        };
    }, [visible]);

    // Subscribe to P2P state changes
    useEffect(() => {
        const unsubscribe = p2pService.subscribe((state) => {
            setP2PState(state);
            handleP2PStateChange(state);
        });

        return unsubscribe;
    }, []);

    const startAnimations = () => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const initializeSharing = async () => {
        try {
            setShareMode('discovery');
            setErrorMessage('');

            const initialized = await p2pService.initializeService();
            if (!initialized) {
                setShareMode('error');
                setErrorMessage('Failed to initialize sharing service. Please try again.');
                return;
            }

            const discoveryStarted = await p2pService.startDiscovery();
            if (!discoveryStarted) {
                setShareMode('error');
                setErrorMessage('Failed to start device discovery. Please check permissions.');
            }
        } catch (error) {
            setShareMode('error');
            setErrorMessage(`Initialization failed: ${error.message || 'Unknown error'}`);
        }
    };

    const handleP2PStateChange = (state: P2PServiceState) => {
        // Handle transfer progress updates
        if (state.transferProgress) {
            // Mock progress for now since the P2PFile interface might not have progress
            const progress = Math.min(transferProgress + 10, 100); // Mock progress increment
            setTransferProgress(progress);

            // Animate progress bar
            Animated.timing(progressAnim, {
                toValue: progress / 100,
                duration: 200,
                useNativeDriver: false,
            }).start();

            // Calculate transfer speed and ETA (mock for now)
            if (progress > 0 && shareMode === 'transferring') {
                const speed = Math.random() * 10 + 5; // Mock speed 5-15 MB/s
                setTransferSpeed(`${speed.toFixed(1)} MB/s`);

                const remaining = ((100 - progress) / progress) * 30; // Mock calculation
                const minutes = Math.floor(remaining / 60);
                const seconds = Math.floor(remaining % 60);
                setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }

        // Handle connection state changes
        if (state.isConnected && shareMode === 'connecting') {
            setShareMode('transferring');
            startFileTransfer();
        }

        // Handle errors
        if (state.error && shareMode !== 'error') {
            setShareMode('error');
            setErrorMessage(state.error);
        }
    };

    const handleDeviceSelect = async (device: Device) => {
        try {
            setSelectedDevice(device);
            setShareMode('connecting');

            const connected = await p2pService.connectToDevice(device.deviceAddress);
            if (!connected) {
                setShareMode('error');
                setErrorMessage('Failed to connect to device. Please try again.');
            }
        } catch (error) {
            setShareMode('error');
            setErrorMessage(`Connection failed: ${error.message || 'Unknown error'}`);
        }
    };

    const startFileTransfer = async () => {
        try {
            const success = await p2pService.sendFile(videoPath);
            if (success) {
                setShareMode('completed');
            } else {
                setShareMode('error');
                setErrorMessage('File transfer failed. Please try again.');
            }
        } catch (error) {
            setShareMode('error');
            setErrorMessage(`Transfer failed: ${error.message || 'Unknown error'}`);
        }
    };

    const cleanup = () => {
        try {
            p2pService.stopDiscovery();
            setShareMode('discovery');
            setSelectedDevice(null);
            setTransferProgress(0);
            setErrorMessage('');
        } catch (error) {
            console.warn('Cleanup error:', error);
        }
    };

    const handleRetry = () => {
        setShareMode('discovery');
        setErrorMessage('');
        initializeSharing();
    };

    const handleClose = () => {
        cleanup();
        onClose();
    };

    // Render Methods
    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Share Video</Text>
            <View style={styles.headerSpacer} />
        </View>
    );

    const renderVideoInfo = () => (
        <View style={styles.videoInfo}>
            <View style={styles.videoThumbnail}>
                {videoThumbnail ? (
                    <Image source={{ uri: videoThumbnail }} style={styles.thumbnailImage} />
                ) : (
                    <MaterialIcons name="movie" size={32} color="#F45303" />
                )}
            </View>
            <View style={styles.videoDetails}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                    {videoTitle}
                </Text>
                <Text style={styles.videoSize}>
                    {videoSize > 0 ? formatBytes(videoSize) : 'Size unknown'}
                </Text>
            </View>
        </View>
    );

    const renderDeviceItem = ({ item }: { item: Device }) => (
        <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => handleDeviceSelect(item)}
            activeOpacity={0.7}
        >
            <View style={styles.deviceIcon}>
                <MaterialIcons name="smartphone" size={24} color="#F45303" />
            </View>
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.deviceName || 'Unknown Device'}</Text>
                <Text style={styles.deviceStatus}>Available</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#8B8B8B" />
        </TouchableOpacity>
    );

    const renderDiscoveryMode = () => (
        <View style={styles.content}>
            {renderVideoInfo()}

            <View style={styles.discoverySection}>
                <View style={styles.discoveryHeader}>
                    <MaterialIcons name="wifi-tethering" size={24} color="#F45303" />
                    <Text style={styles.discoveryTitle}>Looking for devices...</Text>
                </View>

                {p2pState?.discoveredDevices && p2pState.discoveredDevices.length > 0 ? (
                    <FlatList
                        data={p2pState.discoveredDevices}
                        renderItem={renderDeviceItem}
                        keyExtractor={(item) => item.deviceAddress}
                        style={styles.deviceList}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyState}>
                        <ActivityIndicator size="large" color="#F45303" />
                        <Text style={styles.emptyText}>
                            Make sure the receiving device is in "Receive" mode
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );

    const renderConnectingMode = () => (
        <View style={styles.content}>
            {renderVideoInfo()}

            <View style={styles.statusSection}>
                <View style={styles.statusIcon}>
                    <ActivityIndicator size="large" color="#F45303" />
                </View>
                <Text style={styles.statusTitle}>Connecting...</Text>
                <Text style={styles.statusSubtitle}>
                    Connecting to {selectedDevice?.deviceName || 'device'}
                </Text>
            </View>
        </View>
    );

    const renderTransferringMode = () => (
        <View style={styles.content}>
            {renderVideoInfo()}

            <View style={styles.transferSection}>
                <Text style={styles.transferTitle}>Sending to {selectedDevice?.deviceName}</Text>

                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%'],
                                    }),
                                },
                            ]}
                        />
                    </View>
                    <Text style={styles.progressText}>{Math.round(transferProgress)}%</Text>
                </View>

                <View style={styles.transferStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Speed</Text>
                        <Text style={styles.statValue}>{transferSpeed}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Time remaining</Text>
                        <Text style={styles.statValue}>{timeRemaining}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderCompletedMode = () => (
        <View style={styles.content}>
            {renderVideoInfo()}

            <View style={styles.statusSection}>
                <View style={styles.successIcon}>
                    <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
                </View>
                <Text style={styles.statusTitle}>Transfer Complete!</Text>
                <Text style={styles.statusSubtitle}>
                    Video sent to {selectedDevice?.deviceName} successfully
                </Text>

                <View style={styles.buttonContainer}>
                    <View style={styles.singleButtonWrapper}>
                        <Android12Button
                            title="Done"
                            onPress={handleClose}
                            style={styles.doneButton}
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderErrorMode = () => (
        <View style={styles.content}>
            {renderVideoInfo()}

            <View style={styles.statusSection}>
                <View style={styles.errorIcon}>
                    <MaterialIcons name="error" size={64} color="#FF5252" />
                </View>
                <Text style={styles.statusTitle}>Transfer Failed</Text>
                <Text style={styles.statusSubtitle}>{errorMessage}</Text>

                <View style={styles.buttonContainer}>
                    <View style={styles.dualButtonWrapper}>
                        <View style={styles.constrainedButton}>
                            <Android12Button
                                title="Try Again"
                                onPress={handleRetry}
                                style={styles.retryButton}
                            />
                        </View>
                        <View style={styles.constrainedButton}>
                            <Android12Button
                                title="Cancel"
                                onPress={handleClose}
                                style={styles.cancelButton}
                                variant="outline"
                            />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderContent = () => {
        switch (shareMode) {
            case 'discovery':
                return renderDiscoveryMode();
            case 'connecting':
                return renderConnectingMode();
            case 'transferring':
                return renderTransferringMode();
            case 'completed':
                return renderCompletedMode();
            case 'error':
                return renderErrorMode();
            default:
                return renderDiscoveryMode();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <StatusBar backgroundColor="#1A1A1A" barStyle="light-content" />
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                {renderHeader()}
                {renderContent()}
            </Animated.View>
        </Modal>
    );
};

// Button size constants and breakpoints for consistent measurements
const BUTTON_CONSTRAINTS = {
    SINGLE_MAX_WIDTH: 280,
    DUAL_CONTAINER_MAX_WIDTH: 320,
    INDIVIDUAL_MAX_WIDTH: 150,
    INDIVIDUAL_MIN_WIDTH: 120,
    HORIZONTAL_PADDING: 32,
    BUTTON_GAP: 16,
    // Responsive breakpoints
    WIDE_SCREEN_BREAKPOINT: 400,
    SMALL_SCREEN_MIN_WIDTH: 320,
} as const;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A1A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    videoInfo: {
        flexDirection: 'row',
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    videoThumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#3A3A3A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    thumbnailImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    videoDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    videoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    videoSize: {
        fontSize: 14,
        color: '#8B8B8B',
    },
    discoverySection: {
        flex: 1,
    },
    discoveryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    discoveryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        marginLeft: 12,
    },
    deviceList: {
        flex: 1,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    deviceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3A3A3A',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    deviceStatus: {
        fontSize: 14,
        color: '#4CAF50',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#8B8B8B',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 24,
    },
    statusSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIcon: {
        marginBottom: 24,
    },
    successIcon: {
        marginBottom: 24,
    },
    errorIcon: {
        marginBottom: 24,
    },
    statusTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    statusSubtitle: {
        fontSize: 16,
        color: '#8B8B8B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    transferSection: {
        flex: 1,
        justifyContent: 'center',
    },
    transferTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 32,
    },
    progressContainer: {
        marginBottom: 32,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#3A3A3A',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F45303',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    transferStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#8B8B8B',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Responsive button container styles with maximum width limits
    buttonContainer: {
        alignItems: 'center',
        // Dynamic padding based on screen size
        paddingHorizontal: screenWidth > BUTTON_CONSTRAINTS.WIDE_SCREEN_BREAKPOINT
            ? Math.max(BUTTON_CONSTRAINTS.HORIZONTAL_PADDING, (screenWidth - BUTTON_CONSTRAINTS.WIDE_SCREEN_BREAKPOINT) / 4)
            : BUTTON_CONSTRAINTS.HORIZONTAL_PADDING,
    },
    // Single button wrapper styles with optimal sizing
    singleButtonWrapper: {
        width: '100%',
        maxWidth: BUTTON_CONSTRAINTS.SINGLE_MAX_WIDTH,
        alignSelf: 'center',
    },
    // Dual button wrapper styles with optimal sizing
    dualButtonWrapper: {
        flexDirection: 'row',
        width: '100%',
        maxWidth: BUTTON_CONSTRAINTS.DUAL_CONTAINER_MAX_WIDTH,
        alignSelf: 'center',
        gap: BUTTON_CONSTRAINTS.BUTTON_GAP,
    },
    // Constrained button style for dual button layouts
    constrainedButton: {
        flex: 1,
        minWidth: BUTTON_CONSTRAINTS.INDIVIDUAL_MIN_WIDTH,
        maxWidth: BUTTON_CONSTRAINTS.INDIVIDUAL_MAX_WIDTH,
    },
    // Updated legacy button styles to work with new constraints
    doneButton: {
        // Remove marginHorizontal as it's now handled by buttonContainer
    },
    retryButton: {
        // Remove flex: 1 to prevent excessive stretching
    },
    cancelButton: {
        // Remove flex: 1 to prevent excessive stretching
    },
});

export default ShareVideoScreen;