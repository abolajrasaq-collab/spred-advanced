import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SimpleDropdown = ({ cats, changeCat }) => {
  const [open, setOpen] = React.useState(false);

  const handleToggle = () => {
    console.log('Simple dropdown toggle pressed, current state:', open);
    setOpen(!open);
  };

  const handleOptionPress = categoryId => {
    console.log('Simple dropdown option pressed:', categoryId);
    changeCat(categoryId);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleToggle}
        style={styles.dropdownButton}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={open ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={18}
          color="white"
        />
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Select Genre</Text>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              style={styles.closeButton}
            >
              <MaterialIcons size={16} name="close" color={'white'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleOptionPress('all')}
            >
              <Text style={styles.optionText}>All Genres</Text>
            </TouchableOpacity>
            {cats.map(val => (
              <TouchableOpacity
                key={val._ID}
                style={styles.option}
                onPress={() => handleOptionPress(val._ID)}
              >
                <Text style={styles.optionText}>{val.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    padding: 12,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    width: 200,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingVertical: 8,
    maxHeight: 200,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#404040',
  },
  optionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '400',
  },
});

export default SimpleDropdown;
