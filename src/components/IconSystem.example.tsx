/**
 * IconSystem Example
 * 
 * Demonstrates comprehensive icon support in UniversalButton
 */

import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { IconRenderer, IconSizeCalculator } from '../index';

const IconSystemExample: React.FC = () => {

  // Example custom icon component
  const CustomIcon = () => (
    <View style={styles.customIcon}>
      <Text style={styles.customIconText}>★</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Icon System Examples</Text>

      {/* MaterialIcons Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MaterialIcons</Text>

        <View style={styles.row}>
          <IconRenderer
            iconName="home"
            size={20}
            color="#F45303"
            position="left"
          />
          <Text style={styles.label}>Home Icon (Left)</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Settings Icon (Right)</Text>
          <IconRenderer
            iconName="settings"
            size={24}
            color="#6C757D"
            position="right"
          />
        </View>

        <View style={styles.row}>
          <IconRenderer
            iconName="favorite"
            size={16}
            color="#FF0000"
            position="left"
            disabled={true}
          />
          <Text style={styles.label}>Disabled Icon</Text>
        </View>
      </View>

      {/* Custom Icon Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Icons</Text>

        <View style={styles.row}>
          <IconRenderer
            icon={<CustomIcon />}
            size={20}
            color="#F45303"
            position="left"
          />
          <Text style={styles.label}>Custom Star Icon</Text>
        </View>
      </View>

      {/* Size Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size Variations</Text>

        <View style={styles.row}>
          <IconRenderer
            iconName="star"
            size={IconSizeCalculator.getIconConfig('small').iconSize}
            color="#F45303"
            position="left"
          />
          <Text style={styles.label}>Small (16px)</Text>
        </View>

        <View style={styles.row}>
          <IconRenderer
            iconName="star"
            size={IconSizeCalculator.getIconConfig('medium').iconSize}
            color="#F45303"
            position="left"
          />
          <Text style={styles.label}>Medium (20px)</Text>
        </View>

        <View style={styles.row}>
          <IconRenderer
            iconName="star"
            size={IconSizeCalculator.getIconConfig('large').iconSize}
            color="#F45303"
            position="left"
          />
          <Text style={styles.label}>Large (24px)</Text>
        </View>
      </View>

      {/* Accessibility Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accessibility</Text>

        <View style={styles.row}>
          <IconRenderer
            iconName="accessibility"
            size={20}
            color="#4CAF50"
            position="left"
            accessibilityLabel="Accessibility features enabled"
          />
          <Text style={styles.label}>With Accessibility Label</Text>
        </View>
      </View>

      {/* Size Calculator Examples */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Size Calculator</Text>

        <Text style={styles.info}>
          Small button config: {JSON.stringify(IconSizeCalculator.getIconConfig('small'), null, 2)}
        </Text>

        <Text style={styles.info}>
          Calculated icon size for 48px button: {IconSizeCalculator.calculateIconSize('medium', undefined, 48)}px
        </Text>

        <Text style={styles.info}>
          Calculated spacing for 20px icon: {IconSizeCalculator.calculateSpacing('medium', undefined, 20)}px
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  info: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  customIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customIconText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default IconSystemExample;