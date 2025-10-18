import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Icon from '../Icon/Icon';

const COLORS = {
  primary: '#F45303',
  surface: '#1A1A1A',
  surfaceVariant: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  indicator: '#F45303',
} as const;

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
} as const;

interface ModernNavigationTabsProps {
  contentTypes: any[];
  currentTab: number;
  onChange: (index: number, contentTypeId: string) => void;
  cats: any[];
  changeCat: (categoryId: string) => void;
}

const ModernNavigationTabs: React.FC<ModernNavigationTabsProps> = ({
  contentTypes,
  currentTab,
  onChange,
  cats,
  changeCat,
}) => {
  // Fallback content types if API doesn't return them
  const fallbackContentTypes = [
    { _ID: 'all', name: 'ALL' },
    { _ID: '6538e041681695c4bba653ee', name: 'ORIGINALS' },
    { _ID: '6538e094681695c4bba653f2', name: 'MOVIES' },
    { _ID: '6538e08c681695c4bba653f1', name: 'SERIES' },
    { _ID: '6538e084681695c4bba653f0', name: 'SKIT' },
    { _ID: 'trending-now', name: 'TRENDING' },
    { _ID: 'new-releases', name: 'NEW' },
    { _ID: 'top-rated', name: 'TOP RATED' },
  ];

  // Transform content types to rename SPRED ORIGINALS to ORIGINALS and add custom tabs
  const transformContentTypes = (types: any[]) => {
    const transformed = types.map(type => ({
      ...type,
      name: type.name === 'SPRED ORIGINALS' ? 'ORIGINALS' : type.name,
    }));

    // Add ALL tab at the beginning
    const allTab = { _ID: 'all', name: 'ALL' };

    // Add custom tabs
    const customTabs = [
      { _ID: 'trending-now', name: 'TRENDING' },
      { _ID: 'new-releases', name: 'NEW' },
      { _ID: 'top-rated', name: 'TOP RATED' },
    ];

    return [allTab, ...transformed, ...customTabs];
  };

  const displayContentTypes =
    contentTypes && contentTypes.length > 0
      ? transformContentTypes(contentTypes)
      : fallbackContentTypes;

  const handleTabPress = (index: number, contentType: any) => {
    onChange(index, contentType._ID);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {displayContentTypes.map((contentType, index) => {
          const isActive = currentTab === index;
          return (
            <TouchableOpacity
              key={contentType._ID}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => handleTabPress(index, contentType)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {contentType.name.toUpperCase()}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginRight: SPACING.sm,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: COLORS.surfaceVariant,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 2,
    backgroundColor: COLORS.indicator,
    borderRadius: 1,
  },
});

export default ModernNavigationTabs;
