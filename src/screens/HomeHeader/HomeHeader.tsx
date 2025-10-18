import { View, Text, TouchableOpacity } from 'react-native';
import Home from '../../../assets/svg-components/home';
import SimpleDropdown from '../../../assets/svg-components/SimpleDropdown';

const HomeHeader = ({
  cats,
  onChange,
  currentTab,
  changeCat,
  contentTypes,
}) => {
  // Fallback content types if API doesn't return them
  const fallbackContentTypes = [
    { _ID: '6538e041681695c4bba653ee', name: 'ORIGINAL' },
    { _ID: '6538e094681695c4bba653f2', name: 'MOVIES' },
    { _ID: '6538e08c681695c4bba653f1', name: 'SERIES' },
    { _ID: '6538e084681695c4bba653f0', name: 'SKIT' },
  ];

  const displayContentTypes =
    contentTypes && contentTypes.length > 0
      ? contentTypes
      : fallbackContentTypes;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => onChange(0, '')}>
          <Home />
        </TouchableOpacity>
        {currentTab === 0 && (
          <View
            style={{
              width: 24,
              height: 3,
              backgroundColor: '#ffffff',
              marginTop: 5,
            }}
          />
        )}
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-evenly',
          paddingHorizontal: 5,
        }}
      >
        {displayContentTypes.map((contentType, index) => (
          <TouchableOpacity
            key={contentType._ID}
            onPress={() => onChange(index + 1, contentType._ID)}
          >
            <Text style={{ fontSize: 14, fontWeight: '400', color: '#fff' }}>
              {contentType.name.toUpperCase()}
            </Text>
            {currentTab === index + 1 && (
              <View
                style={{
                  width: 30,
                  height: 3,
                  backgroundColor: '#ffffff',
                  marginTop: 5,
                }}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ zIndex: 1000 }}>
        <SimpleDropdown changeCat={changeCat} cats={cats} />
      </View>
    </View>
  );
};

export default HomeHeader;
