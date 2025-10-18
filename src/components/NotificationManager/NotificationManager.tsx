import React, { useState, useEffect } from 'react';
import { getDataJson } from '../../helpers/api/Asyncstorage';
import NotificationService from '../../services/NotificationService';

interface NotificationManagerProps {
  children: React.ReactNode;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  children,
}) => {
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Load saved settings
        const savedSettings = (await getDataJson('AppSettings')) as {
          liveDataNotifications?: boolean;
        } | null;
        const notificationService = NotificationService.getInstance();

        // Check if live data notifications are enabled
        if (savedSettings?.liveDataNotifications) {
          // DISABLED FOR PERFORMANCE
          // console.log('Initializing live data notifications...');
          notificationService.enableLiveData();
        }
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      const notificationService = NotificationService.getInstance();
      notificationService.disableLiveData();
    };
  }, []);

  return <>{children}</>;
};

export default NotificationManager;
