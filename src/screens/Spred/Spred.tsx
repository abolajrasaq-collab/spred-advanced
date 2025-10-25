import { useState } from 'react';
import { View } from 'react-native';
import CustomButton from '../../components/CustomButton/CustomButton';
import SpredShare from '../SpredShare/SpredShare';
import CustomText from '../../components/CustomText/CustomText';
import Receive from '../Receive/Receive';
import SpredSetup from './SpredSetup';

export default function Share({ url }: Props) {
  const [showSend, setShowSend] = useState(false);
  const [showReceive, setShowReceive] = useState(false);

  const toggleSend = () => {
    setShowSend(!showSend);
  };

  const toggleReceive = () => {
    setShowReceive(!showReceive);
  };

  return (
    <>
      {showSend ? (
        <SpredSetup title="Sending">
          <SpredShare url={url} />
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
              Release your contents to other Spred app users
            </CustomText>
          </View>
          <View style={{ width: '90%', marginTop: 10 }}>
            <CustomButton
              image={require('../../../assets/forwardicon.png')}
              onPress={toggleSend}
              title="Spred"
              width="98%"
            />
          </View>
          <View style={{ marginTop: 10, width: '90%' }}>
            <CustomButton
              image={require('../../../assets/Filedownload.png')}
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
}

type Props = {
  url: string;
};
