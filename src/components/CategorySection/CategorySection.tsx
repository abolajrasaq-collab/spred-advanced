import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../hooks';
import ContentCard from '../ContentCard/ContentCard';

interface ContentItem {
  id: string;
  title: string;
  imageUrl: string;
  rating?: number;
  year?: string;
  duration?: string;
  isLive?: boolean;
  isPremium?: boolean;
}

interface CategorySectionProps {
  title: string;
  data: ContentItem[];
  onMorePress?: () => void;
  onContentPress?: (id: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = memo(
  ({ title, data, onMorePress, onContentPress }) => {
    const { Layout, Colors, Fonts, Gutters } = useTheme();

    console.log(`📂 CategorySection "${title}" rendering ${data.length} items`);

    const renderContentCard = ({ item }: { item: ContentItem }) => (
      <ContentCard
        id={item.id}
        title={item.title}
        imageUrl={item.imageUrl}
        rating={item.rating}
        year={item.year}
        duration={item.duration}
        isLive={item.isLive}
        isPremium={item.isPremium}
        onPress={onContentPress}
      />
    );

    return (
      <View style={styles(Colors).container}>
        {/* Section Header */}
        <View style={styles(Colors).header}>
          <Text style={styles(Colors).title}>{title.toUpperCase()}</Text>
          <TouchableOpacity
            onPress={onMorePress}
            style={styles(Colors).moreButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles(Colors).moreText}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Content List */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles(Colors).contentList}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={160}
          snapToAlignment="start"
        >
          {data.length > 0 ? (
            data.map(item => {
              console.log(`  📂 Rendering item "${item.title}" with image: ${item.imageUrl.substring(0, 50)}...`);
              return (
                <View key={item.id} style={styles(Colors).itemContainer}>
                  {renderContentCard({ item })}
                </View>
              );
            })
          ) : (
            <View style={styles(Colors).emptyContainer}>
              <Text style={styles(Colors).emptyText}>No content available</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  },
);

const styles = (Colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 12,
      backgroundColor: '#1E1E1E',
      borderTopWidth: 1,
      borderTopColor: '#333333',
      borderBottomWidth: 1,
      borderBottomColor: '#333333',
    },
    title: {
      color: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    moreButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    moreText: {
      color: Colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    contentList: {
      paddingHorizontal: 16,
    },
    itemContainer: {
      marginRight: 12,
    },
    emptyContainer: {
      width: 200,
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: Colors.textSecondary,
      fontSize: 14,
    },
  });

export default CategorySection;
