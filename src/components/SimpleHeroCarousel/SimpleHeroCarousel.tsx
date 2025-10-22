import React, { useState, useEffect, memo, useRef } from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  Dimensions,
  FlatList,
  Text,
} from 'react-native';
import { useTheme } from '../../hooks';
import InstantTouchableOpacity from '../InstantTouchableOpacity/InstantTouchableOpacity';

const { width: screenWidth } = Dimensions.get('window');

interface HeroItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  isLive?: boolean;
}

interface SimpleHeroCarouselProps {
  data: HeroItem[];
  onItemPress?: (item: HeroItem) => void;
  onDownloadPress?: (item: HeroItem) => void;
}

const SimpleHeroCarousel: React.FC<SimpleHeroCarouselProps> = memo(
  ({ data, onItemPress, onDownloadPress }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { Colors } = useTheme();

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index);
      }
    }).current;

    const viewabilityConfig = useRef({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 300,
    }).current;

    const renderItem = ({ item }: { item: HeroItem }) => (
      <InstantTouchableOpacity
        style={styles(Colors).slide}
        onPress={() => onItemPress?.(item)}
        instantFeedback={true}
        scaleAnimation={true}
        feedbackOpacity={0.9}
        scaleAmount={0.99}
      >
        <ImageBackground
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/400x250/333333/FFFFFF?text=No+Image' }}
          style={styles(Colors).slideImage}
          resizeMode="cover"
          onError={() => {
            console.log('🎠 Hero carousel image error for:', item.title, 'URL:', item.imageUrl);
          }}
        >
          <View style={styles(Colors).overlay}>
            <View style={styles(Colors).contentContainer}>
              <Text style={styles(Colors).title} numberOfLines={2}>
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={styles(Colors).subtitle} numberOfLines={1}>
                  {item.subtitle}
                </Text>
              )}
              {item.isLive && (
                <View style={styles(Colors).liveBadge}>
                  <Text style={styles(Colors).liveText}>LIVE</Text>
                </View>
              )}

              {/* Download Button */}
              <InstantTouchableOpacity
                style={styles(Colors).downloadButton}
                onPress={() => onDownloadPress?.(item)}
                instantFeedback={true}
                scaleAnimation={true}
                feedbackOpacity={0.8}
                scaleAmount={0.96}
              >
                <Text style={styles(Colors).downloadButtonText}>WATCH NOW</Text>
              </InstantTouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </InstantTouchableOpacity>
    );

    return (
      <View style={styles(Colors).container}>
        <FlatList
          ref={flatListRef}
          data={data}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={item => item.id}
        />

        {/* Pagination Dots - Hidden */}
        <View style={[styles(Colors).pagination, { display: 'none' }]}>
          {data.map((_, index) => (
            <View
              key={index}
              style={[
                styles(Colors).dot,
                {
                  backgroundColor:
                    index === activeIndex ? Colors.primary : '#666666',
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  },
);

const styles = (Colors: any) =>
  StyleSheet.create({
    container: {
      height: 250,
      marginBottom: 4,
    },
    slide: {
      width: screenWidth,
      height: '100%',
    },
    slideImage: {
      width: '100%',
      height: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'flex-end',
    },
    contentContainer: {
      padding: 20,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 2,
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    subtitle: {
      color: '#FFFFFF',
      fontSize: 16,
      marginBottom: 6,
    },
    liveBadge: {
      backgroundColor: '#FF0000',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    liveText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    downloadButton: {
      backgroundColor: '#F45303',
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 1,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    pagination: {
      position: 'absolute',
      bottom: 10,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
  });

export default SimpleHeroCarousel;
