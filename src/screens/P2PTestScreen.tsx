import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import QRShareService from '../services/QRShareService';
import QRShareTester, { TestResult } from '../utils/QRShareTester';
import QRShareDemo from '../utils/QRShareDemo';
import logger from '../utils/logger';

const { width } = Dimensions.get('window');

const P2PTestScreen: React.FC = () => {
  const [qrShareStats, setQrShareStats] = useState<any>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<any>(null);

  const qrShareService = QRShareService.getInstance();
  const qrShareTester = new QRShareTester();
  const qrShareDemo = new QRShareDemo();

  useEffect(() => {
    // Load initial QR share statistics
    loadQRShareStats();
    
    // Set up periodic stats refresh
    const interval = setInterval(loadQRShareStats, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadQRShareStats = () => {
    try {
      const stats = qrShareService.getServerStats();
      setQrShareStats(stats);
    } catch (error) {
      logger.error('❌ Error loading QR share stats:', error);
    }
  };

  const runComprehensiveTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    setTestSummary(null);
    
    try {
      logger.info('🧪 Starting comprehensive QR share tests...');
      
      const results = await qrShareTester.runAllTests();
      const summary = qrShareTester.getTestSummary();
      
      setTestResults(results);
      setTestSummary(summary);
      
      // Show summary alert
      Alert.alert(
        'Test Results',
        `Tests completed!\n\nPassed: ${summary.passed}/${summary.total}\nPass Rate: ${summary.passRate.toFixed(1)}%`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      logger.error('❌ Test execution failed:', error);
      Alert.alert('Test Error', error.message || 'Failed to run tests');
    } finally {
      setIsRunningTests(false);
      loadQRShareStats(); // Refresh stats after tests
    }
  };

  const stopAllServers = async () => {
    try {
      await qrShareService.stopAllServers();
      loadQRShareStats();
      Alert.alert('Success', 'All QR share servers stopped');
    } catch (error: any) {
      logger.error('❌ Error stopping servers:', error);
      Alert.alert('Error', error.message || 'Failed to stop servers');
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
    setTestSummary(null);
  };

  const runQRDemo = async () => {
    try {
      setIsRunningTests(true);
      logger.info('🎬 Running QR Share Demo...');

      const demoResult = await qrShareDemo.runEndToEndTest();
      
      Alert.alert(
        'QR Demo Results',
        demoResult.summary,
        [{ text: 'OK' }]
      );

      // Convert demo results to test results format
      const testResults: TestResult[] = demoResult.results.map((result, index) => ({
        testName: result.test,
        passed: result.success,
        message: result.success ? 'Test passed' : (result.details.error || 'Test failed'),
        details: result.details,
        duration: 0
      }));

      setTestResults(testResults);
      setTestSummary({
        total: testResults.length,
        passed: testResults.filter(r => r.passed).length,
        failed: testResults.filter(r => !r.passed).length,
        passRate: (testResults.filter(r => r.passed).length / testResults.length) * 100
      });

    } catch (error: any) {
      logger.error('❌ QR Demo failed:', error);
      Alert.alert('Demo Error', error.message || 'Demo failed');
    } finally {
      setIsRunningTests(false);
      loadQRShareStats();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR-Based P2P Test Screen</Text>
        <Text style={styles.subtitle}>
          Test QR code sharing and HTTP file transfer functionality
        </Text>
      </View>

      {/* QR Share Service Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>QR Share Service Status</Text>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Active Servers: {qrShareStats?.activeServers || 0}
          </Text>
          <Text style={styles.statusText}>
            Total Shares: {qrShareStats?.totalShares?.length || 0}
          </Text>
          {qrShareStats?.totalShares?.length > 0 && (
            <Text style={styles.statusText}>
              Share IDs: {qrShareStats.totalShares.join(', ')}
            </Text>
          )}
        </View>
      </View>

      {/* Test Summary */}
      {testSummary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Summary</Text>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryText}>
              Total Tests: {testSummary.total}
            </Text>
            <Text style={[styles.summaryText, { color: '#4CAF50' }]}>
              Passed: {testSummary.passed}
            </Text>
            <Text style={[styles.summaryText, { color: '#F44336' }]}>
              Failed: {testSummary.failed}
            </Text>
            <Text style={styles.summaryText}>
              Pass Rate: {testSummary.passRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Controls</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isRunningTests && styles.buttonDisabled]}
            onPress={runComprehensiveTests}
            disabled={isRunningTests}
          >
            {isRunningTests ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Run All Tests</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={stopAllServers}
          >
            <Text style={styles.buttonText}>Stop All Servers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={loadQRShareStats}
          >
            <Text style={styles.buttonText}>Refresh Stats</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={clearTestResults}
          >
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, isRunningTests && styles.buttonDisabled]}
            onPress={runQRDemo}
            disabled={isRunningTests}
          >
            <Text style={styles.buttonText}>Run QR Demo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Test Results */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Test Results ({testResults.length})
        </Text>
        <ScrollView style={styles.testResultsContainer}>
          {testResults.length === 0 ? (
            <Text style={styles.noResultsText}>
              No test results yet. Run tests to see results here.
            </Text>
          ) : (
            testResults.map((result, index) => (
              <View key={index} style={styles.testResultItem}>
                <Text style={[
                  styles.testResultText,
                  { color: result.passed ? '#4CAF50' : '#F44336' }
                ]}>
                  {result.passed ? '✅' : '❌'} {result.testName}
                </Text>
                <Text style={styles.testResultMessage}>
                  {result.message}
                </Text>
                {result.duration && (
                  <Text style={styles.testResultDuration}>
                    Duration: {result.duration}ms
                  </Text>
                )}
                {result.details && (
                  <Text style={styles.testResultDetails}>
                    Details: {JSON.stringify(result.details, null, 2)}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Server Uptime */}
      {qrShareStats?.uptime && Object.keys(qrShareStats.uptime).length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Server Uptime</Text>
          <View style={styles.uptimeContainer}>
            {Object.entries(qrShareStats.uptime).map(([shareId, uptime]) => (
              <Text key={shareId} style={styles.uptimeText}>
                {shareId}: {Math.round((uptime as number) / 1000)}s
              </Text>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#F45303',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  statusContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#F45303',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: (width - 60) / 2,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  testResultsContainer: {
    maxHeight: 300,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
  },
  noResultsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  testResultItem: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#F45303',
  },
  testResultText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  testResultMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  testResultDuration: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
  },
  testResultDetails: {
    fontSize: 11,
    color: '#777',
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    padding: 5,
    borderRadius: 3,
  },
  uptimeContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
  },
  uptimeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
});

export default P2PTestScreen;