import { View, ActivityIndicator, Text } from 'react-native';
import { CustomButton, Icon, CustomText } from '../../components';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import {
  ExternalDirectoryPath,
  exists,
  mkdir,
  writeFile,
  downloadFile,
  stat,
} from 'react-native-fs';
import ProgressBar from 'react-native-progress/Bar';
import FileViewer from 'react-native-file-viewer';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import {
  getDataJson,
  storeDataJson,
} from '../../../src/helpers/api/Asyncstorage';
import { customHeaders } from '../../../src/helpers/api/apiConfig';
import axios from 'axios';
import { api } from '../../../src/helpers/api/api';

// Define User interface for type safety
interface User {
  token?: string;
  id?: string;
  [key: string]: any;
}

// Define Wallet interface for type safety
interface Wallet {
  account_Reference?: string;
  [key: string]: any;
}

// Helper function to extract filename from URL
const getFileNameFromURL = (url: string) => {
  try {
    // Validate input with more detailed checks
    if (!url) {
      // DISABLED FOR PERFORMANCE
      // console.log('getFileNameFromURL: No URL provided');
      return null;
    }

    if (typeof url !== 'string') {
      // DISABLED FOR PERFORMANCE
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    if (url.length === 0) {
      // DISABLED FOR PERFORMANCE
      // console.log('getFileNameFromURL: Empty URL provided');
      return null;
    }

    // DISABLED FOR PERFORMANCE
    // console.log('getFileNameFromURL: Processing URL:', url);
    // DISABLED FOR PERFORMANCE
    // console.log('getFileNameFromURL: URL length:', url.length);

    // Extract the filename from the URL or use a unique identifier if needed
    const urlParts = url.split('/');
    // DISABLED FOR PERFORMANCE
    // console.log('getFileNameFromURL: URL parts:', urlParts);

    if (!urlParts || urlParts.length === 0) {
      // DISABLED FOR PERFORMANCE
      // console.log('getFileNameFromURL: Could not split URL:', url);
      return null;
    }

    const fileName = urlParts[urlParts.length - 1]; // Get the last part of the URL (likely the filename)
    // DISABLED FOR PERFORMANCE
    // console.log('getFileNameFromURL: Extracted filename:', fileName);

    if (!fileName) {
      // DISABLED FOR PERFORMANCE
      // console.log('getFileNameFromURL: No filename found in URL:', url);
      return null;
    }

    if (fileName.length === 0) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    // Optionally, remove any query parameters or extensions from the filename
    const fileNameWithoutParams = fileName.split('?')[0]; // Remove query parameters
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '...',
    //   '...',
    // );

    if (!fileNameWithoutParams) {
      // DISABLED FOR PERFORMANCE
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    if (fileNameWithoutParams.length === 0) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    const fileNameWithoutExtension = fileNameWithoutParams.split('.')[0]; // Remove file extension (if needed)
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '...',
    //   '...',
    // );

    if (!fileNameWithoutExtension) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    if (fileNameWithoutExtension.length === 0) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    // Additional validation - check for invalid characters in filename
    if (/[<>:"/\\|?*]/.test(fileNameWithoutExtension)) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      return null;
    }

    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '...',
    //   '...',
    // );
    return fileNameWithoutExtension; // Return the extracted filename
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '...',
    //   '...',
    // );
    // DISABLED FOR PERFORMANCE
    // console.log('getFileNameFromURL: Error stack:', error?.stack);
    return null;
  }
};

// Helper function to create safe filename from title
const createSafeFilename = (title: string, originalUrl: string): string => {
  if (!title) {
    return getFileNameFromURL(originalUrl);
  }

  // Remove invalid filename characters and limit length
  const safeTitle = title
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length

  return safeTitle || getFileNameFromURL(originalUrl);
};

// Helper function to save video metadata
const saveVideoMetadata = async (filePath: string, metadata: any) => {
  try {
    const metadataPath = `${filePath}.meta.json`;
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    // DISABLED FOR PERFORMANCE
    // console.log('✅ Metadata saved successfully');
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log('⚠️ Failed to save metadata:', error.message);
  }
};

// Helper function to decode base64 (React Native compatible)
const base64Decode = (str: string): string => {
  // Use global atob if available (web), otherwise implement base64 decoding
  if (typeof atob !== 'undefined') {
    return atob(str);
  }

  // React Native compatible base64 decoder
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  // Add padding if needed
  str = str.replace(/[^A-Za-z0-9+/]/g, '');
  while (str.length % 4) {
    str += '=';
  }

  while (i < str.length) {
    const a = chars.indexOf(str.charAt(i++));
    const b = chars.indexOf(str.charAt(i++));
    const c = chars.indexOf(str.charAt(i++));
    const d = chars.indexOf(str.charAt(i++));

    const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

    result += String.fromCharCode((bitmap >> 16) & 255);
    if (c !== 64) {
      result += String.fromCharCode((bitmap >> 8) & 255);
    }
    if (d !== 64) {
      result += String.fromCharCode(bitmap & 255);
    }
  }

  return result;
};

// Helper function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return true;
    }

    const payload = JSON.parse(base64Decode(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = payload.exp;

    if (!expirationTime) {
      return true;
    }

    const isExpired = expirationTime < currentTime;
    const timeUntilExpiration = expirationTime - currentTime;

    // DISABLED FOR PERFORMANCE
    // console.log('🔐 Token expiration check:');
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '  - Current time:',
    //   new Date(currentTime * 1000).toLocaleString(),
    // );
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '  - Token expires:',
    //   new Date(expirationTime * 1000).toLocaleString(),
    // );
    // DISABLED FOR PERFORMANCE
    // console.log('  - Time until expiration:', timeUntilExpiration, 'seconds');
    // DISABLED FOR PERFORMANCE
    // console.log('  - Is expired:', isExpired);

    return isExpired;
  } catch (error) {
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '...',
    //   '...',
    // );
    // DISABLED FOR PERFORMANCE
    // console.log('⚠️ Allowing token to proceed to server for validation');
    return false; // Let server validate if we can't parse locally
  }
};

// Helper function to convert ArrayBuffer to base64 (React Native compatible)
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  const chars = [];
  for (let i = 0; i < bytes.byteLength; i++) {
    chars.push(String.fromCharCode(bytes[i]));
  }
  const binary = chars.join('');

  // Use React Native's btoa if available, otherwise implement base64 encoding
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }

  // Fallback base64 encoding implementation
  const base64chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = i < binary.length ? binary.charCodeAt(i++) : 0;
    const c = i < binary.length ? binary.charCodeAt(i++) : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += base64chars.charAt((bitmap >> 18) & 63);
    result += base64chars.charAt((bitmap >> 12) & 63);
    result +=
      i - 2 < binary.length ? base64chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < binary.length ? base64chars.charAt(bitmap & 63) : '=';
  }

  return result;
};

const DownloadItems = ({ url, title }: { url: string; title?: string }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [mainloading, setMainLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState(0);
  const [getBalnace, setGetBalance] = useState<{
    currency?: string;
    available_balance?: number;
    ledger_balance?: number;
  }>({
    currency: undefined,
    available_balance: undefined,
    ledger_balance: undefined,
  });
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState<string | null>(
    null,
  );
  const [videoFileSize, setVideoFileSize] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      // DISABLED FOR PERFORMANCE
      // console.log('🚀 DownloadItems component initializing...');
      // DISABLED FOR PERFORMANCE
      // console.log('🎥 Video URL/Key received:', url);
      // DISABLED FOR PERFORMANCE
      // console.log('🏷️ Video title received:', title || 'No title provided');
      setMainLoading(true);
      setLoading(false); // Reset loading state
      setProgress(0); // Reset progress

      // DISABLED FOR PERFORMANCE
      // console.log('🔄 Loading wallet details...');
      await getStoredWalletDetails();

      // DISABLED FOR PERFORMANCE
      // console.log('🔄 Loading user data...');
      await getStoredUserData();

      // DISABLED FOR PERFORMANCE
      // console.log('🔍 Checking if video is already downloaded...');
      await checkIfVideoDownloaded();

      // DISABLED FOR PERFORMANCE
      // console.log('📏 Fetching video file size...');
      await fetchVideoFileSize();

      setMainLoading(false);
      // DISABLED FOR PERFORMANCE
      // console.log('✅ DownloadItems component initialization complete');
    }

    load();

    // Cleanup function to reset states when component unmounts
    return () => {
      setLoading(false);
      setProgress(0);
    };
  }, []);

  const checkIfVideoDownloaded = async () => {
    try {
      const safeFileName = createSafeFilename(title, url);
      const fileExtension = 'mp4';

      // Check both possible download folders
      const foldersToCheck = [
        'SpredVideos', // Android 10+ folder (newer downloads)
        '.spredHiddenFolder', // Older Android/iOS folder (legacy downloads)
      ];

      for (const folderName of foldersToCheck) {
        const folderPath = `${ExternalDirectoryPath}/${folderName}`;
        const filePath = `${folderPath}/${safeFileName}.${fileExtension}`;

        // DISABLED FOR PERFORMANCE
        // console.log(`📁 Checking if file exists: ${filePath}`);
        const fileExists = await exists(filePath);

        if (fileExists) {
          // DISABLED FOR PERFORMANCE
          // console.log(`✅ Video already downloaded: ${filePath}`);
          setIsDownloaded(true);
          setDownloadedFilePath(filePath);
          return;
        }
      }

      // DISABLED FOR PERFORMANCE
      // console.log('📁 Video not found in download folders');
      setIsDownloaded(false);
      setDownloadedFilePath(null);
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Error checking download status:', error.message);
      setIsDownloaded(false);
      setDownloadedFilePath(null);
    }
  };

  const playDownloadedVideo = async () => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🎬 Playing downloaded video:', downloadedFilePath);

      if (!downloadedFilePath) {
        Alert.alert('Error', 'Downloaded video file not found');
        return;
      }

      // Check if file still exists
      const fileExists = await exists(downloadedFilePath);
      if (!fileExists) {
        Alert.alert(
          'File Not Found',
          'The downloaded video file seems to have been moved or deleted. Please download again.',
          [
            { text: 'OK' },
            {
              text: 'Re-download',
              onPress: () => {
                setIsDownloaded(false);
                setDownloadedFilePath(null);
              },
            },
          ],
        );
        return;
      }

      // Create movie object similar to what's used in Downloads screen
      const movieData = {
        name: title || 'Downloaded Video',
        originalTitle: title || 'Downloaded Video',
        fileName: downloadedFilePath.split('/').pop(),
        path: downloadedFilePath,
        // Ensure required properties exist
        size: 0,
        type: 'video',
        createdAt: new Date().toISOString(),
      };

      // Validate movie data before navigation
      if (!movieData.path) {
        // DISABLED FOR PERFORMANCE
        // console.log('❌ No valid path for movie data:', movieData);
        Alert.alert('Error', 'Video file path is invalid.');
        return;
      }

      // Navigate to PlayDownloadedVideo screen
      // DISABLED FOR PERFORMANCE
      // console.log('📱 Navigating to PlayDownloadedVideo with:', movieData);
      navigation.navigate('PlayDownloadedVideo', { videoPath: movieData.path, videoTitle: movieData.name });
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error playing downloaded video:', error.message);
      Alert.alert('Error', 'Failed to play downloaded video');
    }
  };

  const fetchVideoFileSize = async () => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('📏 Fetching video file size from API...');

      if (!user?.token || !user?.id) {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Missing user credentials for file size check');
        return;
      }

      // Skip token expiration check for size fetching since it's non-critical
      if (isTokenExpired(user.token)) {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Token expired - skipping file size check');
        return;
      }

      const downloadPayload = {
        bucketName: 'spredmedia-video-content',
        key: url,
        amount: 0,
        narration: 'checking file size',
        currency: wallet?.account_Reference ? 'NGN' : '',
        debit_currency: wallet?.account_Reference ? 'NGN' : '',
        debit_subaccount: wallet?.account_Reference || '',
        userId: user?.id || '',
        pin: '0000',
      };

      const headers = {
        ...customHeaders(user?.token),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      // Create cancel token to abort request early once we get headers
      const CancelToken = axios.CancelToken;
      const source = CancelToken.source();

      const response = await axios.post(
        'https://www.spred.cc/Api/ContentManager/Content/download-content',
        downloadPayload,
        {
          headers,
          responseType: 'arraybuffer',
          cancelToken: source.token,
          // Add timeout to prevent hanging
          timeout: 10000, // 10 seconds
          onDownloadProgress: progressEvent => {
            // Cancel after getting a small amount of data to save bandwidth
            if (progressEvent.loaded > 1024) {
              // Cancel after 1KB
              source.cancel('File size obtained, cancelling download');
            }
          },
        },
      );

      if (response?.status === 200 && response?.headers['content-length']) {
        const fileSizeBytes = parseInt(response.headers['content-length']);
        // DISABLED FOR PERFORMANCE
        // console.log('📊 Video file size:', fileSizeBytes, 'bytes');
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '📊 Video file size:',
        //   Math.round(fileSizeBytes / 1048576),
        //   'MB',
        // );
        setVideoFileSize(fileSizeBytes);
      }
    } catch (error) {
      // Handle cancellation (which is expected) and other errors
      if (axios.isCancel(error)) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '✅ File size check cancelled after getting headers (expected behavior)',
        // );
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('⚠️ Could not fetch video file size:', error?.message);
      }
      // Don't set to null if we already have a size from a cancelled request
      if (!videoFileSize) {
        setVideoFileSize(null);
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) {
      return 'Unknown size';
    }

    if (bytes < 1048576) {
      // Less than 1MB, show in KB
      return `${Math.round(bytes / 1024)}KB`;
    } else if (bytes < 1073741824) {
      // Less than 1GB, show in MB
      return `${Math.round(bytes / 1048576)}MB`;
    } else {
      // 1GB or more, show in GB
      return `${(bytes / 1073741824).toFixed(1)}GB`;
    }
  };

  let payload = {
    bucketName: 'spredmedia-video-content',
    key: 'dummyVideoKey',
    amount: 120,
    narration: 'downloading the dummy data',
    currency: 'NGN',
    debit_currency: 'NGN',
    debit_subaccount: wallet?.account_Reference,
    userId: user?.id,
    pin: '0000',
  };

  const config = {
    headers: {
      mobileAppByPassIVAndKey:
        'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
      username: 'SpredMediaAdmin',
      password: 'SpredMediaLoveSpreding@2023',
      Authorization: `Bearer ${user?.token}`, // Add the Authorization header with the token
    },
  };

  const getStoredUserData = async () => {
    // DISABLED FOR PERFORMANCE
    // console.log('👤 Fetching stored user data...');
    const gotten = await getDataJson<User | null>('User');
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '👤 Retrieved user details (FULL)',
    //   JSON.stringify(gotten, null, 2),
    // );
    // DISABLED FOR PERFORMANCE
    // console.log('👤 User token exists:', !!gotten?.token);
    // DISABLED FOR PERFORMANCE
    // console.log('👤 User ID:', gotten?.id);
    // DISABLED FOR PERFORMANCE
    // console.log('👤 User token length:', gotten?.token?.length || 0);
    // DISABLED FOR PERFORMANCE
    // console.log(
    //   '👤 User token starts with:',
    //   gotten?.token?.substring(0, 10) || 'NO TOKEN',
    // );

    // Check if token is expired by decoding JWT (basic check)
    if (gotten?.token) {
      try {
        const tokenParts = gotten.token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp && payload.exp < currentTime;
          // DISABLED FOR PERFORMANCE - console.('👤 Token expiry:', new Date(payload.exp * 1000));
          // DISABLED FOR PERFORMANCE - console.('👤 Current time:', new Date(currentTime * 1000));
          // DISABLED FOR PERFORMANCE
          // console.log('👤 Token expired:', isExpired);
        }
      } catch (e) {
        // DISABLED FOR PERFORMANCE
        // console.log('👤 Could not decode token:', e.message);
      }
    }

    setUser(gotten);
    // DISABLED FOR PERFORMANCE
    // console.log('✅ User data loaded successfully');
  };

  //get wallet details (optional for free downloads)
  const getStoredWalletDetails = async () => {
    // DISABLED FOR PERFORMANCE
    // console.log('🏦 Fetching stored wallet details...');
    try {
      const gotten = await getDataJson<Wallet | null>('WalletDetails');
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '🏦 Retrieved wallet details (FULL)',
      //   JSON.stringify(gotten, null, 2),
      // );
      setWallet(gotten || {}); // Set empty object if no wallet details

      if (gotten?.account_Reference) {
        // DISABLED FOR PERFORMANCE
        // console.log('💰 Fetching account balance...');
        const balanceUrl = `${api.fecthAccountBalance}/${gotten?.account_Reference}?currency=NGN`;
        // DISABLED FOR PERFORMANCE
        // console.log('💰 Balance API URL:', balanceUrl);
        // DISABLED FOR PERFORMANCE - console.('💰 Balance API config:', JSON.stringify(config, null, 2));

        try {
          let response = await axios.get(balanceUrl, config);
          // DISABLED FOR PERFORMANCE
          // console.log('💰 Balance API response status:', response?.status);
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '💰 Balance API response (FULL)',
          //   JSON.stringify(response?.data, null, 2),
          // );
          setGetBalance(response?.data?.data);
          // DISABLED FOR PERFORMANCE
          // console.log('✅ Wallet balance loaded successfully');
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Error fetching wallet balance:', error);
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '❌ Balance error response:',
          //   JSON.stringify(error?.response?.data, null, 2),
          // );
          // Don't fail the whole process - continue with free downloads
          setGetBalance({
            currency: 'NGN',
            available_balance: 0,
            ledger_balance: 0,
          });
        }
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );
        setGetBalance({
          currency: 'NGN',
          available_balance: 0,
          ledger_balance: 0,
        });
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );
      // DISABLED FOR PERFORMANCE
      // console.log('⚠️ Error:', error);
      setWallet({}); // Set empty wallet object
      setGetBalance({
        currency: 'NGN',
        available_balance: 0,
        ledger_balance: 0,
      });
    }
  };

  //initiate download with new API
  const DownloadContent = async () => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🔄 Starting download with new API...');
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );

      const downloadPayload = {
        bucketName: 'spredmedia-video-content',
        key: url, // Use the trailerKey or videoKey passed as url
        amount: 0, // Free downloads
        narration: 'downloading video content',
        currency: wallet?.account_Reference ? 'NGN' : '', // Only set currency if wallet exists
        debit_currency: wallet?.account_Reference ? 'NGN' : '',
        debit_subaccount: wallet?.account_Reference || '', // Use wallet reference if available, empty if not
        userId: user?.id || '',
        pin: '0000',
      };

      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '📤 Download payload (FULL)',
      //   JSON.stringify(downloadPayload, null, 2),
      // );
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '🔑 User token:',
      //   user?.token ? `${user.token.substring(0, 20)}...` : 'NO TOKEN',
      // );
      // DISABLED FOR PERFORMANCE
      // console.log('👤 User ID:', user?.id || 'NO USER ID');
      // DISABLED FOR PERFORMANCE
      // console.log('🎥 Video URL/Key:', url);

      const headers = {
        ...customHeaders(user?.token),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '📋 Request headers (FULL)',
      //   JSON.stringify(headers, null, 2),
      // );

      // Validate required fields before making request
      if (!user?.id) {
        throw new Error('User ID is required but not found');
      }

      if (!user?.token) {
        throw new Error('User token is required but not found');
      }

      // Check if token is expired before making the request
      if (isTokenExpired(user.token)) {
        throw new Error(
          'Authentication token has expired. Please log out and log back in to continue downloading.',
        );
      }

      // Don't download the actual file during size check - use HEAD request if possible
      // But since the API might not support HEAD, we'll use POST with immediate abort

      // DISABLED FOR PERFORMANCE
      // console.log('🚀 Making API request...');
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      // );

      const response = await axios.post(
        'https://www.spred.cc/Api/ContentManager/Content/download-content',
        downloadPayload,
        {
          headers,
          responseType: 'arraybuffer', // Important: Handle binary data
        },
      );

      // DISABLED FOR PERFORMANCE
      // console.log('📥 Download API Response Status:', response?.status);
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '📥 Download API Response Headers:',
      //   JSON.stringify(response?.headers, null, 2),
      // );
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );

      // Check if response is a video file (binary data)
      if (
        response?.status === 200 &&
        response?.headers['content-type'] === 'video/mp4'
      ) {
        // DISABLED FOR PERFORMANCE
        // console.log('✅ Got video file directly from API');
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        //   '...',
        // );
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '📊 File size:',
        //   Math.round(
        //     (response?.data?.byteLength ||
        //       response?.headers['content-length']) / 1048576,
        //   ),
        //   'MB',
        // );

        return {
          isDirectFile: true,
          data: response?.data,
          contentLength: response?.headers['content-length'],
          filename:
            response?.headers['content-disposition']?.match(
              /filename=(.+)/,
            )?.[1] || `${url}.mp4`,
        };
      }

      // Fallback: Try to parse as JSON for URL-based response
      try {
        const jsonData =
          typeof response?.data === 'string'
            ? JSON.parse(response?.data)
            : response?.data;

        const downloadUrl =
          jsonData?.url ||
          jsonData?.data?.url ||
          jsonData?.downloadUrl ||
          jsonData?.data?.downloadUrl ||
          jsonData?.signedUrl ||
          jsonData?.data?.signedUrl;

        if (downloadUrl) {
          // DISABLED FOR PERFORMANCE
          // console.log('✅ Got download URL:', downloadUrl);
          // DISABLED FOR PERFORMANCE
          // console.log('🔍 Download URL length:', downloadUrl.length);
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '🔍 Download URL starts with:',
          //   downloadUrl.substring(0, 50),
          // );
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '🔍 Download URL protocol:',
          //   downloadUrl.startsWith('https')
          //     ? 'HTTPS'
          //     : downloadUrl.startsWith('http')
          //     ? 'HTTP'
          //     : 'OTHER',
          // );
          return { isDirectFile: false, url: downloadUrl };
        }
      } catch (parseError) {
        // DISABLED FOR PERFORMANCE
        // console.log(
        //   '...',
        // );
      }

      // DISABLED FOR PERFORMANCE
      // console.log('❌ No download URL found and not a direct file');
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '...',
      //   '...',
      // );
      // DISABLED FOR PERFORMANCE
      // console.log('🔍 Response status:', response?.status);

      throw new Error(
        'No download URL received from API and response is not a direct file',
      );
    } catch (error) {
      // DISABLED FOR PERFORMANCE - console.('❌ Download API error (FULL)', error);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error message:', error?.message);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error response status:', error?.response?.status);
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Error response data type:', typeof error?.response?.data);
      // DISABLED FOR PERFORMANCE
      // console.log(
      //   '❌ Error response headers:',
      //   JSON.stringify(error?.response?.headers, null, 2),
      // );

      // Handle token expiration specifically
      if (error?.response?.status === 401) {
        const wwwAuth = error?.response?.headers?.['www-authenticate'];
        if (
          wwwAuth &&
          wwwAuth.includes('invalid_token') &&
          wwwAuth.includes('expired')
        ) {
          // Extract expiration time from the error message
          const expiredAtMatch = wwwAuth.match(
            /The token expired at '([^']+)'/,
          );
          const expiredAt = expiredAtMatch ? expiredAtMatch[1] : 'unknown time';

          // DISABLED FOR PERFORMANCE
          // console.log('🔐 Token expired at:', expiredAt);
          // DISABLED FOR PERFORMANCE - console.('🔐 Current time:', new Date().toLocaleString());

          throw new Error(
            `Authentication token has expired (expired at ${expiredAt}). Please log out and log back in to continue downloading.`,
          );
        } else {
          throw new Error(
            'Authentication failed. Please check your login credentials and try again.',
          );
        }
      }

      throw error;
    }
  };

  const saveToPrivateFolder = async (url: string, callback?: () => void) => {
    try {
      // DISABLED FOR PERFORMANCE
      // console.log('🎬 DOWNLOAD BUTTON PRESSED - Starting download process...');
      // DISABLED FOR PERFORMANCE
      // console.log('🎥 Video URL/Key to download:', url);
      // DISABLED FOR PERFORMANCE
      // console.log('💰 Current balance:', getBalnace?.available_balance);
      // DISABLED FOR PERFORMANCE
      // console.log('💰 Balance currency:', getBalnace?.currency);
      // DISABLED FOR PERFORMANCE
      // console.log('💰 Ledger balance:', getBalnace?.ledger_balance);
      // DISABLED FOR PERFORMANCE - console.('👤 Current user:', JSON.stringify(user, null, 2));
      // DISABLED FOR PERFORMANCE - console.('🏦 Current wallet:', JSON.stringify(wallet, null, 2));

      // Force garbage collection before starting download
      if (global.gc) {
        global.gc();
        // DISABLED FOR PERFORMANCE
        // console.log('🧹 Garbage collection performed before download');
      }

      // Validate required parameters
      if (!url || typeof url !== 'string' || url.trim() === '') {
        Alert.alert('Error', 'Invalid video URL. Please try again.');
        return;
      }

      if (!navigation) {
        Alert.alert(
          'Error',
          'Navigation not available. Please restart the app.',
        );
        return;
      }

      if (!user?.token) {
        Alert.alert(
          'Authentication Error',
          'Please log in again to continue downloading.',
        );
        return;
      }

      // DISABLED FOR PERFORMANCE
      // console.log('✅ All validations passed - proceeding with download');

      // Balance check (commented out for free downloads)
      // if (getBalnace?.available_balance < 100) {
      //   // DISABLED FOR PERFORMANCE
      // console.log('❌ Insufficient balance - showing alert');
      //   Alert.alert(
      //     'Insufficient Balance',
      //     'You need at least NGN100 in your wallet balance',
      //     [
      //       {
      //         text: 'Cancel',
      //         style: 'cancel',
      //       },
      //       {
      //         text: 'Okay',
      //       },
      //     ],
      //   );
      //   return;
      // }

      // DISABLED FOR PERFORMANCE
      // console.log('✅ Balance check passed - proceeding with download');

      if (Platform.OS === 'android') {
        // DISABLED FOR PERFORMANCE
        // console.log('📱 Platform: Android - checking permissions');
        // DISABLED FOR PERFORMANCE
        // console.log('📱 Android API Level:', Platform.Version);

        try {
          // For Android 10+ (API 29+), we should use app-specific directories
          // which don't require storage permissions
          if (Platform.Version >= 29) {
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '📱 Android 10+ detected - using scoped storage (no permissions needed)',
            // );
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '...',
            // );

            setLoading(true);

            // Get download data from new API
            // DISABLED FOR PERFORMANCE - console.('🔄 Calling DownloadContent API (Android 10+)...');
            const downloadResult = await DownloadContent();
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '✅ Got download result from API (Android 10)',
            //   downloadResult?.isDirectFile ? 'Direct file' : 'URL',
            // );

            // Use app-specific directory (no permissions needed)
            const safeFileName = createSafeFilename(title, url);
            const fileExtension = 'mp4';
            const folderName = 'SpredVideos'; // Use a more user-friendly folder name
            const folderPath = `${ExternalDirectoryPath}/${folderName}`;
            const filePath = `${folderPath}/${safeFileName}.${fileExtension}`;

            // Prepare metadata for this download
            const videoMetadata = {
              originalTitle: title || 'Unknown Title',
              originalUrl: url,
              downloadDate: new Date().toISOString(),
              safeFileName: safeFileName,
              fileSize: downloadResult.contentLength,
            };

            // DISABLED FOR PERFORMANCE - console.('📁 File details (Android 10+):');
            // DISABLED FOR PERFORMANCE
            // console.log('  - Folder path:', folderPath);
            // DISABLED FOR PERFORMANCE
            // console.log('  - Full file path:', filePath);

            const fileExists = await exists(folderPath);
            // DISABLED FOR PERFORMANCE
            // console.log('📁 Folder exists:', fileExists);
            if (!fileExists) {
              // DISABLED FOR PERFORMANCE
              // console.log('📁 Creating folder...');
              await mkdir(folderPath);
              // DISABLED FOR PERFORMANCE
              // console.log('✅ Folder created successfully');
            }

            let res;

            if (downloadResult?.isDirectFile) {
              // Handle direct file data
              // DISABLED FOR PERFORMANCE - console.('⬇️ Starting direct file write (Android 10+)...');
              // DISABLED FOR PERFORMANCE
              // console.log(
              //   '...',
              //   '...',
              // );
              // DISABLED FOR PERFORMANCE
              // console.log(
              //   '📊 File size:',
              //   Math.round(downloadResult.contentLength / 1048576),
              //   'MB',
              // );
              setProgress(0.1); // Show some progress

              try {
                // Convert ArrayBuffer to Uint8Array for more efficient handling
                const buffer = downloadResult.data;
                const uint8Array = new Uint8Array(buffer);

                // DISABLED FOR PERFORMANCE
                // console.log('💾 Writing file directly to storage...');
                // DISABLED FOR PERFORMANCE
                // console.log('🔍 Buffer type:', typeof buffer);
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '...',
                //   '...',
                // );
                // DISABLED FOR PERFORMANCE
                // console.log('🔍 Uint8Array length:', uint8Array.length);

                // OPTIMIZED: Remove artificial delays for better performance
                setProgress(0.4);

                // Try writing as binary data first, then fallback to base64 if needed
                try {
                  setProgress(0.6);
                  // OPTIMIZED: Simplified chunk processing for better performance
                  const chunkSize = 8192; // Larger chunks for better performance
                  let binaryString = '';
                  for (let i = 0; i < uint8Array.length; i += chunkSize) {
                    const end = Math.min(i + chunkSize, uint8Array.length);
                    const chunk = uint8Array.slice(i, end);

                    // Simplified binary string creation
                    binaryString += String.fromCharCode.apply(
                      null,
                      Array.from(chunk),
                    );
                  }

                  setProgress(0.8);
                  await writeFile(filePath, binaryString, 'ascii');
                  // DISABLED FOR PERFORMANCE
                  // console.log('✅ Binary write successful');
                } catch (binaryError) {
                  // DISABLED FOR PERFORMANCE
                  // console.log(
                  //   '...',
                  //   '...',
                  // );
                  setProgress(0.6);
                  // Method 2: Fallback to base64 conversion with memory management
                  try {
                    const base64Data = arrayBufferToBase64(buffer);
                    setProgress(0.8);
                    await writeFile(filePath, base64Data, 'base64');
                    // DISABLED FOR PERFORMANCE
                    // console.log('✅ Base64 write successful');
                  } catch (base64Error) {
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   '...',
                    //   '...',
                    // );
                    throw new Error(
                      `Both binary and base64 write methods failed. Binary error: ${binaryError.message}, Base64 error: ${base64Error.message}`,
                    );
                  }
                }

                setProgress(0.95);
                // OPTIMIZED: Remove artificial delay

                // DISABLED FOR PERFORMANCE - console.('✅ Direct file write completed (Android 10+)');
                setProgress(1); // Complete

                res = {
                  statusCode: 200,
                  bytesWritten: downloadResult.contentLength,
                };
              } catch (writeError) {
                // DISABLED FOR PERFORMANCE
                // console.log('❌ File write error:', writeError);
                throw new Error(`Failed to write file: ${writeError.message}`);
              }
            } else {
              // Handle URL-based download
              // DISABLED FOR PERFORMANCE - console.('⬇️ Starting URL-based download (Android 10+)...');

              // Add memory and timeout optimizations for large files
              const downloadOptions = {
                fromUrl: encodeURI(downloadResult.url),
                toFile: filePath,
                progressDivider: 10, // Reduce progress callback frequency to save memory
                connectionTimeout: 30000, // 30 seconds timeout
                readTimeout: 60000, // 60 seconds read timeout
                discretionary: true, // Allow system to manage download timing
                cacheable: false, // Don't cache to save memory
                begin: res => {
                  // DISABLED FOR PERFORMANCE - console.('📥 Download started (Android 10+)');
                  // DISABLED FOR PERFORMANCE
                  // console.log('📊 File size:', res.contentLength, 'bytes');
                  // DISABLED FOR PERFORMANCE
                  // console.log(
                  //   '📊 File size:',
                  //   Math.round(res.contentLength / 1048576),
                  //   'MB',
                  // );
                  setProgress(0);

                  // Check if file is too large for device
                  if (res.contentLength > 100 * 1024 * 1024) {
                    // 100MB
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   '...',
                    // );
                  }
                },
                progress: rs => {
                  const newProgress = rs.bytesWritten / rs.contentLength;

                  // Log progress less frequently for large files to reduce memory pressure
                  if (Math.round(newProgress * 100) % 5 === 0) {
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   `📊 Download progress: ${Math.round(
                    //     newProgress * 100,
                    //   )}% (${Math.round(
                    //     rs.bytesWritten / 1048576,
                    //   )}MB/${Math.round(rs.contentLength / 1048576)}MB)`,
                    // );
                  }

                  setProgress(newProgress);

                  // Force garbage collection periodically for large downloads
                  if (rs.bytesWritten % (10 * 1024 * 1024) === 0) {
                    // Every 10MB
                    if (global.gc) {
                      global.gc();
                    }
                  }
                },
              };

              res = await downloadFile(downloadOptions).promise;
            }

            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '✅ Download completed (Android 10+)',
            //   JSON.stringify(res, null, 2),
            // );

            // Check if file actually exists
            const fileExistsAfterDownload = await exists(filePath);
            // DISABLED FOR PERFORMANCE
            // console.log('✅ File exists after download:', fileExistsAfterDownload);

            if (fileExistsAfterDownload) {
              const fileStats = await stat(filePath);
              // DISABLED FOR PERFORMANCE - console.('📊 File stats:', JSON.stringify(fileStats, null, 2));

              // Save metadata file
              await saveVideoMetadata(filePath, {
                ...videoMetadata,
                actualFileSize: fileStats.size,
              });

              // Update download status
              setIsDownloaded(true);
              setDownloadedFilePath(filePath);
            }

            callback?.();
            setLoading(false);

            Alert.alert(
              'Success',
              'Video saved to device successfully!',
              [
                {
                  text: 'View Downloads',
                  onPress: () => {
                    // DISABLED FOR PERFORMANCE
                    // console.log('🎯 Navigating to Downloads screen');
                    navigation.navigate('Download');
                  },
                  style: 'default',
                },
                {
                  text: 'Okay',
                  style: 'cancel',
                },
              ],
              { cancelable: false },
            );

            return; // Exit early for Android 10+
          }

          // For older Android versions, use the traditional permission approach
          // DISABLED FOR PERFORMANCE
          // console.log('📱 Android 9 or below - checking storage permissions');
          const writePermission =
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
          const readPermission =
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

          // DISABLED FOR PERFORMANCE
          // console.log('🔐 Write permission:', writePermission);
          // DISABLED FOR PERFORMANCE
          // console.log('🔐 Read permission:', readPermission);

          const writeGranted = await PermissionsAndroid.check(writePermission);
          const readGranted = await PermissionsAndroid.check(readPermission);
          // DISABLED FOR PERFORMANCE
          // console.log('✅ Permission check results:');
          // DISABLED FOR PERFORMANCE
          // console.log('  - Write granted:', writeGranted);
          // DISABLED FOR PERFORMANCE
          // console.log('  - Read granted:', readGranted);

          if (!writeGranted) {
            // DISABLED FOR PERFORMANCE
            // console.log('🔐 Requesting write permission...');
            const granted = await PermissionsAndroid.request(writePermission);
            // DISABLED FOR PERFORMANCE
            // console.log('🔐 Permission request result:', granted);

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              // DISABLED FOR PERFORMANCE
              // console.log('✅ Write permission granted after request');
              setLoading(true);
              // DISABLED FOR PERFORMANCE
              // console.log('✅ Storage permissions granted - starting download');

              // Get download data from new API
              // DISABLED FOR PERFORMANCE
              // console.log('🔄 Calling DownloadContent API...');
              const downloadResult = await DownloadContent();
              // DISABLED FOR PERFORMANCE
              // console.log(
              //   '...',
              //   '...',
              // );

              // Proceed with file operations
              const safeFileName = createSafeFilename(title, url);
              const fileExtension = 'mp4'; // Set the video file extension

              const folderName = '.spredHiddenFolder';
              const folderPath = `${ExternalDirectoryPath}/${folderName}`;
              const filePath = `${folderPath}/${safeFileName}.${fileExtension}`;

              // Prepare metadata for this download
              const videoMetadata = {
                originalTitle: title || 'Unknown Title',
                originalUrl: url,
                downloadDate: new Date().toISOString(),
                safeFileName: safeFileName,
                fileSize: downloadResult.contentLength,
              };

              // DISABLED FOR PERFORMANCE
              // console.log('📁 File details:');
              // DISABLED FOR PERFORMANCE
              // console.log('  - Original URL:', url);
              // DISABLED FOR PERFORMANCE
              // console.log('  - Video title:', title || 'No title');
              // DISABLED FOR PERFORMANCE
              // console.log('  - Safe filename:', safeFileName);
              // DISABLED FOR PERFORMANCE
              // console.log('  - File extension:', fileExtension);
              // DISABLED FOR PERFORMANCE
              // console.log('  - Folder name:', folderName);
              // DISABLED FOR PERFORMANCE
              // console.log('  - Folder path:', folderPath);
              // DISABLED FOR PERFORMANCE
              // console.log('  - Full file path:', filePath);

              const fileExists = await exists(folderPath);
              // DISABLED FOR PERFORMANCE
              // console.log('📁 Folder exists:', fileExists);
              if (!fileExists) {
                // DISABLED FOR PERFORMANCE
                // console.log('📁 Creating folder...');
                await mkdir(folderPath);
                // DISABLED FOR PERFORMANCE
                // console.log('✅ Folder created successfully');
              }

              let res;

              if (downloadResult?.isDirectFile) {
                // Handle direct file data
                // DISABLED FOR PERFORMANCE
                // console.log('⬇️ Starting direct file write...');
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '...',
                //   '...',
                // );
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '📊 File size:',
                //   Math.round(downloadResult.contentLength / 1048576),
                //   'MB',
                // );
                setProgress(0.1); // Show some progress

                try {
                  // Convert ArrayBuffer to Uint8Array for more efficient handling
                  const buffer = downloadResult.data;
                  const uint8Array = new Uint8Array(buffer);

                  // DISABLED FOR PERFORMANCE
                  // console.log('💾 Writing file directly to storage...');

                  // Simulate progressive updates during file write
                  setProgress(0.2);
                  // OPTIMIZED: Remove artificial delay

                  setProgress(0.4);
                  // OPTIMIZED: Remove artificial delay

                  // Try writing as binary data first, then fallback to base64 if needed
                  try {
                    setProgress(0.6);
                    // Method 1: Write as binary using a more memory-efficient approach
                    const chunkSize = 4096; // Smaller chunks for better memory management
                    let binaryString = '';

                    // Process in smaller chunks to avoid memory issues
                    for (let i = 0; i < uint8Array.length; i += chunkSize) {
                      const end = Math.min(i + chunkSize, uint8Array.length);
                      const chunk = uint8Array.slice(i, end);

                      // Use a safer approach for creating binary strings
                      for (let j = 0; j < chunk.length; j++) {
                        binaryString += String.fromCharCode(chunk[j]);
                      }

                      // Periodic garbage collection for very large files
                      if (i % (chunkSize * 10) === 0 && global.gc) {
                        global.gc();
                      }
                    }
                    setProgress(0.8);
                    await writeFile(filePath, binaryString, 'ascii');
                    // DISABLED FOR PERFORMANCE
                    // console.log('✅ Binary write successful');
                  } catch (binaryError) {
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   '...',
                    //   '...',
                    // );
                    setProgress(0.6);
                    const base64Data = arrayBufferToBase64(buffer);
                    setProgress(0.8);
                    await writeFile(filePath, base64Data, 'base64');
                    // DISABLED FOR PERFORMANCE
                    // console.log('✅ Base64 write successful');
                  }

                  setProgress(0.95);
                  // OPTIMIZED: Remove artificial delay

                  // DISABLED FOR PERFORMANCE
                  // console.log('✅ Direct file write completed');
                  setProgress(1); // Complete

                  res = {
                    statusCode: 200,
                    bytesWritten: downloadResult.contentLength,
                  };
                } catch (writeError) {
                  // DISABLED FOR PERFORMANCE
                  // console.log('❌ File write error:', writeError);
                  throw new Error(
                    `Failed to write file: ${writeError.message}`,
                  );
                }
              } else {
                // Handle URL-based download
                // DISABLED FOR PERFORMANCE
                // console.log('⬇️ Starting URL-based download...');
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '  - From URL (encoded)',
                //   encodeURI(downloadResult.url),
                // );
                // DISABLED FOR PERFORMANCE
                // console.log('  - To file path:', filePath);

                res = await downloadFile({
                  fromUrl: encodeURI(downloadResult.url),
                  toFile: filePath,
                  progressDivider: 10, // Reduce callback frequency
                  connectionTimeout: 30000,
                  readTimeout: 60000,
                  discretionary: true,
                  cacheable: false,
                  begin: res => {
                    // DISABLED FOR PERFORMANCE
                    // console.log('📥 Download started');
                    // DISABLED FOR PERFORMANCE
                    // console.log(
                    //   '📊 File size:',
                    //   Math.round(res.contentLength / 1048576),
                    //   'MB',
                    // );
                    setProgress(0);
                  },
                  progress: rs => {
                    const newProgress = rs.bytesWritten / rs.contentLength;
                    if (Math.round(newProgress * 100) % 5 === 0) {
                      // DISABLED FOR PERFORMANCE
                      // console.log(
                      //   `📊 Download progress: ${Math.round(
                      //     newProgress * 100,
                      //   )}% (${Math.round(
                      //     rs.bytesWritten / 1048576,
                      //   )}MB/${Math.round(rs.contentLength / 1048576)}MB)`,
                      // );
                    }
                    setProgress(newProgress);

                    // Periodic garbage collection
                    if (
                      rs.bytesWritten % (10 * 1024 * 1024) === 0 &&
                      global.gc
                    ) {
                      global.gc();
                    }
                  },
                }).promise;
              }

              // DISABLED FOR PERFORMANCE
              // console.log(
              //   '✅ Download completed with result:',
              //   JSON.stringify(res, null, 2),
              // );

              // Now filePath contains the path to the downloaded video in your app's private folder
              // DISABLED FOR PERFORMANCE
              // console.log('🎉 Download process completed successfully!');
              // DISABLED FOR PERFORMANCE
              // console.log('📁 Final file path:', filePath);
              // DISABLED FOR PERFORMANCE
              // console.log(
              //   '📊 Download result details:',
              //   JSON.stringify(res, null, 2),
              // );

              // Check if file actually exists
              const fileExistsAfterDownload = await exists(filePath);
              // DISABLED FOR PERFORMANCE
              // console.log('✅ File exists after download:', fileExistsAfterDownload);

              if (fileExistsAfterDownload) {
                const fileStats = await stat(filePath);
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '📊 File stats:',
                //   JSON.stringify(fileStats, null, 2),
                // );

                // Save metadata file
                await saveVideoMetadata(filePath, {
                  ...videoMetadata,
                  actualFileSize: fileStats.size,
                });
              }

              // Update download status
              setIsDownloaded(true);
              setDownloadedFilePath(filePath);

              callback?.();
              setLoading(false);

              // Send notification for download completion
              try {
                // Send to AdvancedNotificationService (for Alert popup)
                const AdvancedNotificationService =
                  require('../../services/AdvancedNotificationService').default;
                await AdvancedNotificationService.sendNotification(
                  'Download Complete! 🎉',
                  `"${title || 'Video'}" has been saved to your device`,
                  'success',
                  'high',
                  'download',
                  {
                    videoTitle: title,
                    filePath: filePath,
                    downloadTime: new Date().toISOString(),
                  },
                );

                // Also add to the old NotificationService (for Notifications screen)
                const notificationData = {
                  id: `download_${Date.now()}`,
                  title: 'Download Complete! 🎉',
                  message: `"${
                    title || 'Video'
                  }" has been saved to your device`,
                  type: 'success' as const,
                  isRead: false,
                  createdAt: new Date().toISOString(),
                  data: {
                    videoTitle: title,
                    filePath: filePath,
                    downloadTime: new Date().toISOString(),
                  },
                };

                // Add to local storage for the Notifications screen
                const existingNotifications =
                  (await getDataJson('notifications')) || [];
                const updatedNotifications = [
                  notificationData,
                  ...(Array.isArray(existingNotifications) ? existingNotifications : []),
                ];
                await storeDataJson('notifications', updatedNotifications);
              } catch (error) {
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '...',
                //   '...',
                // );
              }

              Alert.alert(
                'Success',
                'Video saved to device successfully!',
                [
                  {
                    text: 'View Downloads',
                    onPress: () => {
                      // DISABLED FOR PERFORMANCE
                      // console.log('🎯 Navigating to Downloads screen');
                      navigation.navigate('Download');
                    },
                    style: 'default',
                  },
                  {
                    text: 'Okay',
                    style: 'cancel',
                  },
                ],
                { cancelable: false },
              );
            }
          } else {
            // DISABLED FOR PERFORMANCE
            // console.log('❌ Storage permissions denied after request');
            // DISABLED FOR PERFORMANCE
            // console.log('❌ Permission result was:', granted);
            // Handle denial
            Alert.alert(
              'Permission Denied',
              'Cannot save video without storage permission. Please grant storage access in Settings.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Open Settings',
                  onPress: () => {
                    Linking.openSettings();
                  },
                },
              ],
            );
          }
        } catch (err) {
          // DISABLED FOR PERFORMANCE
          // console.log('❌ DOWNLOAD ERROR OCCURRED:');
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Error object:', err);
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Error message:', err?.message);
          // DISABLED FOR PERFORMANCE
          // console.log('❌ Error stack:', err?.stack);

          // Force garbage collection on error
          if (global.gc) {
            global.gc();
          }

          setLoading(false);
          setProgress(0); // Reset progress on error

          // Handle specific errors
          let errorMessage = 'Failed to download video';
          let alertTitle = 'Download Error';

          if (err?.message?.includes('token has expired')) {
            alertTitle = 'Session Expired';
            errorMessage = err?.message;
          } else if (err?.message?.includes('Authentication failed')) {
            alertTitle = 'Authentication Error';
            errorMessage = err?.message;
          } else if (
            err?.message?.includes('Failed to allocate') ||
            err?.message?.includes('OOM') ||
            err?.message?.includes('OutOfMemoryError')
          ) {
            errorMessage =
              'Download failed due to insufficient memory. Try:\n\n• Close other apps\n• Restart the app\n• Free up device storage\n• Try downloading a smaller file first';
          } else if (
            err?.message?.includes('WebSocketModule') ||
            err?.message?.includes('WebSocket')
          ) {
            errorMessage =
              'Network connection failed. Please check your internet connection and try again.';
          } else if (
            err?.message?.includes('timeout') ||
            err?.message?.includes('Timeout')
          ) {
            errorMessage =
              'Download timed out. Please check your internet connection and try again.';
          } else {
            errorMessage = `Download failed: ${
              err?.response?.data?.message || err?.message || 'Unknown error'
            }`;
          }

          Alert.alert(alertTitle, errorMessage, [
            { text: 'OK' },
            ...(err?.message?.includes('token has expired')
              ? [
                  {
                    text: 'Go to Login',
                    onPress: () => {
                      // DISABLED FOR PERFORMANCE
                      // console.log('🔐 User wants to go to login screen');
                      // navigation.navigate('Login'); // Uncomment if navigation is available
                    },
                  },
                ]
              : [
                  {
                    text: 'Retry',
                    onPress: () => {
                      if (global.gc) {
                        global.gc();
                      }
                      setTimeout(
                        () => saveToPrivateFolder(url, callback),
                        1000,
                      );
                    },
                  },
                ]),
          ]);
        }
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('📱 Platform: iOS - no permissions needed');
        try {
          setLoading(true);

          // Get download data from new API
          // DISABLED FOR PERFORMANCE - console.('🔄 Calling DownloadContent API (iOS)...');
          const downloadResult = await DownloadContent();
          // DISABLED FOR PERFORMANCE
          // console.log(
          //   '✅ Got download result from API (iOS)',
          //   downloadResult?.isDirectFile ? 'Direct file' : 'URL',
          // );

          const safeFileName = createSafeFilename(title, url);
          const fileExtension = 'mp4'; // Set the video file extension

          const folderName = '.spredHiddenFolder';
          const folderPath = `${ExternalDirectoryPath}/${folderName}`;
          const filePath = `${folderPath}/${safeFileName}.${fileExtension}`;

          // Prepare metadata for this download
          const videoMetadata = {
            originalTitle: title || 'Unknown Title',
            originalUrl: url,
            downloadDate: new Date().toISOString(),
            safeFileName: safeFileName,
            fileSize: downloadResult.contentLength,
          };

          const fileExists = await exists(folderPath);
          if (!fileExists) {
            await mkdir(folderPath);
          }

          let res;

          if (downloadResult?.isDirectFile) {
            // Handle direct file data
            // DISABLED FOR PERFORMANCE - console.('⬇️ Starting direct file write (iOS)...');
            // DISABLED FOR PERFORMANCE
            // console.log('📊 File size:', downloadResult.contentLength, 'bytes');
            // DISABLED FOR PERFORMANCE
            // console.log(
            //   '📊 File size:',
            //   Math.round(downloadResult.contentLength / 1048576),
            //   'MB',
            // );
            setProgress(0.1); // Show some progress

            try {
              // Convert ArrayBuffer to Uint8Array for more efficient handling
              const buffer = downloadResult.data;
              const uint8Array = new Uint8Array(buffer);

              // DISABLED FOR PERFORMANCE
              // console.log('💾 Writing file directly to storage...');

              // Simulate progressive updates during file write
              setProgress(0.2);
              await new Promise(resolve => setTimeout(resolve, 100));

              setProgress(0.4);
              await new Promise(resolve => setTimeout(resolve, 100));

              // Try writing as binary data first, then fallback to base64 if needed
              try {
                setProgress(0.6);
                // Method 1: Write as binary using a more memory-efficient approach
                const chunkSize = 4096; // Smaller chunks for better memory management
                let binaryString = '';

                // Process in smaller chunks to avoid memory issues
                for (let i = 0; i < uint8Array.length; i += chunkSize) {
                  const end = Math.min(i + chunkSize, uint8Array.length);
                  const chunk = uint8Array.slice(i, end);

                  // Use a safer approach for creating binary strings
                  for (let j = 0; j < chunk.length; j++) {
                    binaryString += String.fromCharCode(chunk[j]);
                  }

                  // Periodic garbage collection for very large files
                  if (i % (chunkSize * 10) === 0 && global.gc) {
                    global.gc();
                  }
                }

                setProgress(0.8);
                await writeFile(filePath, binaryString, 'ascii');
                // DISABLED FOR PERFORMANCE
                // console.log('✅ Binary write successful');
              } catch (binaryError) {
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '...',
                //   '...',
                // );
                setProgress(0.6);
                // Method 2: Fallback to base64 conversion with memory management
                try {
                  const base64Data = arrayBufferToBase64(buffer);
                  setProgress(0.8);
                  await writeFile(filePath, base64Data, 'base64');
                  // DISABLED FOR PERFORMANCE
                  // console.log('✅ Base64 write successful');
                } catch (base64Error) {
                  // DISABLED FOR PERFORMANCE
                  // console.log(
                  //   '...',
                  //   '...',
                  // );
                  throw new Error(
                    `Both binary and base64 write methods failed. Binary error: ${binaryError.message}, Base64 error: ${base64Error.message}`,
                  );
                }
              }

              setProgress(0.95);
              await new Promise(resolve => setTimeout(resolve, 200));

              // DISABLED FOR PERFORMANCE - console.('✅ Direct file write completed (iOS)');
              setProgress(1); // Complete

              res = {
                statusCode: 200,
                bytesWritten: downloadResult.contentLength,
              };
            } catch (writeError) {
              // DISABLED FOR PERFORMANCE
              // console.log('❌ File write error:', writeError);
              throw new Error(`Failed to write file: ${writeError.message}`);
            }
          } else {
            // Handle URL-based download
            res = await downloadFile({
              fromUrl: encodeURI(downloadResult.url),
              toFile: filePath,
              progressDivider: 10, // Reduce callback frequency
              connectionTimeout: 30000,
              readTimeout: 60000,
              discretionary: true,
              cacheable: false,
              begin: res => {
                // DISABLED FOR PERFORMANCE
                // console.log(
                //   '📊 File size:',
                //   Math.round(res.contentLength / 1048576),
                //   'MB',
                // );
                setProgress(0);
              },
              progress: rs => {
                const newProgress = rs.bytesWritten / rs.contentLength;
                setProgress(newProgress);

                // Periodic garbage collection
                if (rs.bytesWritten % (10 * 1024 * 1024) === 0 && global.gc) {
                  global.gc();
                }
              },
            }).promise;
          }

          // Now filePath contains the path to the downloaded video in your app's private folder

          // Save metadata file
          try {
            const fileExists = await exists(filePath);
            if (fileExists) {
              const fileStats = await stat(filePath);
              await saveVideoMetadata(filePath, {
                ...videoMetadata,
                actualFileSize: fileStats.size,
              });

              // Update download status
              setIsDownloaded(true);
              setDownloadedFilePath(filePath);
            }
          } catch (metaError) {
            // DISABLED FOR PERFORMANCE
            // console.log('⚠️ Failed to save metadata:', metaError.message);
          }

          callback?.();
          setLoading(false);
          // DISABLED FOR PERFORMANCE
          // console.log(filePath);
          // DISABLED FOR PERFORMANCE
          // console.log('dowlaod', res);
          Alert.alert(
            'Success',
            ' Video saved to device',
            [
              {
                text: 'Okay',
                // onPress: () => openVideoFile(filePath),
              },
            ],
            { cancelable: false },
          );
        } catch (error) {
          // DISABLED FOR PERFORMANCE
          // console.log('❌ iOS DOWNLOAD ERROR:', error);

          // Force garbage collection on error
          if (global.gc) {
            global.gc();
          }

          setLoading(false);
          setProgress(0); // Reset progress on error

          // Handle specific errors
          let errorMessage = 'Failed to download video';
          let alertTitle = 'Download Error';

          if (error?.message?.includes('token has expired')) {
            alertTitle = 'Session Expired';
            errorMessage = error?.message;
          } else if (error?.message?.includes('Authentication failed')) {
            alertTitle = 'Authentication Error';
            errorMessage = error?.message;
          } else if (
            error?.message?.includes('Failed to allocate') ||
            error?.message?.includes('OOM') ||
            error?.message?.includes('OutOfMemoryError')
          ) {
            errorMessage =
              'Download failed due to insufficient memory. Try:\n\n• Close other apps\n• Restart the app\n• Free up device storage\n• Try downloading a smaller file first';
          } else if (
            error?.message?.includes('WebSocketModule') ||
            error?.message?.includes('WebSocket')
          ) {
            errorMessage =
              'Network connection failed. Please check your internet connection and try again.';
          } else if (
            error?.message?.includes('timeout') ||
            error?.message?.includes('Timeout')
          ) {
            errorMessage =
              'Download timed out. Please check your internet connection and try again.';
          } else {
            errorMessage = `Download failed: ${
              error?.response?.data?.message ||
              error?.message ||
              'Unknown error'
            }`;
          }

          Alert.alert(alertTitle, errorMessage, [
            { text: 'OK' },
            ...(error?.message?.includes('token has expired')
              ? [
                  {
                    text: 'Go to Login',
                    onPress: () => {
                      // DISABLED FOR PERFORMANCE
                      // console.log('🔐 User wants to go to login screen');
                      // navigation.navigate('Login'); // Uncomment if navigation is available
                    },
                  },
                ]
              : [
                  {
                    text: 'Retry',
                    onPress: () => {
                      if (global.gc) {
                        global.gc();
                      }
                      setTimeout(
                        () => saveToPrivateFolder(url, callback),
                        1000,
                      );
                    },
                  },
                ]),
          ]);
        }
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('❌ Unexpected error in saveToPrivateFolder:', error);
      setLoading(false);
      setProgress(0); // Reset progress on unexpected error
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  const openVideoFile = async (path: any) => {
    const filePath = path;

    try {
      const fileExists = await exists(filePath);

      if (fileExists) {
        // Open the video file with the default app on the device
        await Linking.openURL(`${filePath}`);
      } else {
        // DISABLED FOR PERFORMANCE
        // console.log('Video file not found.');
      }
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Error opening video file:', error);
    }
  };

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 40 }}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <CustomText color="white" fontWeight="600" fontSize={10}>
            Available Space 23.32GB
          </CustomText>
          <CustomText color="#F45305" lineHeight={20} fontSize={9}>
            Buy more space
          </CustomText>
        </View>
        <View>
          <CustomText fontSize={15} fontWeight="700">
            Download Video
          </CustomText>
          {videoFileSize && (
            <CustomText
              fontSize={12}
              fontWeight="500"
              color="#F45305"
              style={{ marginTop: 2 }}
            >
              File Size: {formatFileSize(videoFileSize)}
            </CustomText>
          )}
        </View>
      </View>
      <View style={{ paddingTop: 12 }}>
        <View
          style={{ height: 1, backgroundColor: 'gray', marginVertical: 0 }}
        />
      </View>
      <View style={{ paddingTop: 20 }}>
        <View>
          <CustomButton
            icon={<Icon name="check" size="md" color="white" />}
            title={`${
              videoFileSize ? `${formatFileSize(videoFileSize)}` : 'Loading...'
            }   NGN100`}
            width="98%"
            height={40}
            borderRadius={7}
          />
        </View>
        {/* <View style={{ paddingTop: 10 }}>
          <CustomButton
icon={<Icon name="check" size="md" color="white" />}
            title="High Quality (563MB)          NGN200"
            width="98%"
            height={40}
            borderRadius={7}
            backgroundColor="#6A6A6A"
          />
        </View> */}
      </View>
      <View style={{ paddingTop: 20 }}>
        <View
          style={{ height: 1, backgroundColor: 'gray', marginVertical: 10 }}
        />
      </View>
      <View style={{ paddingTop: 20 }}>
        {/* Show download status message */}
        {isDownloaded && (
          <View
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: 'rgba(76, 175, 80, .1)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#4CAF50',
            }}
          >
            <Text
              style={{ color: '#4CAF50', fontSize: 12, textAlign: 'center' }}
            >
              ✅ Video already downloaded - You can play it offline or
              re-download if needed
            </Text>
          </View>
        )}

        {/* Show wallet status message */}
        {!wallet?.account_Reference && !isDownloaded && (
          <View
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: 'rgba(244, 83, 3, .1)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#F45303',
            }}
          >
            <Text
              style={{ color: '#F45303', fontSize: 12, textAlign: 'center' }}
            >
              ⚠️ Wallet not initialized - Downloads are FREE but some features
              may be limited
            </Text>
          </View>
        )}

        {/* Show data usage info */}
        {videoFileSize && !isDownloaded && (
          <View
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: 'rgba(33, 150, 243, .1)',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#2196F3',
            }}
          >
            <Text
              style={{ color: '#2196F3', fontSize: 12, textAlign: 'center' }}
            >
              📊 Data Usage: {formatFileSize(videoFileSize)} will be downloaded
              using your internet connection
            </Text>
          </View>
        )}

        {mainloading ? (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="white" />
            <Text style={{ color: '#fff', fontSize: 12, marginTop: 8 }}>
              Loading...
            </Text>
          </View>
        ) : loading ? (
          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 200, height: 10, marginBottom: 8 }}>
              <ProgressBar
                progress={progress || 0.01}
                width={200}
                color="#F45303"
                unfilledColor="#444"
                borderRadius={5}
                height={10}
              />
            </View>
            <Text style={{ color: '#fff', fontSize: 14, marginTop: 8 }}>
              {progress > 0
                ? `Downloading... ${Math.round(progress * 100)}%`
                : 'Preparing download...'}
            </Text>
          </View>
        ) : isDownloaded ? (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              width: '98%',
            }}
          >
            <CustomButton
              title="PLAY"
              width="48%"
              borderRadius={7}
              backgroundColor="#4CAF50"
              onPress={playDownloadedVideo}
            />
            <CustomButton
              title="RE-DOWNLOAD"
              width="48%"
              borderRadius={7}
              backgroundColor="#FF9800"
              onPress={() => {
                saveToPrivateFolder(url);
              }}
            />
          </View>
        ) : (
          <CustomButton
            title={wallet?.account_Reference ? 'DOWNLOAD' : 'DOWNLOAD (Free)'}
            width="98%"
            borderRadius={7}
            onPress={() => {
              saveToPrivateFolder(url);
            }}
          />
        )}
      </View>
      
    </View>
  );
};

export default DownloadItems;

const requestPermissionIfNeeded = async () => {
  if (Platform.OS === 'android') {
    const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
    const hasPermission = await PermissionsAndroid.check(permission);
    if (!hasPermission) {
      try {
        const status = await PermissionsAndroid.request(permission);
        if (status !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      } catch (err) {
        // DISABLED FOR PERFORMANCE
        // console.log(err);
        return false;
      }
    }
  }
  return true;
};
