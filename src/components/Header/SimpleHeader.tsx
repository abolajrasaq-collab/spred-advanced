import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../Icon/Icon';
import NotificationBadge from '../NotificationBadge/NotificationBadge';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import SpredLogo from './SpredLogo'; // Import the new SVG logo

const SimpleHeader: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  const handleSearchPress = () => {
    navigation.navigate('Search');
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1A1A1A"
        translucent={false}
      />
      <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
        <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
          {/* Left Section - Logo */}
          <View style={styles.leftSection}>
            <SpredLogo width={80} height={30} />
          </View>

          {/* Right Section - Actions */}
          <View style={[styles.rightSection, { gap: spacing.md }]}>
            {/* Search Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2A2A2A' }]}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <Icon name="search" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Notifications Button */}
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2A2A2A' }]}
              onPress={handleNotificationsPress}
              activeOpacity={0.7}
            >
              <Icon name="notifications" size={16} color="#FFFFFF" />
              <NotificationBadge size={18} top={-8} right={-8} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    elevation: 4,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  leftSection: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 'auto',
  },

  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
});

export default SimpleHeader;
