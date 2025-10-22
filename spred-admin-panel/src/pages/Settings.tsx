import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Database,
  Shield,
  Mail,
  Bell,
  Globe
} from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    appName: 'Spred',
    appVersion: '1.0.7',
    apiUrl: 'https://api.spred.cc',
    maxConcurrentDownloads: 3,
    wifiOnlyMode: false,
    enableBackgroundDownloads: true,
    storageCleanupThreshold: 1024, // MB
    emailNotifications: true,
    pushNotifications: true,
    maintenanceMode: false,
    debugMode: false,
  });

  const queryClient = useQueryClient();

  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiService.getSettings(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) => apiService.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {updateSettingsMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            General Settings
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Name
              </label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => handleInputChange('appName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                App Version
              </label>
              <input
                type="text"
                value={settings.appVersion}
                onChange={(e) => handleInputChange('appVersion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="url"
                value={settings.apiUrl}
                onChange={(e) => handleInputChange('apiUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Download Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Download Settings
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Downloads
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxConcurrentDownloads}
                onChange={(e) => handleInputChange('maxConcurrentDownloads', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Cleanup Threshold (MB)
              </label>
              <input
                type="number"
                min="100"
                value={settings.storageCleanupThreshold}
                onChange={(e) => handleInputChange('storageCleanupThreshold', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="wifiOnly"
                type="checkbox"
                checked={settings.wifiOnlyMode}
                onChange={(e) => handleInputChange('wifiOnlyMode', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="wifiOnly" className="ml-2 block text-sm text-gray-900">
                WiFi Only Mode
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="backgroundDownloads"
                type="checkbox"
                checked={settings.enableBackgroundDownloads}
                onChange={(e) => handleInputChange('enableBackgroundDownloads', e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="backgroundDownloads" className="ml-2 block text-sm text-gray-900">
                Enable Background Downloads
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Settings
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center">
            <input
              id="emailNotifications"
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
              Email Notifications
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="pushNotifications"
              type="checkbox"
              checked={settings.pushNotifications}
              onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
              Push Notifications
            </label>
          </div>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            System Settings
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center">
            <input
              id="maintenanceMode"
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
              Maintenance Mode
            </label>
            <span className="ml-2 text-xs text-gray-500">
              (Users will see maintenance page)
            </span>
          </div>

          <div className="flex items-center">
            <input
              id="debugMode"
              type="checkbox"
              checked={settings.debugMode}
              onChange={(e) => handleInputChange('debugMode', e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="debugMode" className="ml-2 block text-sm text-gray-900">
              Debug Mode
            </label>
            <span className="ml-2 text-xs text-gray-500">
              (Enable detailed logging)
            </span>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            System Information
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Server Status</h4>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm text-gray-900">Online</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Last Backup</h4>
              <span className="text-sm text-gray-900">2 hours ago</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Database Size</h4>
              <span className="text-sm text-gray-900">2.4 GB</span>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Uptime</h4>
              <span className="text-sm text-gray-900">99.7%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Reset to Defaults</span>
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={updateSettingsMutation.isPending}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {updateSettingsMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save All Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Settings;