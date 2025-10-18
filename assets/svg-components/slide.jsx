import * as React from 'react';
import { Text, View } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Menu, Portal } from 'react-native-paper';
const SvgComponent = ({ cats, changeCat }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <View>
      {open ? (
        <TouchableOpacity onPress={() => setOpen(!open)}>
          <MaterialIcons
            name="keyboard-arrow-up"
            size={18}
            style={{ color: 'white' }}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => setOpen(!open)}>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={18}
            style={{ color: 'white' }}
          />
        </TouchableOpacity>
      )}
      <Portal>
        {open && (
          <View
            style={{
              position: 'absolute',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 99999,
              elevation: 99999,
              backgroundColor: 'black',
              width: '100%',
              opacity: 0.75,
              padding: 15,
            }}
          >
            <ScrollView style={{ maxHeight: '90%' }}>
              <MaterialIcons
                size={20}
                name="close"
                color={'white'}
                onPress={() => setOpen(!open)}
              />
              <View>
                <TouchableOpacity
                  key={'all'}
                  onPress={() => {
                    changeCat('all');
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: 'white' }}>All</Text>
                </TouchableOpacity>
                {cats.map(val => {
                  return (
                    <TouchableOpacity
                      key={val._ID}
                      onPress={() => {
                        changeCat(val._ID);
                        setOpen(false);
                      }}
                    >
                      <Text style={{ color: 'white' }}>{val.name}</Text>
                    </TouchableOpacity>
                  );
                })}
                <Text style={{ paddingBottom: 90 }} />
              </View>
            </ScrollView>
          </View>
        )}
      </Portal>
    </View>
  );
};

export default SvgComponent;
