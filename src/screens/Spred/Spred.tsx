import { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import CustomButton from '../../components/CustomButton/CustomButton';
import SpredShare from '../SpredShare/SpredShare';
import CustomText from '../../components/CustomText/CustomText';
import Receive from '../Receive/Receive';
import SpredSetup from './SpredSetup';
import RNFS from 'react-native-fs';

const Spred = (props: any) => {
  // Support both navigation params and direct props
  const { url, title } = props.route?.params || props;
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [isVideoDownloaded, setIsVideoDownloaded] = useState(false);
  const [downloadedVideoPath, setDownloadedVideoPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to create safe filename from title
  const createSafeFilename = (title: string, originalUrl: string): string => {
    if (!title) {
      return getFileNameFromURL(originalUrl);
    }
    const safeTitle = title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length
    return safeTitle || getFileNameFromURL(originalUrl);
  };

  const getFileNameFromURL = (url: string) => {
    if (!url) {
      return 'video';
    }
    const urlParts = url.split('/');
    if (!urlParts || urlParts.length === 0) {
      return 'video';
    }
    const fileName = urlParts[urlParts.length - 1];
    const fileNameWithoutParams = fileName?.split('?')[0] || fileName;
    const fileNameWithoutExtension = fileNameWithoutParams?.split('.')[0] || fileNameWithoutParams;
    return fileNameWithoutExtension || 'video';
  };

  const checkIfVideoDownloaded = async () => {
    try {
      setLoading(true);

      console.log('🔍 SPRED: checkIfVideoDownloaded called with:', {
        url,
        urlType: typeof url,
        urlStartsWithSlash: url?.startsWith('/'),
        title,
        titleType: typeof title
      });

      // If we already have a full path (from PlayVideos), check it directly
      if (url && (url.startsWith('/') || url.startsWith('file://'))) {
        const filePath = url.startsWith('file://') ? url.replace('file://', '') : url;
        console.log(`📁 SPRED: Checking if downloaded file exists: ${filePath}`);
        const fileExists = await RNFS.exists(filePath);

        if (fileExists) {
          console.log(`✅ SPRED: Video found at path: ${filePath}`);
          setIsVideoDownloaded(true);
          setDownloadedVideoPath(filePath);
          setLoading(false);
          return;
        } else {
          console.log('❌ SPRED: File not found at provided path');
        }
      } else {
        console.log('⚠️ SPRED: URL does not start with / or file://, will search by name');
      }

      // Otherwise, search in download folders (for backward compatibility)
      const safeFileName = createSafeFilename(title, url);
      const fileExtension = 'mp4';

      console.log(`🔍 SPRED: Searching for video by name: ${safeFileName} (title=${title}, url=${url})`);

      // Check all possible download folders including P2P received
      const foldersToCheck = [
        'SpredVideos',        // Android 10+ folder (regular downloads)
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
        'SpredP2PReceived'    // P2P received videos (for re-sharing)
      ];

      for (const folderName of foldersToCheck) {
        const folderPath = `${RNFS.ExternalDirectoryPath}/${folderName}`;
        const filePath = `${folderPath}/${safeFileName}.${fileExtension}`;

        console.log(`📁 SPRED: Checking folder ${folderName}: ${filePath}`);
        const fileExists = await RNFS.exists(filePath);

        if (fileExists) {
          console.log(`✅ SPRED: Video found in ${folderName}: ${filePath}`);
          setIsVideoDownloaded(true);
          setDownloadedVideoPath(filePath);
          setLoading(false);
          return;
        }
      }

      console.log('❌ SPRED: Video not found in any download folder');
      setIsVideoDownloaded(false);
      setDownloadedVideoPath(null);
      setLoading(false);
    } catch (error) {
      console.log('⚠️ SPRED: Error checking download status:', error?.message || error);
      setIsVideoDownloaded(false);
      setDownloadedVideoPath(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('📥 SPRED: Component mounted/updated with props:', { url, title });
    checkIfVideoDownloaded();
  }, [url, title]);

  const toggleSend = () => {
    if (!isVideoDownloaded) {
      Alert.alert(
        'Video Not Downloaded',
        'You can only SPRED videos that are downloaded to your device. Please download this video first.',
        [
          { text: 'OK' }
        ]
      );
      return;
    }
    setShowSend(!showSend);
  };

  const toggleReceive = () => {
    setShowReceive(!showReceive);
  };

  if (loading) {
    return (
      <View style={{ marginTop: 10, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <CustomText fontWeight="600" style={{ color: 'white' }}>
          Checking downloaded content...
        </CustomText>
      </View>
    );
  }

  return (
    <>
      {showSend ? (
        <SpredSetup title="Sending">
          <SpredShare downloadedVideoPath={downloadedVideoPath} title={title} />
        </SpredSetup>
      ) : showReceive ? (
        <SpredSetup title="Receiving">
          <Receive />
        </SpredSetup>
      ) : (
        <View
          style={{
            marginTop: 10,
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: '90%' }}>
            <CustomText fontWeight="600" style={{ color: 'white' }}>
              {isVideoDownloaded
                ? 'Share your downloaded videos with other Spred users'
                : 'Only downloaded videos can be shared via SPRED'
              }
            </CustomText>
          </View>

          {/* Show download status */}
          {isVideoDownloaded ? (
            <View style={{ width: '90%', marginTop: 5, padding: 8, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 6 }}>
              <CustomText fontSize={11} fontWeight="500" style={{ color: '#4CAF50', textAlign: 'center' }}>
                ✅ "{title}" is ready to SPRED
              </CustomText>
            </View>
          ) : (
            <View style={{ width: '90%', marginTop: 5, padding: 8, backgroundColor: 'rgba(244, 83, 3, 0.1)', borderRadius: 6 }}>
              <CustomText fontSize={11} fontWeight="500" style={{ color: '#F45303', textAlign: 'center' }}>
                ⚠️ Download this video first to enable SPRED sharing
              </CustomText>
            </View>
          )}

          <View style={{ width: '90%', marginTop: 15 }}>
            <CustomButton
              image={require('../../../assets/icons/spred-share.png')}
              onPress={toggleSend}
              title={isVideoDownloaded ? "Spred" : "Spred (Download Required)"}
              width="98%"
              backgroundColor={isVideoDownloaded ? undefined : "#6A6A6A"}
            />
          </View>
          <View style={{ marginTop: 10, width: '90%' }}>
            <CustomButton
              image={require('../../../assets/downarrows.png')}
              onPress={toggleReceive}
              title="Receive"
              width="98%"
              backgroundColor="#6A6A6A"
            />
          </View>
        </View>
      )}
    </>
  );
};

export default Spred;
