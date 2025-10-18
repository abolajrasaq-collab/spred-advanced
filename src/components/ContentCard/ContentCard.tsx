import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import OptimizedImage from '../OptimizedImage';
import InstantTouchableOpacity from '../InstantTouchableOpacity/InstantTouchableOpacity';
import { cleanMovieTitle } from '../../helpers/utils';

interface ContentCardProps {
  id: string;
  title: string;
  imageUrl: string;
  rating?: number;
  year?: string;
  duration?: string;
  isLive?: boolean;
  isPremium?: boolean;
  width?: number;
  height?: number;
  onPress?: (id: string) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  id,
  title,
  imageUrl,
  rating,
  year,
  duration,
  isLive = false,
  isPremium = false,
  width = 120,
  height = 200,
  onPress,
}) => {
  return (
    <InstantTouchableOpacity
      style={[styles.container, { width, height }]}
      onPress={() => onPress?.(id)}
      instantFeedback={true}
      scaleAnimation={true}
      feedbackOpacity={0.8}
      scaleAmount={0.98}
      delayPressInCustom={true}
      delayPressOutCustom={true}
    >
      <OptimizedImage
        src={imageUrl}
        width={width}
        height={height - 40}
        style={styles.image}
        resizeMode="cover"
        testID={`content-card-image-${id}`}
      />

      {/* Badges */}
      <View style={styles.badgeContainer}>
        {isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        )}
        {isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
          </View>
        )}
      </View>

      {/* Title only */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {cleanMovieTitle(title).toUpperCase()}
        </Text>
      </View>
    </InstantTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  image: {
    borderRadius: 8,
    backgroundColor: '#333333',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    gap: 4,
  },
  liveBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  premiumBadge: {
    backgroundColor: '#F45303',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  titleContainer: {
    backgroundColor: '#1A1A1A',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginTop: 8,
    width: '100%',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default memo(ContentCard);
