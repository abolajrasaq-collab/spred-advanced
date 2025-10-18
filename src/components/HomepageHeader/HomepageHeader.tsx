import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../Icon/Icon';
import NotificationBadge from '../NotificationBadge/NotificationBadge';

interface HomepageHeaderProps {
  userInfo?: any;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
}

const HomepageHeader: React.FC<HomepageHeaderProps> = ({
  userInfo,
  onSearchPress,
  onNotificationsPress,
}) => {
  const navigation = useNavigation<any>();

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      navigation.navigate('Search');
    }
  };

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
    } else {
      navigation.navigate('Notifications');
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#2A2A2A" />
      <View
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === 'android'
                ? (StatusBar.currentHeight || 24) + 8
                : 52,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Left Section - Logo + Welcome */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>SPRED</Text>
            </View>
          </View>

          {/* Right Section - Actions */}
          <View style={styles.rightSection}>
            {/* Search Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSearchPress}
              activeOpacity={0.7}
              accessibilityLabel="Search"
              accessibilityRole="button"
            >
              <Icon name="search" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Notifications Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNotificationsPress}
              activeOpacity={0.7}
              accessibilityLabel="Notifications"
              accessibilityRole="button"
            >
              <Icon name="bell" size={18} color="#FFFFFF" />
              <NotificationBadge size={16} top={-6} right={-6} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    height: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#464646',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoText: {
    color: '#F45303',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
});

export default HomepageHeader;
