import React, { useState } from 'react';
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

import RealFileShareService, { ShareSession } from '../../services/RealFileShareService';
import logger from '../../utils/logger';

const WorkingTest: React.FC = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentSession, setCurrentSession] = useState<ShareSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to share');
  
  const fileShareService = RealFileShareService.getInstance();

  const startSharing = async () => {
    try {
      setLoading(true);
      setStatus('Starting file sharing...');

      // Real video file for testing
      const mockVideoPath = '/storage/emulated/0/DCIM/Camera/test_video.mp4';
      const mockVideoTitle = 'Test Video.mp4';
      const mockVideoSize = 52428800; // 50MB

      logger.info('🚀 Starting real file share');

      const session = await fileShareService.startSharing(
        mockVideoPath,
        mockVideoTitle,
        mockVideoSize
      );

      setCurrentSession(session);
      setIsSharing(true);
      setStatus(`Sharing: ${session.hotspotName}`);

      Alert.alert(
        'Real Sharing Started!',
        `WiFi hotspot created successfully!\n\nHotspot: ${session.hotspotName}\nPassword: ${session.hotspotPassword}\n\nOther devices can scan the QR code to download the file.`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
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

      await fileShareService.stopSharing();

      setCurrentSession(null);
      setIsSharing(false);
      setStatus('Sharing stopped');

      Alert.alert('Sharing Stopped', 'File sharing has been stopped successfully.');

    } catch (error: any) {
      Alert.alert('Error', `Failed to stop sharing: ${error.message}`);
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

export default WorkingTest;