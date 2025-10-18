/**
 * Android 12 Button Demo Component
 * 
 * This component demonstrates all the features and variants
 * of the Android12Button component.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Android12Button from './Android12Button';

const Android12ButtonDemo: React.FC = () => {
  const [pressCount, setPressCount] = useState(0);
  const [lastPressed, setLastPressed] = useState<string>('');

  const handlePress = (buttonName: string) => {
    setPressCount(prev => prev + 1);
    setLastPressed(buttonName);
    console.log(`🔘 ${buttonName} pressed! Total: ${pressCount + 1}`);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Android 12 Button Demo</Text>
      <Text style={styles.subtitle}>All variants and features</Text>
      
      {/* Basic Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Buttons</Text>
        
        <Android12Button
          title="Primary Button"
          onPress={() => handlePress('Primary')}
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Secondary Button"
          onPress={() => handlePress('Secondary')}
          variant="secondary"
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Outline Button"
          onPress={() => handlePress('Outline')}
          variant="outline"
          style={styles.buttonSpacing}
        />
      </View>

      {/* Size Variants */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size Variants</Text>
        
        <Android12Button
          title="Small Button"
          onPress={() => handlePress('Small')}
          size="small"
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Medium Button"
          onPress={() => handlePress('Medium')}
          size="medium"
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Large Button"
          onPress={() => handlePress('Large')}
          size="large"
          style={styles.buttonSpacing}
        />
      </View>

      {/* With Icons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>With Icons</Text>
        
        <Android12Button
          title="Play Video"
          onPress={() => handlePress('Play')}
          iconName="play-arrow"
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Send File"
          onPress={() => handlePress('Send')}
          iconName="send"
          variant="secondary"
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Settings"
          onPress={() => handlePress('Settings')}
          iconName="settings"
          variant="outline"
          style={styles.buttonSpacing}
        />
      </View>

      {/* Debug Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug Mode (Show State)</Text>
        
        <Android12Button
          title="Debug Button"
          onPress={() => handlePress('Debug')}
          showState={true}
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Fallback Button"
          onPress={() => handlePress('Fallback')}
          useFallback={true}
          showState={true}
          style={styles.buttonSpacing}
        />
      </View>

      {/* Disabled State */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disabled State</Text>
        
        <Android12Button
          title="Disabled Button"
          onPress={() => handlePress('Disabled')}
          disabled={true}
          style={styles.buttonSpacing}
        />
      </View>

      {/* Custom Colors */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Colors</Text>
        
        <Android12Button
          title="Custom Orange"
          onPress={() => handlePress('Custom Orange')}
          buttonColor="#FF6B35"
          pressedColor="#E55A2B"
          releasedColor="#4CAF50"
          style={styles.buttonSpacing}
        />
        
        <Android12Button
          title="Custom Blue"
          onPress={() => handlePress('Custom Blue')}
          buttonColor="#2196F3"
          pressedColor="#1976D2"
          releasedColor="#4CAF50"
          style={styles.buttonSpacing}
        />
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button Stats</Text>
        <Text style={styles.statsText}>Total Presses: {pressCount}</Text>
        <Text style={styles.statsText}>Last Pressed: {lastPressed || 'None'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#F45303',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  buttonSpacing: {
    marginBottom: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default Android12ButtonDemo;
