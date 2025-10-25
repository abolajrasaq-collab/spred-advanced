import { Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';
import CustomButton from '../../components/CustomButton/CustomButton';
import CustomText from '../../components/CustomText/CustomText';
import RNFS from 'react-native-fs';
import { cleanMovieTitle } from '../../../src/helpers/utils';
import logger from '../../utils/logger';

// Helper function to extract video info from URL/item
const getVideoInfo = (url: string, item?: any) => {
  try {
    // Try to get info from item first if available
    if (item) {
      return {
        videoKey: item.videoKey || item.trailerKey || item.key,
        title: item.title || 'video',
        cleanedTitle: cleanMovieTitle(item.title || 'video')
      };
    }

    // Fallback to URL parsing
    if (!url || typeof url !== 'string' || url.length === 0) {
      return { videoKey: '', title: 'video', cleanedTitle: 'video' };
    }

    let processedUrl = url;
    if (processedUrl.startsWith('file://')) {
      processedUrl = processedUrl.replace('file://', '');
    }

    processedUrl = processedUrl.split('?')[0];
    const urlParts = processedUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    if (!fileName || fileName.length === 0) {
      return { videoKey: '', title: 'video', cleanedTitle: 'video' };
    }

    const fileNameWithoutExtension = fileName.includes('.')
      ? fileName.substring(0, fileName.lastIndexOf('.'))
      : fileName;

    return {
      videoKey: fileNameWithoutExtension || '',
      title: fileNameWithoutExtension || 'video',
      cleanedTitle: cleanMovieTitle(fileNameWithoutExtension || 'video')
    };
  } catch (error) {
    console.log('Error extracting video info from URL:', error);
    return { videoKey: '', title: 'video', cleanedTitle: 'video' };
  }
};

export default function SpredShare({ url, item }: Props) {
  const [progress, setProgress] = useState<number>(0);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Waiting for connection...');
  const [videoPath, setVideoPath] = useState<string>('');

  useEffect(() => {
    // Initialize connection status
    setConnectionStatus('Ready to share');
  }, []);

  // Comprehensive video path resolution (same logic as PlayVideos)
  const getVideoPath = async () => {
    try {
      // Check both possible download folders
      const foldersToCheck = [
        'SpredVideos', // Android 10+ folder (newer downloads)
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
      ];

      const videoInfo = getVideoInfo(url, item);
      const videoKeyToCheck = videoInfo.videoKey;
      const title = videoInfo.title;

      if (!videoKeyToCheck && !title) {
        logger.warn('❌ No video key or title available for path resolution');
        return '';
      }

      logger.info('🔍 Getting video path for sharing...');
      logger.info('  - Video key:', videoKeyToCheck);
      logger.info('  - Title:', title);

      for (const folderName of foldersToCheck) {
        try {
          const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
          const folderExists = await RNFS.exists(folderPath);

          if (!folderExists) {
            continue;
          }

          const files = await RNFS.readDir(folderPath);

          // Create multiple variations of the title to check against
          const cleanedTitle = videoInfo.cleanedTitle;
          const titleVariations = [
            cleanedTitle.toLowerCase(),
            title.toLowerCase(),
            cleanedTitle.replace(/\s+/g, '_').toLowerCase(),
            title.replace(/\s+/g, '_').toLowerCase(),
            cleanedTitle.replace(/\s+/g, '').toLowerCase(),
            title.replace(/\s+/g, '').toLowerCase(),
          ];

          // Create variations of the video key to check against
          const keyVariations = videoKeyToCheck ? [
            videoKeyToCheck.toLowerCase(),
            videoKeyToCheck.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
          ] : [];

          const downloadedFile = files.find(file => {
            const fileName = file.name.toLowerCase();

            // Check against all key variations
            for (const keyVar of keyVariations) {
              if (
                fileName.includes(keyVar) ||
                fileName.includes(`${keyVar}.mp4`) ||
                fileName.includes(`${keyVar}.mov`) ||
                fileName.includes(`${keyVar}.m4v`)
              ) {
                return true;
              }
            }

            // Check against all title variations
            for (const titleVar of titleVariations) {
              if (
                fileName.includes(titleVar) ||
                fileName.includes(`${titleVar}.mp4`) ||
                fileName.includes(`${titleVar}.mov`) ||
                fileName.includes(`${titleVar}.m4v`)
              ) {
                return true;
              }
            }

            return false;
          });

          if (downloadedFile) {
            logger.info('✅ Found downloaded video file for sharing:', downloadedFile.path);
            return downloadedFile.path;
          }
        } catch (error) {
          logger.warn(`  - Error checking ${folderName}:`, error);
          continue;
        }
      }

      // If no local file found, return empty string to trigger proper error handling
      logger.warn('⚠️ No local video file found - video must be downloaded first');
      return '';
    } catch (error) {
      logger.error('❌ Error getting video path:', error);
      return '';
    }
  };

  const sendFile = async () => {
    if (isSending) return;

    try {
      setIsSending(true);
      setProgress(0);
      setConnectionStatus('Preparing to send...');

      // Use comprehensive file detection
      const videoInfo = getVideoInfo(url, item);
      logger.info('🔍 Looking for video file:', videoInfo);

      const foundVideoPath = await getVideoPath();
      
      if (!foundVideoPath) {
        setConnectionStatus('File not found');
        Snackbar.show({
          text: 'Video file not found. Please download the video first to share it.',
        });
        setIsSending(false);
        return;
      }

      // Store the found path
      setVideoPath(foundVideoPath);
      logger.info('✅ Video file found at:', foundVideoPath);

      // Simulate basic progress for now (until P2P is properly connected)
      setConnectionStatus('Connecting...');
      
      // Show that we're ready but waiting for P2P connection
      Snackbar.show({
        text: 'Video file found! P2P sharing is being set up. This feature requires proper device pairing.',
      });

      setConnectionStatus('Waiting for receiver device...');
      
      // Reset after a moment
      setTimeout(() => {
        setIsSending(false);
        setProgress(0);
        setConnectionStatus('Ready to share');
      }, 3000);

    } catch (error) {
      console.error('Send file error:', error);
      setConnectionStatus('Error occurred');
      Snackbar.show({
        text: 'An error occurred while preparing the file. Please try again.',
      });
      setIsSending(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {/* Video Info Display */}
      <View style={{
        backgroundColor: '#2A2A2A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: '#F45303',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 16
        }}>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>🎥</Text>
        </View>
        <View style={{ flex: 1 }}>
          <CustomText fontWeight="600" fontSize={16} style={{ color: 'white', marginBottom: 4 }}>
            Video Ready to Share
          </CustomText>
          <CustomText fontSize={12} style={{ color: '#8B8B8B' }}>
            File: {getVideoInfo(url, item).title}
          </CustomText>
          <CustomText fontSize={10} style={{ color: '#666', marginTop: 4 }}>
            Status: {isSending ? 'Preparing...' : 'Ready to send'}
          </CustomText>
        </View>
      </View>

      {/* Connection Status Display */}
      <View style={{
        backgroundColor: '#1A1A1A',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FF9800'
      }}>
        <CustomText fontWeight="600" fontSize={14} style={{
          color: '#FF9800',
          marginBottom: 8
        }}>
          Connection Status
        </CustomText>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <CustomText fontSize={12} style={{ color: '#8B8B8B' }}>P2P Status:</CustomText>
          <CustomText fontSize={12} style={{ color: '#FF9800' }}>
            {connectionStatus}
          </CustomText>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <CustomText fontSize={12} style={{ color: '#8B8B8B' }}>Mode:</CustomText>
          <CustomText fontSize={12} style={{ color: 'white' }}>
            WiFi Direct P2P
          </CustomText>
        </View>
      </View>

      {/* Send Button */}
      <CustomButton
        title={isSending ? "Preparing..." : "Send File"}
        onPress={sendFile}
        disabled={isSending}
      />

      {/* Progress Display */}
      {isSending && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: 'white', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
            {`Preparing: ${Math.ceil(progress)}%`}
          </Text>

          <Text style={{ color: '#8B8B8B', textAlign: 'center', fontSize: 12, marginTop: 4 }}>
            {connectionStatus}
          </Text>

          {/* Progress Bar */}
          <View style={{
            backgroundColor: '#2A2A2A',
            height: 12,
            borderRadius: 6,
            marginTop: 8,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#444'
          }}>
            <View style={{
              backgroundColor: '#F45303',
              height: '100%',
              width: `${Math.max(progress, 2)}%`,
              borderRadius: 6,
            }} />
          </View>
        </View>
      )}

      {/* Info Message */}
      <View style={{ alignItems: 'center', padding: 20, marginTop: 10 }}>
        <CustomText style={{ textAlign: 'center', color: '#FF9800', marginBottom: 10 }}>
          ℹ️ P2P File Sharing
        </CustomText>
        <CustomText fontSize={12} style={{ textAlign: 'center', color: '#8B8B8B' }}>
          This feature uses WiFi Direct for peer-to-peer file sharing. Make sure both devices have the Spred app and are connected to the same network or have WiFi Direct enabled.
        </CustomText>
      </View>
    </View>
  );
}

type Props = {
  url: string;
  item?: any; // Video item with metadata for better file detection
};