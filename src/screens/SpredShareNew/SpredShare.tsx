import { Text, View } from 'react-native';

import React, { useEffect, useState } from 'react';
import Snackbar from 'react-native-snackbar';
import CustomButton from '../../components/CustomButton/CustomButton';
import CustomText from '../../components/CustomText/CustomText';
import { getFileNameFromURL } from '../DownloadItems/DownloadItems';
import RNFS from 'react-native-fs';
import {
  subscribeOnClientUpdated,
  subscribeOnConnectionInfoUpdates,
  sendFileTo,
  WifiP2pInfo,
} from 'p2p-file-transfer';
import { subscribeOnFileSend } from 'p2p-file-transfer';

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
    Snackbar.show({
      text: JSON.stringify(error),
    });
  };

  const sendFile = async () => {
    try {
      if (!downloadedVideoPath) {
        showError('No downloaded video path provided');
        return;
      }

      let address: string | undefined;
      if (connection?.isGroupOwner && clients.length > 0) {
        address = clients[0];
      } else if (connection?.groupOwnerAddress?.hostAddress) {
        address = connection.groupOwnerAddress.hostAddress;
      }

      console.log('📤 SPRED: Sending downloaded file:', downloadedVideoPath);
      console.log('📤 SPRED: Video title:', title);
      console.log('📤 SPRED: Connection info:', { clients, connection, address });

      if (address) {
        let progressSub: any = null;
        try {
          progressSub = subscribeOnFileSend(data => {
            setProgress(data.progress);
            console.log(`📊 SPRED: Send progress: ${data.progress}%`);
          });

          const data = await sendFileTo(downloadedVideoPath, address);

          if (progressSub) {
            progressSub.remove();
          }

          Snackbar.show({
            text: `"${title || 'Video'}" sent successfully!`,
          });
          console.log('✅ SPRED: File sent successfully:', data);
        } catch (err) {
          if (progressSub) {
            progressSub.remove();
          }
          throw err;
        }
      } else {
        showError('No valid peer address found - Make sure devices are connected');
      }
    } catch (err) {
      console.log('❌ SPRED: Send error:', err);
      showError(err);
    }
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
