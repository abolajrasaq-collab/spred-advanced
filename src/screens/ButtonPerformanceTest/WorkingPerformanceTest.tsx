import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Old components for comparison - these should work
import Android12Button from '../../components/Android12Button/Android12Button';
import Android12CompatibleTouchable from '../../components/Android12CompatibleTouchable/Android12CompatibleTouchable';

// Optimized Android12 components - these should work too
import OptimizedAndroid12Button from '../../components/OptimizedAndroid12Button';
import OptimizedAndroid12Touchable from '../../components/OptimizedAndroid12Touchable';

// Default theme colors
const defaultColors = {
  background: '#1A1A1A',
  surface: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#E0E0E0',
  border: '#333333',
};

const WorkingPerformanceTest: React.FC = () => {
  const navigation = useNavigation();
  const styles = createStyles(defaultColors);
  
  // Test state
  const [oldButtonPresses, setOldButtonPresses] = useState(0);
  const [newButtonPresses, setNewButtonPresses] = useState(0);

  const handleOldButtonPress = useCallback(() => {
    setOldButtonPresses(prev => prev + 1);
  }, []);

  const handleNewButtonPress = useCallback(() => {
    setNewButtonPresses(prev => prev + 1);
  }, []);

  const resetCounters = useCallback(() => {
    setOldButtonPresses(0);
    setNewButtonPresses(0);
  }, []);

  const runStressTest = useCallback(() => {
    Alert.alert(
      'Stress Test',
      'This would run a performance comparison test between the different button implementations.',
      [{ text: 'OK' }]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Button Performance Test</Text>
          <Text style={styles.subtitle}>Compare button performance implementations</Text>
        </View>

        {/* Test Controls */}
        <View style={styles.controlsContainer}>
          <Android12Button
            title="Run Stress Test"
            onPress={runStressTest}
            size="medium"
            buttonColor="#F45303"
            style={styles.controlButton}
          />
          
          <Android12Button
            title="Reset Counters"
            onPress={resetCounters}
            size="medium"
            buttonColor="#6C757D"
            style={styles.controlButton}
          />
        </View>

        {/* Old Buttons Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔴 Old Implementation</Text>
            <Text style={styles.sectionSubtitle}>
              Presses: {oldButtonPresses}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Android12Button
              title="Primary"
              onPress={handleOldButtonPress}
              size="medium"
              buttonColor="#F45303"
              style={styles.testButton}
            />
            <Android12Button
              title="With Icon"
              onPress={handleOldButtonPress}
              size="medium"
              iconName="download"
              buttonColor="#F45303"
              style={styles.testButton}
            />
          </View>

          <Android12CompatibleTouchable
            style={styles.touchableTest}
            onPress={handleOldButtonPress}
          >
            <View style={styles.touchableContent}>
              <Text style={styles.touchableText}>Old Touchable Component</Text>
            </View>
          </Android12CompatibleTouchable>
        </View>

        {/* Optimized Android12 Components Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⚡ Optimized Android12 Components</Text>
            <Text style={styles.sectionSubtitle}>
              Presses: {newButtonPresses}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <OptimizedAndroid12Button
              title="Primary"
              onPress={handleNewButtonPress}
              size="medium"
              variant="primary"
              style={styles.testButton}
            />
            <OptimizedAndroid12Button
              title="With Icon"
              onPress={handleNewButtonPress}
              size="medium"
              variant="primary"
              iconName="download"
              style={styles.testButton}
            />
          </View>

          <OptimizedAndroid12Touchable
            style={styles.touchableTest}
            onPress={handleNewButtonPress}
          >
            <View style={styles.touchableContent}>
              <Text style={styles.touchableText}>Optimized Android12 Touchable</Text>
            </View>
          </OptimizedAndroid12Touchable>
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Performance Testing</Text>
          <Text style={styles.tipText}>• Tap buttons rapidly to test responsiveness</Text>
          <Text style={styles.tipText}>• Compare OLD vs OPTIMIZED ANDROID12 components</Text>
          <Text style={styles.tipText}>• Notice the smoother animations on optimized buttons</Text>
        </View>

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <Android12Button
            title="Back to Settings"
            onPress={() => navigation.goBack()}
            size="large"
            buttonColor="#F45303"
            variant="outline"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  sectionContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF', // Explicitly white
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  testButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  touchableTest: {
    backgroundColor: '#F45303',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  touchableContent: {
    alignItems: 'center',
  },
  touchableText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 20,
  },
  backButtonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});

export default WorkingPerformanceTest;