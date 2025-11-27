import { Text, View } from 'react-native';

import React, { useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';
import CustomButton from '../../components/CustomButton/CustomButton';
import CustomText from '../../components/CustomText/CustomText';
import RNFS from 'react-native-fs';
import {
  subscribeOnClientUpdated,
  subscribeOnConnectionInfoUpdates,
  subscribeOnFileSend,
  sendFileTo,
  WifiP2pInfo,
} from 'p2p-file-transfer';

const getFileNameFromURL = (url: string) => {
  const urlParts = url?.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const fileNameWithoutParams = fileName?.split('?')[0];
  const fileNameWithoutExtension = fileNameWithoutParams?.split('.')[0];
  return fileNameWithoutExtension;
};

export default function SpredShare({ downloadedVideoPath, title }: Props) {
  const [clients, setClients] = useState<Array<string>>([]);
  const [connection, setConnection] = useState<WifiP2pInfo>();
  const [progress, setProgress] = useState<number>(0);

  const connectionSubscription =
    subscribeOnConnectionInfoUpdates(setConnection);
  const clientsSubscription = subscribeOnClientUpdated(value => {
    setClients(value.clients);
  });

  useEffect(() => {
    return () => {
      connectionSubscription.remove();
      clientsSubscription.remove();
    };
  }, []);

  const showError = (error: any) => {
    console.log(error);
    const errorText = typeof error === 'string' ? error : JSON.stringify(error);
    Snackbar.show({
      text: errorText,
      duration: Snackbar.LENGTH_LONG,
    });
  };

  const sendFile = async () => {
    try {
      // Validate video path
      if (!downloadedVideoPath) {
        const errorMsg = 'No downloaded video path provided';
        console.log('❌ SPRED:', errorMsg);
        showError(errorMsg);
        return;
      }

      // Validate file exists before attempting to send
      try {
        const fileExists = await RNFS.exists(downloadedVideoPath);
        if (!fileExists) {
          const errorMsg = `File not found: ${downloadedVideoPath}`;
          console.log('❌ SPRED:', errorMsg);
          showError(errorMsg);
          return;
        }
        console.log('✅ SPRED: File exists, proceeding with send');
      } catch (fileCheckError: any) {
        const errorMsg = `Error checking file: ${fileCheckError?.message || fileCheckError}`;
        console.log('❌ SPRED:', errorMsg);
        showError(errorMsg);
        return;
      }

      // Validate connection state
      if (!connection) {
        const errorMsg = 'No connection info available';
        console.log('❌ SPRED:', errorMsg);
        showError(errorMsg);
        return;
      }

      if (!connection.groupFormed) {
        const errorMsg = 'Group not formed yet. Please wait for connection.';
        console.log('❌ SPRED:', errorMsg);
        showError(errorMsg);
        return;
      }

      // Determine recipient address
      const address = connection?.isGroupOwner
        ? clients[0]
        : connection?.groupOwnerAddress?.hostAddress;

      console.log('📤 SPRED: Preparing to send file');
      console.log('📤 SPRED: - File path:', downloadedVideoPath);
      console.log('📤 SPRED: - Video title:', title);
      console.log('📤 SPRED: - Is group owner:', connection.isGroupOwner);
      console.log('📤 SPRED: - Clients:', clients);
      console.log('📤 SPRED: - Group owner address:', connection?.groupOwnerAddress?.hostAddress);
      console.log('📤 SPRED: - Target address:', address);

      // Validate recipient address
      if (!address) {
        const errorMsg = 'No valid peer address found. Please ensure receiver is connected.';
        console.log('❌ SPRED:', errorMsg);
        showError(errorMsg);
        return;
      }

      console.log('📤 SPRED: Starting file transfer...');

      // Subscribe to progress updates
      let progressSub;
      try {
        progressSub = subscribeOnFileSend(data => {
          if (data && typeof data.progress === 'number') {
            setProgress(data.progress);
            console.log(`📊 SPRED: Send progress: ${data.progress.toFixed(1)}%`);
          }
        });
      } catch (subError) {
        console.log('⚠️ SPRED: Could not subscribe to progress:', subError);
        // Continue anyway, progress updates are not critical
      }

      // Attempt file transfer
      try {
        const data = await sendFileTo(downloadedVideoPath, address);

        if (progressSub) {
          progressSub.remove();
        }

        console.log('✅ SPRED: File sent successfully:', data);
        Snackbar.show({
          text: `"${title || 'Video'}" sent successfully!`,
          duration: Snackbar.LENGTH_LONG,
        });

        // Reset progress after successful send
        setTimeout(() => setProgress(0), 2000);
      } catch (sendError) {
        if (progressSub) {
          progressSub.remove();
        }
        throw sendError; // Re-throw to be caught by outer catch
      }
    } catch (err: any) {
      console.log('❌ SPRED: Send error:', err);
      console.log('❌ SPRED: Error details:', {
        message: err?.message,
        code: err?.code,
        name: err?.name,
        stack: err?.stack
      });

      const errorMessage = err?.message || err?.toString() || 'Unknown error during file transfer';
      showError(`Transfer failed: ${errorMessage}`);

      // Reset progress on error
      setProgress(0);
    }
  };

  const close = () => {
    connectionSubscription.remove();
    clientsSubscription.remove();
  };

  return (
    <View>
      {title && (
        <View style={{ marginBottom: 15, padding: 10, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 8 }}>
          <CustomText fontSize={12} fontWeight="600" style={{ color: '#2196F3', textAlign: 'center' }}>
            📱 Ready to SPRED: "{title}"
          </CustomText>
        </View>
      )}

      {connection?.groupFormed ? (
        <>
          <CustomButton
            title={`Send "${title || 'Video'}"`}
            onPress={sendFile}
          />
          {progress > 0 && (
            <Text style={{ color: '#4CAF50', textAlign: 'center', marginTop: 8 }}>
              {`📤 Sending Progress: ${progress.toFixed(1)}%`}
            </Text>
          )}
        </>
      ) : (
        <>
          <CustomText style={{ textAlign: 'center' }}>Waiting for receiver...</CustomText>
          <CustomText fontSize={11} style={{ color: '#888', textAlign: 'center', marginTop: 5 }}>
            Ask your friend to tap "Receive" and connect to your device
          </CustomText>
        </>
      )}
    </View>
  );
}

type Props = {
  downloadedVideoPath: string | null;
  title?: string;
};
