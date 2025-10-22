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
import { CrossPlatformSharingService as P2PService, SharingState as P2PServiceState, NearbyDevice as Device } from '../../services/CrossPlatformSharingService';
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
            const result = await p2pService.shareVideo(videoPath);
            if (result.success) {
                setShareMode('completed');
            } else {
                setShareMode('error');
                setErrorMessage(result.error || 'Sharing failed');
            }
        } catch (error) {
            setShareMode('error');
            setErrorMessage(`Sharing failed: ${error.message || 'Unknown error'}`);
        }
    };

    const handleP2PStateChange = (state: P2PServiceState) => {
        // Handle transfer progress updates
        if (state.transferProgress) {
            const progress = state.transferProgress.progress;
            setTransferProgress(progress);

            // Animate progress bar
            Animated.timing(progressAnim, {
                toValue: progress / 100,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }

        if(state.status) {
            if(state.status.toLowerCase().includes('sending')) {
                setShareMode('transferring');
            } else if (state.status.toLowerCase().includes('looking for nearby devices')) {
                setShareMode('discovery');
            } else if (state.status.toLowerCase().includes('connecting')) {
                setShareMode('connecting');
            } else if (state.status.toLowerCase().includes('completed')) {
                setShareMode('completed');
            }
        }

        // Handle errors
        if (state.error && shareMode !== 'error') {
            setShareMode('error');
            setErrorMessage(state.error);
        }
    };



    const cleanup = () => {
        try {
            p2pService.cleanup();
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
            activeOpacity={0.7}
        >
            <View style={styles.deviceIcon}>
                <MaterialIcons name="smartphone" size={24} color="#F45303" />
            </View>
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
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
                    <MaterialIcons name="share" size={24} color="#F45303" />
                    <Text style={styles.discoveryTitle}>Ready to share...</Text>
                </View>

                <View style={styles.quickShareSection}>
                    <Text style={styles.quickShareTitle}>Quick Share (Recommended)</Text>
                    <Text style={styles.quickShareDescription}>
                        Fast and reliable sharing using Android's built-in Quick Share feature
                    </Text>

                    <TouchableOpacity
                        style={styles.quickShareButton}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="send" size={20} color="#FFFFFF" />
                        <Text style={styles.quickShareButtonText}>Share via Quick Share</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.divider}>
                    <Text style={styles.dividerText}>or</Text>
                </View>

                <View style={styles.traditionalSection}>
                    <Text style={styles.traditionalTitle}>Traditional P2P Sharing</Text>
                    <Text style={styles.traditionalDescription}>
                        Connect directly to nearby SPRED devices
                    </Text>

                    {p2pState?.discoveredDevices && p2pState.discoveredDevices.length > 0 ? (
                        <FlatList
                            data={p2pState.discoveredDevices}
                            renderItem={renderDeviceItem}
                            keyExtractor={(item) => item.id}
                            style={styles.deviceList}
                            showsVerticalScrollIndicator={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <ActivityIndicator size="large" color="#F45303" />
                            <Text style={styles.emptyText}>
                                Looking for nearby SPRED devices...
                            </Text>
                        </View>
                    )}
                </View>
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
    quickShareSection: {
        backgroundColor: '#2A2A2A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    quickShareTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4CAF50',
        marginBottom: 4,
    },
    quickShareDescription: {
        fontSize: 14,
        color: '#8B8B8B',
        lineHeight: 20,
        marginBottom: 16,
    },
    quickShareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8,
    },
    quickShareButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    divider: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerText: {
        fontSize: 14,
        color: '#8B8B8B',
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 12,
    },
    traditionalSection: {
        flex: 1,
    },
    traditionalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F45303',
        marginBottom: 4,
    },
    traditionalDescription: {
        fontSize: 14,
        color: '#8B8B8B',
        lineHeight: 20,
        marginBottom: 16,
    },
});

export default ShareVideoScreen;