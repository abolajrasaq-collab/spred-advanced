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

// Only use components we know work
import Android12Button from '../../components/Android12Button/Android12Button';
import Android12CompatibleTouchable from '../../components/Android12CompatibleTouchable/Android12CompatibleTouchable';

const BasicWorkingTest: React.FC = () => {
  const navigation = useNavigation();
  
  // Test state
  const [buttonPresses, setButtonPresses] = useState(0);

  const handleButtonPress = useCallback(() => {
    setButtonPresses(prev => prev + 1);
  }, []);

  const resetCounter = useCallback(() => {
    setButtonPresses(0);
  }, []);

  const runTest = useCallback(() => {
    Alert.alert(
      'Button Performance Test',
      `You've pressed buttons ${buttonPresses} times! This demonstrates the Android12Button components are working properly.`,
      [{ text: 'Great!' }]
    );
  }, [buttonPresses]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Button Performance Test</Text>
          <Text style={styles.subtitle}>Testing Android12Button components</Text>
          <Text style={styles.counter}>Button presses: {buttonPresses}</Text>
        </View>

        {/* Test Controls */}
        <View style={styles.controlsContainer}>
          <Android12Button
            title="Run Test"
            onPress={runTest}
            size="medium"
            buttonColor="#F45303"
            style={styles.controlButton}
          />
          
          <Android12Button
            title="Reset"
            onPress={resetCounter}
            size="medium"
            buttonColor="#6C757D"
            style={styles.controlButton}
          />
        </View>

        {/* Android12Button Variants */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔴 Android12Button Components</Text>

          <View style={styles.buttonRow}>
            <Android12Button
              title="Primary"
              onPress={handleButtonPress}
              size="medium"
              buttonColor="#F45303"
              style={styles.testButton}
            />
            <Android12Button
              title="With Icon"
              onPress={handleButtonPress}
              size="medium"
              iconName="download"
              buttonColor="#F45303"
              style={styles.testButton}
            />
          </View>

          <View style={styles.buttonRow}>
            <Android12Button
              title="Small"
              onPress={handleButtonPress}
              size="small"
              buttonColor="#4CAF50"
              style={styles.testButton}
            />
            <Android12Button
              title="Large"
              onPress={handleButtonPress}
              size="large"
              buttonColor="#2196F3"
              style={styles.testButton}
            />
          </View>

          <View style={styles.buttonRow}>
            <Android12Button
              title="Secondary"
              onPress={handleButtonPress}
              size="medium"
              variant="secondary"
              style={styles.testButton}
            />
            <Android12Button
              title="Outline"
              onPress={handleButtonPress}
              size="medium"
              variant="outline"
              buttonColor="#F45303"
              style={styles.testButton}
            />
          </View>
        </View>

        {/* Android12CompatibleTouchable */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>🔴 Android12CompatibleTouchable</Text>
          
          <Android12CompatibleTouchable
            style={styles.touchableTest}
            onPress={handleButtonPress}
          >
            <View style={styles.touchableContent}>
              <Text style={styles.touchableText}>Android12CompatibleTouchable Component</Text>
            </View>
          </Android12CompatibleTouchable>
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Testing Instructions</Text>
          <Text style={styles.tipText}>• Tap buttons to test responsiveness</Text>
          <Text style={styles.tipText}>• Watch the counter increase with each press</Text>
          <Text style={styles.tipText}>• Try different button sizes and variants</Text>
          <Text style={styles.tipText}>• Test the touchable component at the bottom</Text>
          <Text style={styles.tipText}>• Use "Run Test" to see total interactions</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 12,
  },
  counter: {
    fontSize: 18,
    color: '#F45303',
    fontWeight: '600',
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
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
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
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 6,
    lineHeight: 20,
  },
  backButtonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
});

export default BasicWorkingTest;