import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import OptimizedTouchableOpacity from '../OptimizedTouchableOpacity/OptimizedTouchableOpacity';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from '../Icon/Icon';
import {
  NAVIGATION_ITEMS,
  NAVIGATION_CONFIG,
} from '../../constants/navigation';
import { NavigationContext } from '@react-navigation/native';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import { useFullscreenVideo } from '../../contexts/FullscreenVideoContext';

const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const rootNavigation = useContext(NavigationContext);
  const colors = useThemeColors();
  const { spacing } = useSpacing();
  const { isFullscreen } = useFullscreenVideo();
  const [isVisible, setIsVisible] = useState(false);

  // Improved logic to determine when to show tab bar with error handling
  const shouldShowTabBar = () => {
    try {
      // Hide tab bar when in fullscreen mode
      if (isFullscreen) {
        // DISABLED FOR PERFORMANCE
        // console.log('Tab Bar: Hidden due to fullscreen mode');
        return false;
      }

      if (!rootNavigation) {
        // DISABLED FOR PERFORMANCE
        // console.log('Tab Bar: No root navigation');
        return false;
      }

      const rootState = rootNavigation.getState();
      if (!rootState) {
        // DISABLED FOR PERFORMANCE
        // console.log('Tab Bar: No root state');
        return false;
      }

      const currentRoute = rootState.routes[rootState.index];
      // DISABLED FOR PERFORMANCE
      // console.log('Tab Bar: Current route:', currentRoute.name);

      // Show tab bar when on the main dashboard screen
      return currentRoute.name === 'dashboard';
    } catch (error) {
      // DISABLED FOR PERFORMANCE
      // console.log('Tab Bar visibility error:', error);
      return false;
    }
  };

  // Update visibility when navigation state changes
  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(shouldShowTabBar());
    };

    // Initial check
    updateVisibility();

    // Listen to navigation events
    const unsubscribe = rootNavigation?.addListener('state', updateVisibility);

    return unsubscribe;
  }, [rootNavigation, isFullscreen]);

  if (!isVisible) {
    return null;
  }

  return (
    <View style={[styles.tabBar, { backgroundColor: '#1A1A1A' }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        // Find navigation item
        const navItem = NAVIGATION_ITEMS.find(item => item.name === route.name);
        const tabBarLabel = options.tabBarLabel;
        const labelText =
          navItem?.label ||
          (typeof tabBarLabel === 'string' ? tabBarLabel : route.name);
        const label = labelText;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Get icon for the tab - use fallback if navItem not found
        const iconName = navItem?.icon || 'home';
        const iconColor = isFocused ? '#F45303' : '#8B8B8B';

        return (
          <OptimizedTouchableOpacity
            key={route.key}
            style={[styles.tabItem, { paddingTop: spacing.sm }]}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.4}
            hitSlopCustom={true}
            delayPressInCustom={true}
            delayPressOutCustom={true}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: isFocused }}
          >
            <Icon name={iconName} size={24} color={iconColor} />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: iconColor,
                  marginTop: 4,
                },
              ]}
            >
              {label}
            </Text>
          </OptimizedTouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingBottom: 20,
    elevation: 8,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default CustomTabBar;
