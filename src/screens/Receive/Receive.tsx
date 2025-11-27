import { View, Image, Text } from 'react-native';
import CustomText from '../../components/CustomText/CustomText';
import React, { useEffect, useState } from 'react';
import {
  connect,
  Device,
  receiveFile,
  subscribeOnConnectionInfoUpdates,
  subscribeOnPeersUpdates,
  getAvailablePeers,
  subscribeOnFileReceive,
  WifiP2pInfo,
} from 'p2p-file-transfer';
import CustomButton from '../../components/CustomButton/CustomButton';
import RNFS from 'react-native-fs';
import Snackbar from 'react-native-snackbar';

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
      // Use dedicated folder for P2P received videos
      const folder = `${RNFS.ExternalDirectoryPath}/SpredP2PReceived`;

      // Ensure folder exists
      const folderExists = await RNFS.exists(folder);
      if (!folderExists) {
        await RNFS.mkdir(folder);
        console.log('✅ SPRED: Created SpredP2PReceived folder for P2P content');
      }

      console.log('📥 SPRED: Starting to receive file to:', folder);

      const progressSub = subscribeOnFileReceive(data => {
        setProgress(data.progress);
        console.log(`📊 SPRED: Receive progress: ${data.progress}%`);
      });

      const data = await receiveFile(folder);
      progressSub.remove();

      console.log('✅ SPRED: File received successfully:', data);

      Snackbar.show({
        text: 'Video received! Check your Downloads to watch it.',
        duration: Snackbar.LENGTH_LONG,
      });

    } catch (error) {
      console.log('❌ SPRED: Receive error:', error);
      showError(error);
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
            title="Start Receiving Video"
            onPress={startReceivingFile}
          />
          {progress > 0 && (
            <Text style={{ color: '#4CAF50', textAlign: 'center', marginTop: 8 }}>
              {`📥 Receiving Progress: ${progress.toFixed(1)}%`}
            </Text>
          )}
          <CustomText fontSize={11} style={{ color: '#888', textAlign: 'center', marginTop: 10 }}>
            Videos received via SPRED will be saved to your Downloads
          </CustomText>
        </View>
      )}
      <View
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 15,
          padding: 10,
          backgroundColor: 'rgba(244, 83, 3, 0.1)',
          borderRadius: 8,
          marginHorizontal: 10,
        }}
      >
        <CustomText fontSize={11} style={{ color: '#F45303', textAlign: 'center' }}>
          💰 NGN100 will be deducted from your wallet for receiving videos
        </CustomText>
      </View>
    </View>
  );
}
