import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import { api } from '../../helpers/api/api';
import { customHeaders } from '../../helpers/api/apiConfig';
import logger from '../../utils/logger';

const DebugLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };

  const testLogin = async () => {
    try {
      setLoading(true);
      setDebugInfo([]);
      
      addDebugInfo('Starting login test...');
      addDebugInfo(`Email: ${email}`);
      addDebugInfo(`Password: ${password ? '***' : 'empty'}`);
      
      // Test API endpoint accessibility
      addDebugInfo('Testing API endpoint...');
      const testResponse = await fetch(api.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          mobileAppByPassIVAndKey: 'a0092a148a0d69715268df9f5bb63b24fca27d344f54df9b',
          username: 'SpredMediaAdmin',
          password: 'SpredMediaLoveSpreding@2023',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });
      
      addDebugInfo(`API Response Status: ${testResponse.status}`);
      addDebugInfo(`API Response Headers: ${JSON.stringify(Object.fromEntries(testResponse.headers))}`);
      
      const responseText = await testResponse.text();
      addDebugInfo(`API Response Body: ${responseText}`);
      
      if (testResponse.ok) {
        const responseData = JSON.parse(responseText);
        addDebugInfo('✅ Login successful!');
        addDebugInfo(`Token: ${responseData.data?.token ? 'Present' : 'Missing'}`);
        addDebugInfo(`User ID: ${responseData.data?.id || 'N/A'}`);
        
        Alert.alert('Success', 'Login test successful!');
      } else {
        addDebugInfo(`❌ Login failed with status: ${testResponse.status}`);
        Alert.alert('Error', `Login failed: ${responseText}`);
      }
      
    } catch (error) {
      addDebugInfo(`❌ Error: ${error.message}`);
      logger.error('Debug login error:', error);
      Alert.alert('Error', `Login error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testWithSampleCredentials = () => {
    setEmail('demo@spred.cc');
    setPassword('demo123');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Debug Login</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
        />
      </View>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={testLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={testWithSampleCredentials}
      >
        <Text style={styles.buttonText}>Use Sample Credentials</Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug Info:</Text>
        {debugInfo.map((info, index) => (
          <Text key={index} style={styles.debugText}>
            {info}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#2A2A2A',
  },
  button: {
    backgroundColor: '#F45303',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: '#444444',
  },
  buttonDisabled: {
    backgroundColor: '#666666',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debugContainer: {
    flex: 1,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#00FF00',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});

export default DebugLogin;
