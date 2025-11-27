import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  benefits: string[];
}

interface FeatureHighlightsProps {
  visible?: boolean;
  onClose?: () => void;
}

const FeatureHighlights: React.FC<FeatureHighlightsProps> = ({
  visible = true,
  onClose,
}) => {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const features: Feature[] = [
    {
      id: 'p2p-sharing',
      title: 'P2P Video Sharing',
      description:
        'Share videos directly between devices without using internet or data.',
      icon: 'share',
      color: '#F45303',
      benefits: [
        'No internet required',
        'Fast transfer speeds',
        'Secure direct connection',
        'Works offline',
      ],
    },
    {
      id: 'smart-downloads',
      title: 'Smart Download Manager',
      description:
        'Intelligent download system with background processing and optimization.',
      icon: 'download',
      color: '#4CAF50',
      benefits: [
        'Background downloads',
        'Priority queue system',
        'Automatic optimization',
        'Storage management',
      ],
    },
    {
      id: 'video-quality',
      title: 'Smart Video Quality',
      description:
        'Automatic video compression and quality optimization for the best experience.',
      icon: 'high-quality',
      color: '#2196F3',
      benefits: [
        'Multiple quality options',
        'Automatic compression',
        'Storage optimization',
        'Quality selection',
      ],
    },
    {
      id: 'wifi-direct',
      title: 'Wi-Fi Direct',
      description:
        'Connect directly with nearby devices using Wi-Fi Direct technology.',
      icon: 'wifi',
      color: '#FF9800',
      benefits: [
        'Cross-platform support',
        'High-speed transfers',
        'No router needed',
        'Secure connections',
      ],
    },
    {
      id: 'qr-sharing',
      title: 'QR Code Sharing',
      description:
        'Quick and easy device pairing using QR codes for instant connections.',
      icon: 'qr-code',
      color: '#9C27B0',
      benefits: [
        'Quick pairing',
        'No manual setup',
        'Secure connections',
        'Easy to use',
      ],
    },
    {
      id: 'floating-action',
      title: 'Floating Action Button',
      description: 'Quick access to sharing features from anywhere in the app.',
      icon: 'touch-app',
      color: '#E91E63',
      benefits: [
        'Always accessible',
        'Quick sharing',
        'Beautiful animations',
        'Intuitive design',
      ],
    },
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleFeatureSelect = (index: number) => {
    setSelectedFeature(index);
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>SPRED Features</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feature Grid */}
        <View style={styles.featureGrid}>
          {features.map((feature, index) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                selectedFeature === index && styles.selectedFeature,
                { borderColor: feature.color },
              ]}
              onPress={() => handleFeatureSelect(index)}
            >
              <View
                style={[styles.featureIcon, { backgroundColor: feature.color }]}
              >
                <MaterialIcons name={feature.icon} size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Selected Feature Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <View
              style={[
                styles.detailsIcon,
                { backgroundColor: features[selectedFeature].color },
              ]}
            >
              <MaterialIcons
                name={features[selectedFeature].icon}
                size={32}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.detailsText}>
              <Text style={styles.detailsTitle}>
                {features[selectedFeature].title}
              </Text>
              <Text style={styles.detailsDescription}>
                {features[selectedFeature].description}
              </Text>
            </View>
          </View>

          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Key Benefits:</Text>
            {features[selectedFeature].benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={features[selectedFeature].color}
                />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: (width - 60) / 2,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedFeature: {
    borderColor: '#F45303',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailsText: {
    flex: 1,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  detailsDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    lineHeight: 24,
  },
  benefitsContainer: {
    marginTop: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#CCCCCC',
    marginLeft: 12,
    flex: 1,
  },
});

export default FeatureHighlights;
