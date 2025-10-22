import React, { useEffect, useReducer, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'; // Assuming this is your Icon component
import CrossPlatformSharingService, { SharingState, ShareResult } from '../services/CrossPlatformSharingService';
import OptimizedAndroid12Button from './OptimizedAndroid12Button';

const { width, height } = Dimensions.get('window');

interface UniversalSharingModalProps {
    visible: boolean;
    onClose: () => void;
    videoPath?: string;
    videoTitle?: string;
    onShareComplete?: (result: ShareResult) => void;
}

type ModalMode = 'discovering' | 'connecting' | 'transferring' | 'completed' | 'error';

interface ModalState {
    sharingState: SharingState | null;
    modalMode: ModalMode;
    shareResult: ShareResult | null;
}

type ModalAction =
    | { type: 'SET_SHARING_STATE'; payload: SharingState }
    | { type: 'SET_SHARE_RESULT'; payload: ShareResult }
    | { type: 'SET_ERROR'; payload: { message: string } }
    | { type: 'RESET' };

const initialState: ModalState = {
    sharingState: null,
    modalMode: 'discovering',
    shareResult: null,
};

const UniversalSharingModal: React.FC<UniversalSharingModalProps> = ({
    visible,
    onClose,
    videoPath,
    videoTitle,
    onShareComplete,
}) => {
    const [state, dispatch] = useReducer((prevState: ModalState, action: ModalAction): ModalState => {
        switch (action.type) {
            case 'SET_SHARING_STATE': {
                const newState = { ...prevState, sharingState: action.payload };
                // Derive modalMode from the new sharing state
                if (action.payload.error) {
                    newState.modalMode = 'error';
                } else if (action.payload.transferProgress && action.payload.transferProgress.progress > 0) {
                    newState.modalMode = 'transferring';
                } else if (action.payload.discoveredDevices.length > 0 && action.payload.currentMethod === 'nearby') {
                    newState.modalMode = 'connecting';
                }
                return newState;
            }
            case 'SET_SHARE_RESULT':
                return {
                    ...prevState,
                    shareResult: action.payload,
                    modalMode: action.payload.success ? 'completed' : 'error',
                };
            case 'SET_ERROR':
                return {
                    ...prevState,
                    shareResult: { success: false, method: 'unknown' as any, error: action.payload.message },
                    modalMode: 'error',
                };
            case 'RESET':
                return initialState;
            default:
                return prevState;
        }
    }, initialState);

    const { sharingState, modalMode, shareResult } = state;

    useEffect(() => {
        const sharingService = CrossPlatformSharingService.getInstance();

        const startSharing = async (path: string) => {
            try {
                console.log('🚀 Starting sharing process...');
                const result = await sharingService.shareVideo(path);
                if (result.success) {
                    dispatch({ type: 'SET_SHARE_RESULT', payload: result });
                    onShareComplete?.(result);
                }
            } catch (error: any) { // This will now primarily catch critical initialization errors
                console.error('❌ Critical sharing error:', {
                    message: error.message,
                    stack: error.stack,
                    videoPath: path,
                });
                dispatch({ type: 'SET_ERROR', payload: { message: error.message || 'An unexpected error occurred' } });
            }
        };

        if (visible && videoPath) {
            // Reset state and start sharing when the modal becomes visible
            dispatch({ type: 'RESET' });
            startSharing(videoPath);
        }

        const unsubscribe = sharingService.subscribe((state) => {
            // The service now pushes both progress and final results through the same channel
            dispatch({ type: 'SET_SHARING_STATE', payload: state });
        });

        return () => {
            unsubscribe();
            if (visible) {
                sharingService.cleanup();
            }
        };
    }, [visible, videoPath, onShareComplete]);

    const handleClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const handleRetry = useCallback(() => {
        if (videoPath) {
            // The useEffect will handle the re-start logic when visibility changes,
            // but for an explicit retry, we can reset and trigger again.
            dispatch({ type: 'RESET' });
            // Re-run the startSharing function immediately for a true retry experience
            const sharingService = CrossPlatformSharingService.getInstance();
            sharingService.shareVideo(videoPath).catch(error => {
                dispatch({ type: 'SET_ERROR', payload: { message: error.message } });
            });
        }
    }, [videoPath, onClose]);

    const renderDiscoveringState = () => (
        <View style={styles.stateContainer}>
            <View style={styles.iconContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
            <Text style={styles.stateTitle}>Looking for nearby devices</Text>
            <Text style={styles.stateSubtitle}>
                Searching for devices ready to receive videos...
            </Text>
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    {sharingState?.status || 'Initializing...'}
                </Text>
            </View>
        </View>
    );

    const renderConnectingState = () => (
        <View style={styles.stateContainer}>
            <View style={styles.iconContainer}>
                <MaterialIcons name="wifi" size={64} color="#2196F3" />
            </View>
            <Text style={styles.stateTitle}>Connecting to device</Text>
            <Text style={styles.stateSubtitle}>
                Found {sharingState?.discoveredDevices.length || 0} nearby device(s)
            </Text>

            {sharingState?.discoveredDevices.map((device, index) => (
                <View key={device.id} style={styles.deviceItem}>
                    <MaterialIcons name="smartphone" size={20} color="#4CAF50" />
                    <Text style={styles.deviceName}>{device.name}</Text>
                    <Text style={styles.deviceStatus}>{device.status}</Text>
                </View>
            ))}
        </View>
    );

    const renderTransferringState = () => {
        const progress = sharingState?.transferProgress;

        return (
            <View style={styles.stateContainer}>
                <View style={styles.iconContainer}>
                    <MaterialIcons name="cloud-upload" size={64} color="#F45303" />
                </View>
                <Text style={styles.stateTitle}>Sending video</Text>
                <Text style={styles.stateSubtitle}>
                    {progress?.fileName || videoTitle || 'Video file'}
                </Text>

                {progress && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[styles.progressFill, { width: `${progress.progress}%` }]}
                            />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress.progress)}%</Text>

                        {progress.speed && (
                            <Text style={styles.speedText}>
                                {Math.round(progress.speed / 1024 / 1024)} MB/s
                            </Text>
                        )}
                    </View>
                )}
            </View>
        );
    };


    const renderCompletedState = () => {
        // Determine the actual sharing method and create appropriate message
        const getSuccessMessage = () => {
            if (!shareResult) return 'Video sharing completed!';

            // For P2P sharing only
            // For direct sharing (P2P, WiFi Direct)
            switch (shareResult.method) {
                case 'p2p':
                    return shareResult.deviceName
                        ? `Video sent to ${shareResult.deviceName}`
                        : 'Video sent successfully';
                case 'nearby':
                    return shareResult.deviceName
                        ? `Video sent to ${shareResult.deviceName}`
                        : 'Video sent successfully';
                default:
                    return 'Video sent successfully';
            }
        };

        const getSuccessTitle = () => {
            return 'Video Sent!';
        };

        return (
            <View style={styles.stateContainer}>
                <View style={[styles.iconContainer, styles.successIcon]}>
                    <MaterialIcons name="check-circle" size={64} color="#4CAF50" />
                </View>
                <Text style={styles.stateTitle}>{getSuccessTitle()}</Text>
                <Text style={styles.stateSubtitle}>
                    {getSuccessMessage()}
                </Text>

                {shareResult?.duration && (
                    <Text style={styles.durationText}>
                        Completed in {Math.round(shareResult.duration / 1000)}s
                    </Text>
                )}

                <OptimizedAndroid12Button
                    title="Done"
                    onPress={handleClose}
                    iconName="done"
                    buttonColor="#4CAF50" // primary color for success
                    iconSize={20}
                    size="medium"
                />
            </View>
        );
    };

    const renderErrorState = () => {
        const errorMessage = shareResult?.error || sharingState?.error || 'An error occurred while sharing the video';

        // Get user-friendly error message for P2P only
        const getUserFriendlyMessage = (error: string): string => {
            if (error.includes('permission')) {
                return 'Permission denied. Please grant location and nearby devices permissions.';
            }
            if (error.includes('not available') || error.includes('initialization')) {
                return 'Nearby sharing is not available on this device.';
            }
            if (error.includes('timeout') || error.includes('No nearby devices')) {
                return 'No nearby devices found. Make sure both devices have WiFi enabled.';
            }
            if (error.includes('null') || error.includes('System error')) {
                return 'System error detected. Please restart the app.';
            }
            return 'Sharing encountered an issue. Please try again.';
        };

        return (
            <View style={styles.stateContainer}>
                <View style={[styles.iconContainer, styles.errorIcon]}>
                    <MaterialIcons name="error" size={64} color="#FF5252" />
                </View>
                <Text style={styles.stateTitle}>Sharing Failed</Text>
                <Text style={styles.stateSubtitle}>
                    {getUserFriendlyMessage(errorMessage)}
                </Text>

                {/* Show technical details in debug mode */}
                {__DEV__ && (
                    <View style={styles.debugInfo}>
                        <Text style={styles.debugTitle}>Debug Info:</Text>
                        <Text style={styles.debugText}>{errorMessage}</Text>
                    </View>
                )}

                <View style={styles.errorActions}>
                    <OptimizedAndroid12Button
                        title="Try Again"
                        onPress={handleRetry}
                        iconName="refresh"
                        buttonColor="#F45303" // primary color
                        iconSize={20}
                        size="medium"
                    />
                    <OptimizedAndroid12Button
                        title="Close"
                        onPress={handleClose}
                        variant="secondary"
                        iconName="close"
                        size="medium"
                    />
                </View>
            </View>
        );
    };

    const renderContent = () => {
        switch (modalMode) {
            case 'discovering':
                return renderDiscoveringState();
            case 'connecting':
                return renderConnectingState();
            case 'transferring':
                return renderTransferringState();
            case 'completed':
                return renderCompletedState();
            case 'error':
                return renderErrorState();
            default:
                return renderDiscoveringState();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Share Video</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <MaterialIcons name="close" size={24} color="#8B8B8B" />
                        </TouchableOpacity>
                    </View>

                    {/* Status Indicator */}
                    <View style={styles.statusBar}>
                        <View style={styles.statusIndicator}>
                            <View
                                style={[
                                    styles.statusDot,
                                    {
                                        backgroundColor:
                                            modalMode === 'completed'
                                                ? '#4CAF50'
                                                : modalMode === 'error'
                                                    ? '#FF5252'
                                                    : modalMode === 'transferring'
                                                        ? '#F45303'
                                                        : '#2196F3',
                                    },
                                ]}
                            />
                            <Text style={styles.statusLabel}>
                                {modalMode === 'discovering' && 'Discovering'}
                                {modalMode === 'connecting' && 'Connecting'}
                                {modalMode === 'transferring' && 'Transferring'}
                                {modalMode === 'completed' && 'Completed'}
                                {modalMode === 'error' && 'Error'}
                            </Text>
                        </View>
                    </View>

                    {/* Video Info */}
                    {videoTitle && (
                        <View style={styles.videoInfo}>
                            <MaterialIcons name="movie" size={20} color="#F45303" />
                            <Text style={styles.videoTitle} numberOfLines={2}>
                                {videoTitle}
                            </Text>
                        </View>
                    )}

                    {/* Main Content */}
                    <View style={styles.content}>
                        {renderContent()}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        width: width * 0.9,
        maxHeight: height * 0.8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    closeButton: {
        padding: 4,
    },
    statusBar: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#333333',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusLabel: {
        fontSize: 14,
        color: '#CCCCCC',
        fontWeight: '500',
    },
    content: {
        padding: 20,
        minHeight: 300,
    },
    videoInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: 'rgba(244, 83, 3, 0.1)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    videoTitle: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    stateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    successIcon: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    errorIcon: {
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
    },
    stateTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    stateSubtitle: {
        fontSize: 16,
        color: '#8B8B8B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    statusContainer: {
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2A2A',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
        gap: 8,
    },
    deviceName: {
        fontSize: 14,
        color: '#FFFFFF',
        flex: 1,
    },
    deviceStatus: {
        fontSize: 12,
        color: '#8B8B8B',
        textTransform: 'capitalize',
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#2A2A2A',
        borderRadius: 4,
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#F45303',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 18,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 4,
    },
    speedText: {
        fontSize: 14,
        color: '#8B8B8B',
    },
    durationText: {
        fontSize: 14,
        color: '#8B8B8B',
        marginBottom: 20,
    },
    errorActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        gap: 12,
    },
    retryButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    debugInfo: {
        backgroundColor: '#2A2A2A',
        padding: 12,
        borderRadius: 8,
        marginTop: 16,
        width: '100%',
    },
    debugTitle: {
        fontSize: 12,
        color: '#FF9800',
        fontWeight: '600',
        marginBottom: 4,
    },
    debugText: {
        fontSize: 11,
        color: '#CCCCCC',
        fontFamily: 'monospace',
    },
});

export default UniversalSharingModal;