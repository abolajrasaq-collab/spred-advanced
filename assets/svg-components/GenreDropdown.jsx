import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GenreDropdown = ({ cats, changeCat }) => {
  const [open, setOpen] = React.useState(false);

  const handleToggle = () => {
    console.log('Dropdown toggle pressed, current state:', open);
    setOpen(!open);
  };

  const handleOptionPress = categoryId => {
    console.log('Option pressed:', categoryId);
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
        <Modal
          visible={open}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.overlay}>
            <TouchableOpacity
              style={styles.overlayTouchable}
              activeOpacity={1}
              onPress={() => setOpen(false)}
            />
            <View style={styles.dropdown}>
              <View style={styles.header}>
                <Text style={styles.headerText}>Select Genre</Text>
                <TouchableOpacity
                  onPress={() => setOpen(false)}
                  style={styles.closeButton}
                >
                  <MaterialIcons size={20} name="close" color={'white'} />
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
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dropdown: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    width: screenWidth * 0.85,
    maxHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingVertical: 8,
    maxHeight: 400,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#404040',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
  },
});

export default GenreDropdown;
