import { View, Image, Text, PermissionsAndroid, Platform } from 'react-native';
import CustomText from '../../components/CustomText/CustomText';
import React, { useEffect, useState } from 'react';
import {
  connect,
  Device,
  receiveFile,
  subscribeOnConnectionInfoUpdates,
  subscribeOnPeersUpdates,
  WifiP2pInfo,
} from 'p2p-file-transfer';
import CustomButton from '../../components/CustomButton/CustomButton';
import RNFS from 'react-native-fs';
import Snackbar from 'react-native-snackbar';
import { subscribeOnFileReceive } from '../../../.yalc/p2p-file-transfer/src';
import { getAvailablePeers } from '../../../.yalc/p2p-file-transfer';

export default function Receive() {
  const [connection, setConnection] = useState<WifiP2pInfo>();
  const [peers, setPeers] = useState<Array<Device>>([]);
  const [progress, setProgress] = useState<number>(0);

  const connectionSubscription =
    subscribeOnConnectionInfoUpdates(setConnection);
  const peersSubscription = subscribeOnPeersUpdates(value => {
    setPeers(value.devices);
  });

  const showError = (error: any) => {
    console.log(error);
    Snackbar.show({
      text: JSON.stringify(error),
    });
  };

  const connectTo = async (peer: Device) => {
    try {
      await connect(peer.deviceAddress);
    } catch (error) {
      showError(error);
    }
  };

  const startReceivingFile = async () => {
    try {
      // Check permissions first
      if (Platform.OS === 'android') {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        if (!hasPermission) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Snackbar.show({
              text: 'Storage permission required to receive files.',
            });
            return;
          }
        }
      }

      const folder = `${RNFS.ExternalDirectoryPath}/.spredHiddenFolder`;

      // Ensure folder exists
      const folderExists = await RNFS.exists(folder);
      if (!folderExists) {
        await RNFS.mkdir(folder);
      }

      const progressSub = subscribeOnFileReceive(data => {
        setProgress(data.progress);
      });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Receive timeout')), 300000); // 5 minutes
      });

      const receivePromise = receiveFile(folder);

      const data = await Promise.race([receivePromise, timeoutPromise]);
      progressSub.remove();
      Snackbar.show({
        text: 'File received successfully!',
      });
      console.log('File received', data);
    } catch (error) {
      console.error('Receive file error:', error);
      const errorMessage = error.message?.includes('timeout')
        ? 'Receive timed out. Please try again.'
        : error.message || 'Failed to receive file. Please try again.';
      Snackbar.show({
        text: errorMessage,
      });
    }
  };

  useEffect(() => {
    getAvailablePeers().then(value => {
      setPeers(value.devices);
    });

    return () => {
      connectionSubscription.remove();
      peersSubscription.remove();
    };
  }, []);

  return (
    <View>
      <View style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Image
          style={{ marginRight: 10, marginLeft: 14, marginTop: 5 }}
          source={require('../../../assets/spredshare.png')}
        />
      </View>
      {!connection?.groupFormed && (
        <>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 10,
            }}
          >
            <CustomText>Available Devices</CustomText>
          </View>
          {peers.map(peer => (
            <View
              key={peer.deviceAddress}
              style={{
                marginTop: 10,
              }}
            >
              <CustomButton
                title={`Connect to ${peer.deviceName}`}
                onPress={() => connectTo(peer)}
              />
            </View>
          ))}
        </>
      )}
      {connection?.groupFormed && (
        <View
          style={{
            marginTop: 10,
          }}
        >
          <CustomButton
            title="Start Receiving File"
            onPress={startReceivingFile}
          />
          <Text>{`Receive File Progress: ${progress}%`}</Text>
        </View>
      )}
    </View>
  );
}
