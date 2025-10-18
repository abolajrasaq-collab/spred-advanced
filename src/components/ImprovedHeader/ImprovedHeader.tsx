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
import CustomText from '../CustomText/CustomText';
import Icon from '../Icon/Icon';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  onNotificationsPress?: () => void;
  showSearch?: boolean;
  showNotifications?: boolean;
  userInfo?: any;
}

const ImprovedHeader: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  onSearchPress,
  onNotificationsPress,
  showSearch = true,
  showNotifications = true,
  userInfo,
}) => {
  const navigation = useNavigation<any>();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

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
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44,
          },
        ]}
      >
        <View style={styles.content}>
          {/* Left Section - Back Button + Title or Logo */}
          <View style={styles.leftSection}>
            {showBackButton ? (
              <View style={styles.titleSection}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackPress}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <Icon name="arrow-left" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                {title && <Text style={styles.titleText}>{title}</Text>}
              </View>
            ) : (
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>SPRED</Text>
                {userInfo?.firstName && (
                  <Text style={styles.welcomeText}>
                    Hello {userInfo.firstName}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Right Section - Actions */}
          <View style={styles.rightSection}>
            {/* Search Button */}
            {showSearch && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSearchPress}
                activeOpacity={0.7}
                accessibilityLabel="Search"
                accessibilityRole="button"
              >
                <Icon name="search" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Notifications Button */}
            {showNotifications && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleNotificationsPress}
                activeOpacity={0.7}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Icon name="bell" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
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
    paddingVertical: 8,
    height: 56,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#464646',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoText: {
    color: '#F45303',
    fontSize: 24,
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

export default ImprovedHeader;
