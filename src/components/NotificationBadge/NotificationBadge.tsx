import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NotificationService from '../../services/NotificationService';

const COLORS = {
  background: '#111111',
  surface: '#1E1E1E',
  primary: '#F45303',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  error: '#FF4444',
} as const;

interface NotificationBadgeProps {
  size?: number;
  top?: number;
  right?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  size = 20,
  top = -2,
  right = -2,
}) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    setLoading(true);
    const service = NotificationService.getInstance();
    const count = await service.getUnreadCount();
    setUnreadCount(count);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    // Set up a timer to refresh the count periodically
    const interval = setInterval(fetchUnreadCount, 60000); // Every 60 seconds to reduce API calls

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Don't show badge if loading or no unread notifications
  if (loading || unreadCount === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        {
          width: Math.max(size, 18),
          height: Math.max(size, 18),
          borderRadius: Math.max(size / 2, 9),
          top,
          right,
        },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: Math.min(size * 0.75, 12),
          },
        ]}
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A2A2A',
    zIndex: 1,
  },
  badgeText: {
    color: COLORS.text,
    fontWeight: 'bold',
    lineHeight: 14,
  },
});

export default NotificationBadge;
