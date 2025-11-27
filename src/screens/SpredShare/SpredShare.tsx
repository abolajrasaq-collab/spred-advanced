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
    return close;
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

      const address = connection?.isGroupOwner
        ? clients[0]
        : connection?.groupOwnerAddress?.hostAddress;

      console.log('📤 SPRED: Sending downloaded file:', downloadedVideoPath);
      console.log('📤 SPRED: Video title:', title);
      console.log('📤 SPRED: Connection info:', { clients, connection, address });

      if (address) {
        const progressSub = subscribeOnFileSend(data => {
          setProgress(data.progress);
          console.log(`📊 SPRED: Send progress: ${data.progress}%`);
        });

        const data = await sendFileTo(downloadedVideoPath, address);
        progressSub.remove();

        Snackbar.show({
          text: `"${title || 'Video'}" sent successfully!`,
        });
        console.log('✅ SPRED: File sent successfully:', data);
      } else {
        showError('No valid peer address found');
      }
    } catch (err) {
      console.log('❌ SPRED: Send error:', err);
      showError(err);
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
