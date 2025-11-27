import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    StyleSheet,
    ActivityIndicator,
    Text,
    BackHandler,
    Platform,
} from 'react-native';
import Video from 'react-native-video';

import Icon from 'react-native-vector-icons/MaterialIcons';
import { useOrientation } from '../../hooks/useOrientation';
import SystemUI from '../../native/SystemUIModule';

interface FullscreenVideoPlayerProps {
    source: any;
    style?: any;
    paused?: boolean;
    onPlayPause?: (paused: boolean) => void;
    onLoad?: (data: any) => void;
    onError?: (error: any) => void;
    onLoadStart?: () => void;
    onBuffer?: (data: any) => void;
    resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
    headers?: any;
    onFullscreenChange?: (isFullscreen: boolean) => void;
}

const FullscreenVideoPlayer: React.FC<FullscreenVideoPlayerProps> = ({
    source,
    style,
    paused = true,
    onPlayPause,
    onLoad,
    onError,
    onLoadStart,
    onBuffer,
    resizeMode = 'contain',
    headers,
    onFullscreenChange,
}) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isVideoPaused, setIsVideoPaused] = useState(paused);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<Video>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { lockToPortrait, lockToLandscape } = useOrientation();

    const [screenDimensions, setScreenDimensions] = useState(() => {
        const { width, height } = Dimensions.get('window');
        return { width, height };
    });

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenDimensions({ width: window.width, height: window.height });
        });

        return () => {
            subscription?.remove();
        };
    }, []);

    useEffect(() => {
        setIsVideoPaused(paused);
    }, [paused]);

    // Cleanup on unmount - restore system UI if still in fullscreen
    useEffect(() => {
        return () => {
            if (isFullscreen && Platform.OS === 'android') {
                SystemUI.showSystemUI();
                StatusBar.setHidden(false);
            }
        };
    }, [isFullscreen]);

    useEffect(() => {
        // Auto-hide controls after 3 seconds
        if (showControls && !isVideoPaused) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }

        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [showControls, isVideoPaused]);

    useEffect(() => {
        // Handle Android back button in fullscreen mode
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (isFullscreen) {
                toggleFullscreen();
                return true; // Prevent default back action
            }
            return false; // Allow default back action
        });

        return () => backHandler.remove();
    }, [isFullscreen, toggleFullscreen]);

    const toggleFullscreen = useCallback(() => {
        console.log('FullscreenVideoPlayer: toggleFullscreen called, current isFullscreen:', isFullscreen);

        if (isFullscreen) {
            console.log('FullscreenVideoPlayer: Exiting fullscreen mode');
            // Exit fullscreen
            setIsFullscreen(false);
            StatusBar.setHidden(false);

            // Use native module to show system UI on Android
            if (Platform.OS === 'android') {
                console.log('FullscreenVideoPlayer: Calling SystemUI.showSystemUI()');
                SystemUI.showSystemUI();
            }

            onFullscreenChange?.(false);
            // Small delay to ensure state updates before orientation change
            setTimeout(() => {
                lockToPortrait();
            }, 100);
        } else {
            console.log('FullscreenVideoPlayer: Entering fullscreen mode');
            // Enter fullscreen
            setIsFullscreen(true);
            StatusBar.setHidden(true);

            // Use native module to hide system UI on Android (status bar + nav bar)
            if (Platform.OS === 'android') {
                console.log('FullscreenVideoPlayer: Calling SystemUI.hideSystemUI()');
                SystemUI.hideSystemUI();
            }

            onFullscreenChange?.(true);
            // Small delay to ensure state updates before orientation change
            setTimeout(() => {
                lockToLandscape();
            }, 100);
        }
    }, [isFullscreen, lockToPortrait, lockToLandscape, onFullscreenChange]);

    const togglePlayPause = () => {
        const newPausedState = !isVideoPaused;
        setIsVideoPaused(newPausedState);
        onPlayPause?.(newPausedState);
        setShowControls(true);
    };

    const handleVideoPress = () => {
        setShowControls(!showControls);
    };

    const handleLoad = (data: any) => {
        setIsLoading(false);
        onLoad?.(data);
    };

    const handleError = (error: any) => {
        setIsLoading(false);
        onError?.(error);
    };

    const handleLoadStart = () => {
        setIsLoading(true);
        onLoadStart?.();
    };

    const containerStyle = isFullscreen
        ? {
            position: 'absolute',
            top: 0,
            left: 0,
            width: screenDimensions.width,
            height: screenDimensions.height,
            backgroundColor: '#000',
            zIndex: 99999, // Extremely high z-index to cover everything
        }
        : style;

    const videoStyle = isFullscreen
        ? {
            ...StyleSheet.absoluteFillObject, // Use absolute fill to cover entire container
        }
        : { flex: 1 };

    return (
        <View style={containerStyle} pointerEvents={isFullscreen ? 'auto' : 'box-none'}>
            <TouchableOpacity
                style={isFullscreen ? StyleSheet.absoluteFillObject : StyleSheet.absoluteFillObject}
                onPress={handleVideoPress}
                activeOpacity={1}
            >
                <Video
                    ref={videoRef}
                    source={source}
                    style={videoStyle}
                    paused={isVideoPaused}
                    controls={false}
                    resizeMode={resizeMode}
                    onLoad={handleLoad}
                    onError={handleError}
                    onLoadStart={handleLoadStart}
                    onBuffer={onBuffer}
                    repeat={false}
                    playInBackground={false}
                    playWhenInactive={false}
                    ignoreSilentSwitch="ignore"
                    {...(headers && { headers })}
                />

                {/* Loading indicator */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                )}

                {/* Custom controls overlay */}
                {showControls && (
                    <View style={[styles.controlsOverlay, isFullscreen && styles.fullscreenControls]}>
                        {/* Play/Pause button */}
                        <TouchableOpacity
                            style={styles.playPauseButton}
                            onPress={togglePlayPause}
                        >
                            <Icon
                                name={isVideoPaused ? 'play-arrow' : 'pause'}
                                size={isFullscreen ? 60 : 40}
                                color="#fff"
                            />
                        </TouchableOpacity>

                        {/* Fullscreen toggle button */}
                        <TouchableOpacity
                            style={[styles.fullscreenButton, isFullscreen && styles.exitFullscreenButton]}
                            onPress={toggleFullscreen}
                        >
                            <Icon
                                name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                                size={isFullscreen ? 30 : 24}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 14,
    },
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenControls: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    playPauseButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 50,
        padding: 15,
    },
    fullscreenButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 25,
        padding: 10,
    },
    exitFullscreenButton: {
        bottom: 30,
        right: 30,
    },
});

export default FullscreenVideoPlayer;