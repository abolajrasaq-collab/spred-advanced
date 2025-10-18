import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../../components/Icon/Icon';
import { useThemeColors } from '../../theme/ThemeProvider';
import CustomText from '../../components/CustomText/CustomText';
import CustomButton from '../../components/CustomButton/CustomButton';import DocumentPicker from 'react-native-document-picker';
import ImagePicker from 'react-native-image-picker';



// Types
interface VideoFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
}

interface UploadFormData {
  title: string;
  description: string;
  tags: string;
  category: string;
  visibility: 'public' | 'private';
}

// Redesigned Upload Screen
const UploadRedesigned: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // State
  const [step, setStep] = useState<'select' | 'details' | 'preview' | 'upload'>(
    'select',
  );
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    tags: '',
    category: '',
    visibility: 'public',
  });

  // Categories
  const categories = [
    { id: '1', name: 'Action', icon: 'fire', color: '#F45303' },
    { id: '2', name: 'Comedy', icon: 'smile', color: '#D69E2E' },
    { id: '3', name: 'Drama', icon: 'heart', color: '#FF5722' },
    { id: '4', name: 'Horror', icon: 'eye', color: '#8B8B8B' },
    { id: '5', name: 'Romance', icon: 'heart', color: '#FF5722' },
    { id: '6', name: 'Thriller', icon: 'trending-up', color: '#4CAF50' },
    { id: '7', name: 'Documentary', icon: 'book', color: '#2196F3' },
    { id: '8', name: 'Sci-Fi', icon: 'rocket', color: '#FF9800' },
    { id: '9', name: 'Originals', icon: 'crown', color: '#F45303' },
    { id: '10', name: 'Nollywood', icon: 'videocam', color: '#F45303' },
  ];

  // Animation effect
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // File selection
  const selectVideo = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.video],
      });

      const videoFile: VideoFile = {
        uri: result.uri || '',
        name: result.name || 'Untitled Video',
        type: result.type || 'video/mp4',
        size: result.size || 0,
      };

      setSelectedFile(videoFile);
      setFormData(prev => ({
        ...prev,
        title: videoFile.name.replace(/\.[^/.]+$/, ''),
      }));

      // Move to details step
      setStep('details');
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to select video');
      }
    }
  };

  // Thumbnail selection
  const selectThumbnail = () => {
    const options = {
      mediaType: 'photo' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    ImagePicker.launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        // Handle cancellation or error
      } else if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setThumbnail(asset.uri || '');
      }
    });
  };

  // Form handling
  const handleInputChange = (field: keyof UploadFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Category selection
  const selectCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId,
    }));
  };

  // Visibility change
  const changeVisibility = (visibility: 'public' | 'private') => {
    setFormData(prev => ({
      ...prev,
      visibility,
    }));
  };

  // Submit upload
  const submitUpload = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }

    if (!formData.category) {
      Alert.alert('Validation Error', 'Please select a category');
      return;
    }

    setStep('upload');
    simulateUpload();
  };

  // Simulate upload progress
  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          // Show success
          Alert.alert(
            'Upload Complete',
            'Your video has been uploaded successfully!',
            [
              {
                text: 'View Video',
                onPress: () => navigation.navigate('PlayVideos'),
              },
              { text: 'Upload Another', onPress: resetForm },
            ],
          );
          return 100;
        }
        return newProgress;
      });
    }, 200);
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setThumbnail(null);
    setUploadProgress(0);
    setIsUploading(false);
    setFormData({
      title: '',
      description: '',
      tags: '',
      category: '',
      visibility: 'public',
    });
    setStep('select');
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <Animated.View
            style={[
              styles.stepContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <CustomText
              fontSize={24}
              fontWeight="700"
              color={colors.textPrimary}
              style={styles.title}
            >
              Upload Your Video
            </CustomText>
            <CustomText
              fontSize={16}
              color={colors.textSecondary}
              style={styles.subtitle}
            >
              Share your content with the SPRED community
            </CustomText>

            <TouchableOpacity style={styles.uploadCard} onPress={selectVideo}>
              <View style={styles.uploadIconContainer}>
                <Icon name="cloud-upload" size={48} color="#F45303" />
              </View>
              <CustomText
                fontSize={18}
                fontWeight="600"
                color={colors.textPrimary}
                style={styles.uploadText}
              >
                Select Video File
              </CustomText>
              <CustomText
                fontSize={14}
                color={colors.textSecondary}
                style={styles.uploadHint}
              >
                Tap to choose from your device
              </CustomText>
              <CustomText
                fontSize={12}
                color={colors.textSecondary}
                style={styles.uploadHint}
              >
                MP4, MOV, AVI (Max 2GB)
              </CustomText>
            </TouchableOpacity>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <Icon name="checkcircle" size={16} color="#4CAF50" />
                <CustomText
                  fontSize={14}
                  color={colors.textPrimary}
                  style={styles.featureText}
                >
                  High-quality streaming
                </CustomText>
              </View>
              <View style={styles.featureItem}>
                <Icon name="checkcircle" size={16} color="#4CAF50" />
                <CustomText
                  fontSize={14}
                  color={colors.textPrimary}
                  style={styles.featureText}
                >
                  Global distribution
                </CustomText>
              </View>
              <View style={styles.featureItem}>
                <Icon name="checkcircle" size={16} color="#4CAF50" />
                <CustomText
                  fontSize={14}
                  color={colors.textPrimary}
                  style={styles.featureText}
                >
                  Monetization opportunities
                </CustomText>
              </View>
            </View>
          </Animated.View>
        );

      case 'details':
        return (
          <Animated.View
            style={[
              styles.stepContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => setStep('select')}>
                <Icon name="arrow-left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <CustomText
                fontSize={20}
                fontWeight="600"
                color={colors.textPrimary}
              >
                Video Details
              </CustomText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Thumbnail Section */}
              <View style={styles.section}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.textPrimary}
                  style={styles.sectionTitle}
                >
                  Thumbnail
                </CustomText>
                <TouchableOpacity
                  style={styles.thumbnailContainer}
                  onPress={selectThumbnail}
                >
                  {thumbnail ? (
                    <Image
                      source={{ uri: thumbnail }}
                      style={styles.thumbnail}
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Icon
                        name="image"
                        size={32}
                        color={colors.textSecondary}
                      />
                      <CustomText
                        fontSize={14}
                        color={colors.textSecondary}
                        style={styles.thumbnailText}
                      >
                        Add Thumbnail
                      </CustomText>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={styles.section}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.textPrimary}
                  style={styles.sectionTitle}
                >
                  Title *
                </CustomText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Enter video title"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.title}
                  onChangeText={text => handleInputChange('title', text)}
                  maxLength={100}
                />
                <CustomText
                  fontSize={12}
                  color={colors.textSecondary}
                  style={styles.charCount}
                >
                  {formData.title.length}/100
                </CustomText>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.textPrimary}
                  style={styles.sectionTitle}
                >
                  Description
                </CustomText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Tell viewers about your video"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.description}
                  onChangeText={text => handleInputChange('description', text)}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Category */}
              <View style={styles.section}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.textPrimary}
                  style={styles.sectionTitle}
                >
                  Category *
                </CustomText>
                <View style={styles.categoriesGrid}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        formData.category === category.id && {
                          backgroundColor: '#F45303',
                        },
                        {
                          backgroundColor: colors.surface,
                          borderColor:
                            formData.category === category.id
                              ? '#F45303'
                              : colors.border,
                        },
                      ]}
                      onPress={() => selectCategory(category.id)}
                    >
                      <Icon
                        name={category.icon}
                        size={16}
                        color={
                          formData.category === category.id
                            ? '#FFFFFF'
                            : colors.textSecondary
                        }
                      />
                      <CustomText
                        fontSize={12}
                        fontWeight="500"
                        color={
                          formData.category === category.id
                            ? '#FFFFFF'
                            : colors.textPrimary
                        }
                      >
                        {category.name}
                      </CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tags */}
              <View style={styles.section}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.textPrimary}
                  style={styles.sectionTitle}
                >
                  Tags
                </CustomText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.textPrimary,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="Add tags (comma separated)"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.tags}
                  onChangeText={text => handleInputChange('tags', text)}
                />
                <CustomText
                  fontSize={12}
                  color={colors.textSecondary}
                  style={styles.helperText}
                >
                  Help viewers find your video
                </CustomText>
              </View>

              {/* Visibility */}
              <View style={styles.section}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.textPrimary}
                  style={styles.sectionTitle}
                >
                  Visibility
                </CustomText>
                <View style={styles.visibilityOptions}>
                  <TouchableOpacity
                    style={[
                      styles.visibilityOption,
                      formData.visibility === 'public' && {
                        backgroundColor: '#F45303',
                      },
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          formData.visibility === 'public'
                            ? '#F45303'
                            : colors.border,
                      },
                    ]}
                    onPress={() => changeVisibility('public')}
                  >
                    <Icon
                      name="public"
                      size={16}
                      color={
                        formData.visibility === 'public'
                          ? '#FFFFFF'
                          : colors.textSecondary
                      }
                    />
                    <CustomText
                      fontSize={14}
                      fontWeight="500"
                      color={
                        formData.visibility === 'public'
                          ? '#FFFFFF'
                          : colors.textPrimary
                      }
                    >
                      Public
                    </CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.visibilityOption,
                      formData.visibility === 'private' && {
                        backgroundColor: '#F45303',
                      },
                      {
                        backgroundColor: colors.surface,
                        borderColor:
                          formData.visibility === 'private'
                            ? '#F45303'
                            : colors.border,
                      },
                    ]}
                    onPress={() => changeVisibility('private')}
                  >
                    <Icon
                      name="lock"
                      size={16}
                      color={
                        formData.visibility === 'private'
                          ? '#FFFFFF'
                          : colors.textSecondary
                      }
                    />
                    <CustomText
                      fontSize={14}
                      fontWeight="500"
                      color={
                        formData.visibility === 'private'
                          ? '#FFFFFF'
                          : colors.textPrimary
                      }
                    >
                      Private
                    </CustomText>
                  </TouchableOpacity>
                </View>
              </View>

              <CustomButton
                title="Continue"
                onPress={() => setStep('preview')}
                style={styles.continueButton}
              />
            </ScrollView>
          </Animated.View>
        );

      case 'preview':
        return (
          <Animated.View
            style={[
              styles.stepContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.stepHeader}>
              <TouchableOpacity onPress={() => setStep('details')}>
                <Icon name="arrow-left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <CustomText
                fontSize={20}
                fontWeight="600"
                color={colors.textPrimary}
              >
                Preview
              </CustomText>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Video Preview */}
              <View style={styles.previewCard}>
                {thumbnail ? (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.previewThumbnail}
                  />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Icon
                      name="videocam"
                      size={48}
                      color={colors.textSecondary}
                    />
                  </View>
                )}

                <CustomText
                  fontSize={18}
                  fontWeight="700"
                  color={colors.textPrimary}
                  style={styles.previewTitle}
                >
                  {formData.title || 'Untitled Video'}
                </CustomText>

                <View style={styles.previewInfo}>
                  <CustomText fontSize={14} color={colors.textSecondary}>
                    {selectedFile ? formatFileSize(selectedFile.size) : '0 MB'}
                  </CustomText>
                  <CustomText fontSize={14} color={colors.textSecondary}>
                    •
                  </CustomText>
                  <CustomText fontSize={14} color={colors.textSecondary}>
                    {categories.find(c => c.id === formData.category)?.name ||
                      'Uncategorized'}
                  </CustomText>
                </View>
              </View>

              {/* Details Preview */}
              <View style={styles.detailsPreview}>
                <View style={styles.detailRow}>
                  <CustomText
                    fontSize={14}
                    fontWeight="600"
                    color={colors.textPrimary}
                  >
                    Description:
                  </CustomText>
                  <CustomText
                    fontSize={14}
                    color={colors.textSecondary}
                    style={styles.detailValue}
                  >
                    {formData.description || 'No description provided'}
                  </CustomText>
                </View>

                <View style={styles.detailRow}>
                  <CustomText
                    fontSize={14}
                    fontWeight="600"
                    color={colors.textPrimary}
                  >
                    Tags:
                  </CustomText>
                  <CustomText
                    fontSize={14}
                    color={colors.textSecondary}
                    style={styles.detailValue}
                  >
                    {formData.tags || 'No tags'}
                  </CustomText>
                </View>

                <View style={styles.detailRow}>
                  <CustomText
                    fontSize={14}
                    fontWeight="600"
                    color={colors.textPrimary}
                  >
                    Visibility:
                  </CustomText>
                  <CustomText
                    fontSize={14}
                    color={colors.textSecondary}
                    style={styles.detailValue}
                  >
                    {formData.visibility.charAt(0).toUpperCase() +
                      formData.visibility.slice(1)}
                  </CustomText>
                </View>
              </View>

              <View style={styles.previewActions}>
                <CustomButton
                  title="Back to Edit"
                  onPress={() => setStep('details')}
                  style={styles.secondaryButton}
                  textStyle={{ color: colors.textPrimary }}
                  buttonStyle={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  }}
                />

                <CustomButton
                  title="Upload Now"
                  onPress={submitUpload}
                  style={styles.primaryButton}
                />
              </View>
            </ScrollView>
          </Animated.View>
        );

      case 'upload':
        return (
          <Animated.View
            style={[
              styles.stepContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.uploadContainer}>
              <Icon name="cloud-upload" size={64} color="#F45303" />

              <CustomText
                fontSize={24}
                fontWeight="700"
                color={colors.textPrimary}
                style={styles.uploadTitle}
              >
                Uploading Your Video
              </CustomText>

              <CustomText
                fontSize={16}
                color={colors.textSecondary}
                style={styles.uploadSubtitle}
              >
                Please keep the app open
              </CustomText>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: `${uploadProgress}%`,
                        backgroundColor: '#F45303',
                      },
                    ]}
                  />
                </View>
                <CustomText
                  fontSize={14}
                  fontWeight="600"
                  color={colors.textPrimary}
                >
                  {uploadProgress}%
                </CustomText>
              </View>

              {isUploading ? (
                <CustomText
                  fontSize={14}
                  color={colors.textSecondary}
                  style={styles.uploadStatus}
                >
                  Uploading... {Math.round(uploadProgress)}% complete
                </CustomText>
              ) : (
                <View style={styles.uploadComplete}>
                  <Icon name="checkcircle" size={48} color="#4CAF50" />
                  <CustomText
                    fontSize={20}
                    fontWeight="700"
                    color="#4CAF50"
                    style={styles.successText}
                  >
                    Upload Complete!
                  </CustomText>
                </View>
              )}
            </View>
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <CustomText fontSize={20} fontWeight="600" color={colors.textPrimary}>
          Upload
        </CustomText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Indicator */}
      {step !== 'upload' && (
        <View
          style={[
            styles.progressIndicator,
            { backgroundColor: colors.surface },
          ]}
        >
          <View style={styles.progressSteps}>
            {['select', 'details', 'preview'].map((s, index) => (
              <React.Fragment key={s}>
                <View
                  style={[
                    styles.progressStep,
                    step === s && styles.activeStep,
                    { backgroundColor: step === s ? '#F45303' : colors.border },
                  ]}
                >
                  <CustomText
                    fontSize={12}
                    fontWeight="600"
                    color={step === s ? '#FFFFFF' : colors.textSecondary}
                  >
                    {index + 1}
                  </CustomText>
                </View>
                {index < 2 && (
                  <View
                    style={[
                      styles.progressLine,
                      step !== 'select' &&
                        index === 0 && { backgroundColor: '#F45303' },
                      step === 'preview' &&
                        index === 1 && { backgroundColor: '#F45303' },
                      { backgroundColor: colors.border },
                    ]}
                  />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepContent()}
      </ScrollView>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 24,
  },
  progressIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeStep: {
    backgroundColor: '#F45303',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
  },
  uploadCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F45303',
    borderStyle: 'dashed',
    marginBottom: 32,
  },
  uploadIconContainer: {
    marginBottom: 16,
  },
  uploadText: {
    marginBottom: 8,
  },
  uploadHint: {
    marginBottom: 4,
  },
  featureList: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    marginTop: 4,
  },
  thumbnailContainer: {
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
  },
  thumbnailText: {
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
  },
  continueButton: {
    marginTop: 24,
  },
  previewCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  previewThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  previewPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    marginBottom: 8,
  },
  previewInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsPreview: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailValue: {
    marginTop: 4,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 1,
  },
  uploadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  uploadTitle: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    marginBottom: 32,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  uploadStatus: {
    textAlign: 'center',
  },
  uploadComplete: {
    alignItems: 'center',
  },
  successText: {
    marginTop: 16,
  },
});

export default UploadRedesigned;

