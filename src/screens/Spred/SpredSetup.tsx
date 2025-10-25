import {
  EmitterSubscription,
  Image,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import {
  cancelConnect,
  checkPermissions,
  initialize,
  isLocationEnabled,
  isWifiEnabled,
  isWifiHotspotEnabled,
  openLocationSettings,
  openWifiHotspotSettings,
  openWifiSettings,
  removeGroup,
  requestPermissions,
  shouldEnableLocation,
  startDiscoveringPeers,
  stopDiscoveringPeers,
} from 'p2p-file-transfer';
import React, { useEffect, useState } from 'react';
import CustomButton from '../../components/CustomButton/CustomButton';
import Snackbar from 'react-native-snackbar';
import {
  Device,
  subscribeOnPeersUpdates,
} from '../../../.yalc/p2p-file-transfer';

export default function SpredSetup({ title, children }: Props) {
  let peersSubscription: EmitterSubscription;

  const [permissionsEnabled, setPermissionsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [wifiHotspotDisabled, setWifiHotspotDisabled] = useState(false);
  const [peers, setPeers] = useState<Array<Device>>([]);

  const showError = (error: any) => {
    console.log(error);
    Snackbar.show({
      text: JSON.stringify(error),
    });
  };

  const init = async () => {
    try {
      await initialize();
    } catch (error) {
      showError(error);
    }

    try {
      await startDiscoveringPeers();
      peersSubscription = subscribeOnPeersUpdates(value => {
        console.log(value);
        setPeers(value.devices);
      });
    } catch (error) {
      showError(error);
    }
  };

  const stop = () => {
    Promise.allSettled([cancelConnect(), stopDiscoveringPeers(), removeGroup()])
      .then(() => {
        peersSubscription?.remove();
        setPeers([]);
        console.log('Share stopped');
      })
      .catch(showError);
  };

  const requestPermission = async () => {
    try {
      await requestPermissions();
      refresh();
    } catch (error) {
      showError(error);
    }
  };

  const enableWlan = async () => {
    try {
      await openWifiSettings();
    } catch (error) {
      showError(error);
    }
  };

  const disableWlan = async () => {
    try {
      await openWifiHotspotSettings();
    } catch (error) {
      showError(error);
    }
  };

  const enableLocation = async () => {
    try {
      await openLocationSettings();
    } catch (error) {
      showError(error);
    }
  };

  const refresh = () => {
    checkPermissions().then(setPermissionsEnabled);
    Promise.all([shouldEnableLocation(), isLocationEnabled()]).then(
      ([shouldEnable, enabled]) => {
        if (!shouldEnable) {
          setLocationEnabled(true);
        } else {
          setLocationEnabled(enabled);
        }
      },
    );
    isWifiEnabled().then(setWifiEnabled);
    isWifiHotspotEnabled().then(enabled => {
      setWifiHotspotDisabled(!enabled);
    });
  };

  useEffect(() => {
    refresh();
    return stop;
  }, []);

  return (
    <>
      {permissionsEnabled &&
      locationEnabled &&
      wifiEnabled &&
      wifiHotspotDisabled ? (
        <>
          {peers.length > 0 ? (
            <View style={{ flex: 1 }}>
              {children}
            </View>
          ) : (
            <View
              style={{
                margin: 10,
                gap: 10,
              }}
            >
              <CustomButton title={`Start ${title}`} onPress={init} />
              <CustomButton title={`Stop ${title}`} onPress={stop} />
            </View>
          )}
        </>
      ) : (
        <View>
          <View
            style={{
              marginTop: 10,
              alignItems: 'center',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <Image
              style={style.permissionImage}
              source={require('../../../assets/spredshare.png')}
            />
          </View>

          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Text style={{ color: 'white' }}>Let's set up Spred</Text>
          </View>

          <View style={{ marginTop: 10, alignItems: 'center' }}>
            <Text
              style={{
                color: 'white',
                alignItems: 'center',
                textAlign: 'center',
                width: '95%',
              }}
            >
              This feature needs access to the Wifi and Nearby Location of your
              device to work correctly. Please accept these permissions to
              ensure safer and faster files transfer
            </Text>
          </View>

          {!permissionsEnabled && (
            <TouchableHighlight onPress={requestPermission}>
              <View style={style.permissionButton}>
                <Image
                  style={style.permissionImage}
                  source={require('../../../assets/spred.png')}
                />
                <Text>Grant Permissions</Text>
              </View>
            </TouchableHighlight>
          )}

          {!wifiEnabled && (
            <TouchableHighlight onPress={enableWlan}>
              <View style={style.permissionButton}>
                <Image
                  style={style.permissionImage}
                  source={require('../../../assets/visible.png')}
                />
                <Text>Enable WLAN</Text>
              </View>
            </TouchableHighlight>
          )}

          {!wifiHotspotDisabled && (
            <TouchableHighlight onPress={disableWlan}>
              <View style={style.permissionButton}>
                <Image
                  style={style.permissionImage}
                  source={require('../../../assets/hotspots.png')}
                />
                <Text>Disable Hotspot</Text>
              </View>
            </TouchableHighlight>
          )}

          {!locationEnabled && (
            <TouchableHighlight onPress={enableLocation}>
              <View style={style.permissionButton}>
                <Image
                  style={style.permissionImage}
                  source={require('../../../assets/visible.png')}
                />
                <Text>Enable Location</Text>
              </View>
            </TouchableHighlight>
          )}
        </View>
      )}
    </>
  );
}

type Props = {
  title: string;
  children: React.ReactElement;
};

const style = StyleSheet.create({
  permissionButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  permissionImage: {
    marginHorizontal: 10,
    marginVertical: 5,
  },
});
