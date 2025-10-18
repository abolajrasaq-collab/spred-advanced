import { View, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const BackHeader = () => {
  const navigation = useNavigation();
  return (
    <View style={{ width: '90%', paddingHorizontal: 25 }}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back" size={18} style={{ color: 'white' }} />
      </TouchableOpacity>
    </View>
  );
};

export default BackHeader;
