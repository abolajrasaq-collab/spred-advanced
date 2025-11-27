import React, { useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { usePermissions } from '../hooks/usePermissions';
import logger from '../utils/logger';

const PermissionChecker: React.FC = () => {
  const { loading, summary, refresh, openSettings } = usePermissions();

  useEffect(() => {
    // Automatically refresh permissions when the component mounts
    refresh();
  }, [refresh]);

  const handleCheckPermissions = async () => {
    await refresh();
    if (summary) {
      logger.info('Current Permission Summary:', summary);
      const deniedPermissions = summary.statuses.filter(s => s.status !== 'granted');
      if (deniedPermissions.length > 0) {
        Alert.alert(
          'Permissions Status',
          `The following permissions are not granted:\n\n${deniedPermissions.map(s => `- ${s.permission}: ${s.status}`).join('\n')}\n\nWould you like to open settings to enable them?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
      } else {
        Alert.alert('Permissions Status', 'All required permissions are granted!');
      }
    } else {
      Alert.alert('Permissions Status', 'Permission summary not available.');
    }
  };

  if (loading) {
    return (
      <View>
        <Text>Loading permissions...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 10, fontWeight: 'bold' }}>Permission Checker Component</Text>
      {summary && (
        <View style={{ marginBottom: 20 }}>
          <Text>All Granted: {summary.allGranted ? 'Yes' : 'No'}</Text>
          <Text>Required Granted: {summary.requiredGranted ? 'Yes' : 'No'}</Text>
          <Text>Can Proceed: {summary.canProceed ? 'Yes' : 'No'}</Text>
          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>Individual Statuses:</Text>
          {summary.statuses.map((s, index) => (
            <Text key={index}>
              - {s.permission}: {s.status} ({s.description})
            </Text>
          ))}
          {summary.issues.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold', color: 'red' }}>Issues:</Text>
              {summary.issues.map((issue, index) => (
                <Text key={index} style={{ color: 'red' }}>
                  - {issue}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      <Button title="Refresh Permissions" onPress={handleCheckPermissions} />
    </View>
  );
};

export default PermissionChecker;
