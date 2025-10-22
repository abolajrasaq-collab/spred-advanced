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

// Old components for comparison
import Android12Button from '../../components/Android12Button/Android12Button';
import Android12CompatibleTouchable from '../../components/Android12CompatibleTouchable/Android12CompatibleTouchable';

// New optimized components
import OptimizedButton from '../../components/OptimizedButton';
import OptimizedTouchable from '../../components/OptimizedTouchable';

import { useThemeColors } from '../../theme/ThemeProvider';

const SimpleButtonTest: React.FC = () => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const navigation = useNavigation();
  
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

  const runQuickTest = useCallback(() => {
    Alert.alert(
      'Quick Performance Test',
      'Tap buttons rapidly in both sections and notice the difference in responsiveness!',
      [{ text: 'Got it!' }]
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Button Performance Test</Text>
          <Text style={styles.subtitle}>Compare old vs optimized button performance</Text>
        </View>

        {/* Test Controls */}
        <View style={styles.controlsContainer}>
          <OptimizedButton
            title="Quick Test Info"
            onPress={runQuickTest}
            variant="primary"
            size="medium"
            iconName="info"
          />
          
          <OptimizedButton
            title="Reset Counters"
            onPress={resetCounters}
            variant="outline"
            size="medium"
            iconName="refresh"
          />
        </View>

        {/* Old Buttons Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔴 Old Implementation</Text>
            <Text style={styles.sectionSubtitle}>
              Button presses: {oldButtonPresses}
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

        {/* New Optimized Buttons Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>✅ Optimized Implementation</Text>
            <Text style={styles.sectionSubtitle}>
              Button presses: {newButtonPresses}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <OptimizedButton
              title="Primary"
              onPress={handleNewButtonPress}
              variant="primary"
              size="medium"
              style={styles.testButton}
            />
            <OptimizedButton
              title="With Icon"
              onPress={handleNewButtonPress}
              variant="primary"
              size="medium"
              iconName="download"
              style={styles.testButton}
            />
          </View>

          <View style={styles.buttonRow}>
            <OptimizedButton
              title="Secondary"
              onPress={handleNewButtonPress}
              variant="secondary"
              size="medium"
              style={styles.testButton}
            />
            <OptimizedButton
              title="Outline"
              onPress={handleNewButtonPress}
              variant="outline"
              size="medium"
              style={styles.testButton}
            />
          </View>

          <OptimizedTouchable
            style={styles.touchableTest}
            onPress={handleNewButtonPress}
          >
            <View style={styles.touchableContent}>
              <Text style={styles.touchableText}>Optimized Touchable Component</Text>
            </View>
          </OptimizedTouchable>
        </View>

        {/* Performance Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Performance Testing Tips</Text>
          <Text style={styles.tipText}>• Tap buttons rapidly to test responsiveness</Text>
          <Text style={styles.tipText}>• Notice smoother animations on optimized buttons</Text>
          <Text style={styles.tipText}>• Optimized buttons should feel more "snappy"</Text>
          <Text style={styles.tipText}>• Check memory usage in React Native debugger</Text>
        </View>

        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <OptimizedButton
            title="Back to Settings"
            onPress={() => navigation.goBack()}
            variant="outline"
            size="large"
            iconName="arrow-back"
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
    color: colors.text,
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

export default SimpleButtonTest;