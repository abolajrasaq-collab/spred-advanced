import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
// import RealFileShareService, { ShareSession } from '../../services/RealFileShareService';
// import logger from '../../utils/logger';

// Temporary interfaces for testing
interface ShareSession {
  id: string;
  hotspotName: string;
  hotspotPassword: string;
  videoTitle: string;
  videoSize: number;
  serverPort: number;
  qrData: string;
}

const RealFileShareTest: React.FC = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentSession, setCurrentSession] = useState<ShareSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to share');

  // const fileShareService = RealFileShareService.getInstance();

  useEffect(() => {
    // Check if there's an active session on mount
    // const session = fileShareService.getCurrentSession();
    // if (session) {
    //   setCurrentSession(session);
    //   setIsSharing(true);
    //   setStatus('Sharing active');
    // }
  }, []);

  const startSharing = async () => {
    try {
      setLoading(true);
      setStatus('Starting file sharing...');

      // Mock video file for testing
      const mockVideoPath = '/storage/emulated/0/DCIM/Camera/test_video.mp4';
      const mockVideoTitle = 'Test Video.mp4';
      const mockVideoSize = 52428800; // 50MB

      // logger.info('🚀 Starting real file share test');

      // Mock session for testing UI
      const mockSession: ShareSession = {
        id: 'test_session_123',
        hotspotName: 'SPRED_TEST123',
        hotspotPassword: 'TestPass123',
        videoTitle: mockVideoTitle,
        videoSize: mockVideoSize,
        serverPort: 8080,
        qrData: JSON.stringify({
          hotspotName: 'SPRED_TEST123',
          hotspotPassword: 'TestPass123',
          downloadUrl: 'http://192.168.43.1:8080/video',
          fileName: mockVideoTitle,
          fileSize: mockVideoSize,
        }),
      };

      setCurrentSession(mockSession);
      setIsSharing(true);
      setStatus(`Sharing: ${mockSession.hotspotName}`);

      Alert.alert(
        'Mock Sharing Started!',
        `This is a UI test. Real implementation requires:\n\n1. Install packages\n2. Add Android permissions\n3. Uncomment service code\n\nHotspot: ${mockSession.hotspotName}\nPassword: ${mockSession.hotspotPassword}`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      // logger.error('❌ Failed to start sharing:', error);
      Alert.alert('Error', `Failed to start sharing: ${error.message}`);
      setStatus('Failed to start sharing');
    } finally {
      setLoading(false);
    }
  };

  const stopSharing = async () => {
    try {
      setLoading(true);
      setStatus('Stopping sharing...');

      // await fileShareService.stopSharing();

      setCurrentSession(null);
      setIsSharing(false);
      setStatus('Sharing stopped');

      Alert.alert('Mock Sharing Stopped', 'Mock file sharing has been stopped.');

    } catch (error: any) {
      // logger.error('❌ Failed to stop sharing:', error);
      Alert.alert('Error', `Failed to stop sharing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testDownload = async () => {
    try {
      if (!currentSession) {
        Alert.alert('Error', 'No active sharing session');
        return;
      }

      setLoading(true);
      setStatus('Testing download...');

      // Mock download test
      Alert.alert(
        'Mock Download Test',
        `This would download from:\n${JSON.parse(currentSession.qrData).downloadUrl}\n\nReal implementation requires service activation.`
      );
      setStatus('Mock download test completed');

    } catch (error: any) {
      // logger.error('❌ Download test failed:', error);
      Alert.alert('Error', `Download test failed: ${error.message}`);
      setStatus('Download test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Real File Share Test</Text>
      <Text style={styles.subtitle}>Offline HTTP Server + Hotspot</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {currentSession && (
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>Active Session</Text>
          <Text style={styles.sessionDetail}>Hotspot: {currentSession.hotspotName}</Text>
          <Text style={styles.sessionDetail}>Password: {currentSession.hotspotPassword}</Text>
          <Text style={styles.sessionDetail}>File: {currentSession.videoTitle}</Text>
          <Text style={styles.sessionDetail}>
            Size: {Math.round(currentSession.videoSize / 1024 / 1024)}MB
          </Text>
          <Text style={styles.sessionDetail}>Port: {currentSession.serverPort}</Text>
        </View>
      )}

      {currentSession && (
        <View style={styles.qrContainer}>
          <Text style={styles.qrTitle}>QR Code for Download</Text>
          <View style={styles.qrCodeWrapper}>
            <QRCode
              value={currentSession.qrData}
              size={200}
              backgroundColor="white"
              color="black"
            />
          </View>
          <Text style={styles.qrInstructions}>
            Scan this QR code from another device to download the file
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        {!isSharing ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startSharing}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Start Sharing</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopSharing}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Stop Sharing</Text>
            )}
          </TouchableOpacity>
        )}

        {currentSession && (
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testDownload}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Test Download</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. Device A creates WiFi hotspot and HTTP server{'\n'}
          2. Device A generates QR code with connection info{'\n'}
          3. Device B scans QR code{'\n'}
          4. Device B connects to hotspot and downloads file{'\n'}
          5. No internet required - completely offline!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 16,
    color: '#007AFF',
    flex: 1,
  },
  sessionInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  sessionDetail: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  qrCodeWrapper: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
  },
  qrInstructions: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default RealFileShareTest;