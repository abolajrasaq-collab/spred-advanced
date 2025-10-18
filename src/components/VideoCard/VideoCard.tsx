import React, { memo, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import OptimizedImage from '../OptimizedImage';
import CustomText from '../CustomText/CustomText';
import Icon from '../Icon/Icon';
import { useThemeColors, useSpacing } from '../../theme/ThemeProvider';
import { cleanMovieTitle } from '../../helpers/utils';

const { width } = Dimensions.get('window');

interface VideoCardProps {
  title: string;
  thumbnail?: string;
  duration?: string;
  size?: string;
  isDownloaded?: boolean;
  quality?: string;
  onPress?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  style?: any;
  variant?: 'default' | 'compact' | 'wide';
}

const VideoCard: React.FC<VideoCardProps> = ({
  title,
  thumbnail,
  duration,
  size,
  isDownloaded = false,
  quality,
  onPress,
  onDownload,
  onShare,
  style,
  variant = 'default',
}) => {
  const colors = useThemeColors();
  const { spacing } = useSpacing();

  const cardDimensions = useMemo(() => {
    switch (variant) {
      case 'compact':
        return { width: width * 0.28, height: 160 };
      case 'wide':
        return { width: width - spacing.lg * 2, height: 120 };
      default:
        return { width: width * 0.45, height: 240 };
    }
  }, [variant, spacing.lg]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { width: cardDimensions.width }, style]}
      activeOpacity={0.8}
    >
      {/* Thumbnail Container */}
      <View
        style={[
          styles.thumbnailContainer,
          {
            height: variant === 'wide' ? 80 : cardDimensions.height * 0.65,
            backgroundColor: colors.background.tertiary,
          },
        ]}
      >
        {thumbnail ? (
          <OptimizedImage
            src={thumbnail}
            placeholderHash="L6Pj0^jE.AyE_3t7t7R*XKNa|kW"
            width={cardDimensions.width - 1} // Small adjustment to fit container
            height={variant === 'wide' ? 80 : cardDimensions.height * 0.65}
            style={styles.thumbnail}
            resizeMode="cover"
            lazy={true}
            priority="normal"
            testID={`video-card-thumbnail-${title
              .slice(0, 10)
              .replace(/\s/g, '-')}`}
          />
        ) : (
          <View
            style={[
              styles.placeholderThumbnail,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Icon name="video" size="lg" color="textSecondary" />
          </View>
        )}

        {/* Duration Badge */}
        {duration && (
          <View
            style={[
              styles.durationBadge,
              { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
            ]}
          >
            <CustomText
              fontSize={10}
              fontWeight="600"
              color={colors.text.primary}
            >
              {duration}
            </CustomText>
          </View>
        )}

        {/* Downloaded Indicator */}
        {isDownloaded && (
          <View
            style={[
              styles.downloadedIndicator,
              { backgroundColor: colors.status.success },
            ]}
          >
            <Icon name="check" size="xs" color="white" />
          </View>
        )}

        {/* Quality Badge */}
        {quality && (
          <View
            style={[
              styles.qualityBadge,
              { backgroundColor: colors.interactive.primary },
            ]}
          >
            <CustomText fontSize={8} fontWeight="700" color="white">
              {quality}
            </CustomText>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[styles.content, { padding: spacing.sm }]}>
        <CustomText
          fontSize={variant === 'compact' ? 12 : 14}
          fontWeight="600"
          color={colors.text.primary}
          numberOfLines={variant === 'wide' ? 1 : 2}
          style={styles.title}
        >
          {cleanMovieTitle(title)}
        </CustomText>

        {size && (
          <CustomText
            fontSize={10}
            fontWeight="400"
            color={colors.text.secondary}
            style={{ marginTop: spacing.xs }}
          >
            {size}
          </CustomText>
        )}

        {/* Action Buttons */}
        {(onDownload || onShare) && variant !== 'compact' && (
          <View style={[styles.actions, { marginTop: spacing.sm }]}>
            {onDownload && (
              <TouchableOpacity
                onPress={onDownload}
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.interactive.primary },
                ]}
              >
                <Icon name="download" size="xs" color="white" />
              </TouchableOpacity>
            )}
            {onShare && (
              <TouchableOpacity
                onPress={onShare}
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.interactive.secondary,
                    marginLeft: spacing.xs,
                  },
                ]}
              >
                <Icon name="share" size="xs" color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  thumbnailContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  downloadedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(VideoCard);
export type { VideoCardProps };
