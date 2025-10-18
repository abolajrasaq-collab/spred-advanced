import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from '../../components/Icon/Icon';
import { useThemeColors } from '../../theme/ThemeProvider';
import CustomText from '../../components/CustomText/CustomText';
import CustomButton from '../../components/CustomButton/CustomButton';
import { getDataJson } from '../../helpers/api/Asyncstorage';

const { width: screenWidth } = Dimensions.get('window');

interface UploadFormData {
  title: string;
  description: string;
  tags: string;
  category: string;
  visibility: 'public' | 'private';
}

interface VideoFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
  thumbnail?: string;
}

interface PosterFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const Upload: React.FC = () => {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();

  const [uploadType, setUploadType] = useState<'video' | 'shorts'>('video');
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [uploadProgress, _setUploadProgress] = useState(0);
  const [isUploading, _setIsUploading] = useState(false);
  const [showThumbnailPicker, setShowThumbnailPicker] = useState(false);
  const [generatedThumbnails, _setGeneratedThumbnails] = useState<string[]>([]);
  const [_userToken, setUserToken] = useState<string | null>(null);
  const [selectedPoster, _setSelectedPoster] = useState<PosterFile | null>(
    null,
  );
  const [showPosterOptions, setShowPosterOptions] = useState(false);

  const [formData, _setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    tags: '',
    category: '',
    visibility: 'public',
  });

  // SPRED Categories
  const categories: Category[] = [
    { id: '1', name: 'Action Movies', icon: 'fire', color: '#F45303' },
    { id: '2', name: 'Comedy', icon: 'star', color: '#D69E2E' },
    { id: '3', name: 'Drama', icon: 'heart', color: '#FF5722' },
    { id: '4', name: 'Horror', icon: 'eye', color: '#8B8B8B' },
    { id: '5', name: 'Romance', icon: 'heart', color: '#FF5722' },
    { id: '6', name: 'Thriller', icon: 'trending-up', color: '#4CAF50' },
    { id: '7', name: 'Documentary', icon: 'book', color: '#2196F3' },
    { id: '8', name: 'Sci-Fi', icon: 'rocket', color: '#FF9800' },
    { id: '9', name: 'TOP SPRED ORIGINALS', icon: 'crown', color: '#F45303' },
    { id: '10', name: 'Nollywood', icon: 'videocam', color: '#F45303' },
  ];

  // Get user token
  useEffect(() => {
    const getUserToken = async () => {
      try {
        const user = await getDataJson('User');
        setUserToken(user?.token || null);
      } catch (error) {
        // DISABLED FOR PERFORMANCE
        // console.log('Error getting user token:', error);
      }
    };
    getUserToken();
  }, []);

  const pickVideo = async () => {
    Alert.alert(
      'Demo Mode',
      'This is a demo screen. Video selection is disabled.',
    );
    return;
  };

  const selectThumbnail = (thumbnailUri: string) => {
    setThumbnail(thumbnailUri);
    setShowThumbnailPicker(false);
    if (selectedFile) {
      setSelectedFile({
        ...selectedFile,
        thumbnail: thumbnailUri,
      });
    }
  };

  const pickPosterFromGallery = () => {
    setShowPosterOptions(false);
    Alert.alert(
      'Demo Mode',
      'This is a demo screen. Poster selection is disabled.',
    );
  };

  const pickPosterFromCamera = () => {
    setShowPosterOptions(false);
    Alert.alert(
      'Demo Mode',
      'This is a demo screen. Camera functionality is disabled.',
    );
  };

  const removePoster = () => {
    Alert.alert(
      'Demo Mode',
      'This is a demo screen. Poster removal is disabled.',
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.legacy.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.legacy.surface }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.legacy.textPrimary} />
        </TouchableOpacity>
        <CustomText
          fontSize={20}
          fontWeight="600"
          color={colors.legacy.textPrimary}
        >
          Upload Demo
        </CustomText>
        <View style={styles.demoBadge}>
          <CustomText fontSize={12} fontWeight="600" color="#FFFFFF">
            DEMO
          </CustomText>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Upload Type Selection */}
        <View style={styles.uploadTypeContainer}>
          <CustomText
            fontSize={16}
            fontWeight="600"
            color={colors.legacy.textPrimary}
            style={styles.sectionTitle}
          >
            Upload Type
          </CustomText>
          <View style={styles.uploadTypeButtons}>
            <TouchableOpacity
              style={[
                styles.uploadTypeButton,
                uploadType === 'video' && [
                  styles.activeUploadType,
                  { backgroundColor: '#F45303' },
                ],
                { borderColor: colors.legacy.border },
              ]}
              onPress={() => setUploadType('video')}
            >
              <Icon
                name="videocam"
                size={20}
                color={
                  uploadType === 'video'
                    ? '#FFFFFF'
                    : colors.legacy.textSecondary
                }
              />
              <CustomText
                fontSize={14}
                fontWeight="500"
                color={
                  uploadType === 'video'
                    ? '#FFFFFF'
                    : colors.legacy.textSecondary
                }
              >
                Video
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.uploadTypeButton,
                uploadType === 'shorts' && [
                  styles.activeUploadType,
                  { backgroundColor: '#F45303' },
                ],
                { borderColor: colors.legacy.border },
              ]}
              onPress={() => setUploadType('shorts')}
            >
              <Icon
                name="video"
                size={20}
                color={
                  uploadType === 'shorts'
                    ? '#FFFFFF'
                    : colors.legacy.textSecondary
                }
              />
              <CustomText
                fontSize={14}
                fontWeight="500"
                color={
                  uploadType === 'shorts'
                    ? '#FFFFFF'
                    : colors.legacy.textSecondary
                }
              >
                SHORTS
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Live Stream Link */}
        <TouchableOpacity
          style={styles.addStreamLink}
          onPress={() => navigation.navigate('ChannelManager')}
          activeOpacity={0.7}
        >
          <Icon name="video" size={18} color="#F45303" />
          <CustomText
            fontSize={16}
            fontWeight="600"
            color="#F45303"
            style={{ marginLeft: 8 }}
          >
            Add Live Stream
          </CustomText>
          <Icon
            name="arrow-right"
            size={18}
            color="#F45303"
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>

        {/* Video Selection */}
        {!selectedFile ? (
          <TouchableOpacity
            style={[
              styles.videoPicker,
              {
                backgroundColor: colors.legacy.surface,
                borderColor: colors.legacy.border,
              },
            ]}
            onPress={pickVideo}
          >
            <Icon name="cloud-upload" size={48} color="#F45303" />
            <CustomText
              fontSize={18}
              fontWeight="600"
              color={colors.legacy.textPrimary}
              style={styles.pickVideoText}
            >
              Select Video
            </CustomText>
            <CustomText
              fontSize={14}
              color={colors.legacy.textSecondary}
              style={styles.videoInfoText}
            >
              Tap to choose a video from your device
            </CustomText>
            <CustomText
              fontSize={12}
              color={colors.legacy.textSecondary}
              style={styles.videoInfoText}
            >
              Supported formats: MP4, MOV, AVI (Max 2GB)
            </CustomText>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.selectedVideoContainer,
              { backgroundColor: colors.legacy.surface },
            ]}
          >
            <View style={styles.videoPreviewContainer}>
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.videoThumbnail}
                />
              ) : (
                <View
                  style={[
                    styles.videoPlaceholder,
                    { backgroundColor: colors.legacy.border },
                  ]}
                >
                  <Icon
                    name="videocam"
                    size={32}
                    color={colors.legacy.textSecondary}
                  />
                </View>
              )}
              <View style={styles.videoInfo}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.legacy.textPrimary}
                  numberOfLines={2}
                >
                  {selectedFile.name}
                </CustomText>
                <CustomText fontSize={14} color={colors.legacy.textSecondary}>
                  {formatFileSize(selectedFile.size)}
                  {selectedFile.duration &&
                    ` • ${formatDuration(selectedFile.duration)}`}
                </CustomText>
                <TouchableOpacity
                  style={styles.changeVideoButton}
                  onPress={() =>
                    Alert.alert(
                      'Demo Mode',
                      'This is a demo screen. Video change is disabled.',
                    )
                  }
                >
                  <CustomText fontSize={14} color="#F45303">
                    Change Video
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Thumbnail Selection */}
            <TouchableOpacity
              style={[
                styles.thumbnailButton,
                { backgroundColor: colors.legacy.border },
              ]}
              onPress={() =>
                Alert.alert(
                  'Demo Mode',
                  'This is a demo screen. Thumbnail generation is disabled.',
                )
              }
            >
              <Icon name="image" size={20} color={colors.legacy.textPrimary} />
              <CustomText fontSize={14} color={colors.legacy.textPrimary}>
                {thumbnail ? 'Change Thumbnail' : 'Generate Thumbnail'}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        {/* Film Poster Section */}
        <View style={styles.posterSection}>
          <CustomText
            fontSize={16}
            fontWeight="600"
            color={colors.legacy.textPrimary}
            style={styles.sectionTitle}
          >
            Film Poster
          </CustomText>
          <CustomText
            fontSize={14}
            color={colors.legacy.textSecondary}
            style={styles.sectionSubtitle}
          >
            Add a custom poster image for your video (optional)
          </CustomText>

          {!selectedPoster ? (
            <TouchableOpacity
              style={[
                styles.posterPicker,
                {
                  backgroundColor: colors.legacy.surface,
                  borderColor: colors.legacy.border,
                },
              ]}
              onPress={() =>
                Alert.alert(
                  'Demo Mode',
                  'This is a demo screen. Poster selection is disabled.',
                )
              }
            >
              <Icon name="pluscircleo" size={32} color="#F45303" />
              <CustomText
                fontSize={16}
                fontWeight="600"
                color={colors.legacy.textPrimary}
                style={styles.addPosterText}
              >
                Add Poster
              </CustomText>
              <CustomText
                fontSize={14}
                color={colors.legacy.textSecondary}
                style={styles.posterInfoText}
              >
                Choose from gallery or take a photo
              </CustomText>
              <CustomText
                fontSize={12}
                color={colors.legacy.textSecondary}
                style={styles.posterInfoText}
              >
                Recommended: 1280x720px, JPG/PNG
              </CustomText>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.selectedPosterContainer,
                { backgroundColor: colors.legacy.surface },
              ]}
            >
              <View style={styles.posterPreviewContainer}>
                <Image
                  source={{ uri: selectedPoster.uri }}
                  style={styles.posterPreview}
                />
                <View style={styles.posterInfoContainer}>
                  <CustomText
                    fontSize={16}
                    fontWeight="600"
                    color={colors.legacy.textPrimary}
                    numberOfLines={2}
                  >
                    {selectedPoster.name}
                  </CustomText>
                  <CustomText fontSize={14} color={colors.legacy.textSecondary}>
                    {formatFileSize(selectedPoster.size)}
                    {selectedPoster.width &&
                      selectedPoster.height &&
                      ` • ${selectedPoster.width}×${selectedPoster.height}`}
                  </CustomText>
                  <View style={styles.posterActions}>
                    <TouchableOpacity
                      style={styles.posterActionButton}
                      onPress={() =>
                        Alert.alert(
                          'Demo Mode',
                          'This is a demo screen. Poster change is disabled.',
                        )
                      }
                    >
                      <Icon name="edit" size={16} color="#F45303" />
                      <CustomText fontSize={14} color="#F45303">
                        Change
                      </CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.posterActionButton}
                      onPress={removePoster}
                    >
                      <Icon name="delete" size={16} color="#E53E3E" />
                      <CustomText fontSize={14} color="#E53E3E">
                        Remove
                      </CustomText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Video Details Form */}
        <View style={styles.formSection}>
          <CustomText
            fontSize={16}
            fontWeight="600"
            color={colors.legacy.textPrimary}
            style={styles.sectionTitle}
          >
            Video Details
          </CustomText>

          {/* Title */}
          <View style={styles.inputContainer}>
            <CustomText
              fontSize={14}
              fontWeight="500"
              color={colors.legacy.textPrimary}
              style={styles.inputLabel}
            >
              Title *
            </CustomText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.legacy.surface,
                  color: colors.legacy.textPrimary,
                  borderColor: colors.legacy.border,
                },
              ]}
              placeholder="Enter video title"
              placeholderTextColor={colors.legacy.textSecondary}
              value="Demo Video Title"
              editable={false}
              maxLength={100}
            />
            <CustomText
              fontSize={12}
              color={colors.legacy.textSecondary}
              style={styles.charCount}
            >
              {formData.title.length}/100
            </CustomText>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <CustomText
              fontSize={14}
              fontWeight="500"
              color={colors.legacy.textPrimary}
              style={styles.inputLabel}
            >
              Description
            </CustomText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.legacy.surface,
                  color: colors.legacy.textPrimary,
                  borderColor: colors.legacy.border,
                },
              ]}
              placeholder="Tell viewers about your video"
              placeholderTextColor={colors.legacy.textSecondary}
              value="This is a demo video description. In a real upload, you would describe your video content here."
              editable={false}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Category */}
          <View style={styles.inputContainer}>
            <CustomText
              fontSize={14}
              fontWeight="500"
              color={colors.legacy.textPrimary}
              style={styles.inputLabel}
            >
              Category *
            </CustomText>
            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    category.id === '1' && [
                      styles.selectedCategory,
                      { backgroundColor: '#F45303' },
                    ],
                    {
                      backgroundColor: colors.legacy.surface,
                      borderColor: colors.legacy.border,
                    },
                  ]}
                  onPress={() =>
                    Alert.alert(
                      'Demo Mode',
                      'This is a demo screen. Category selection is disabled.',
                    )
                  }
                >
                  <Icon
                    name={category.icon}
                    size={16}
                    color={
                      category.id === '1'
                        ? '#FFFFFF'
                        : colors.legacy.textSecondary
                    }
                  />
                  <CustomText
                    fontSize={12}
                    fontWeight="500"
                    color={
                      category.id === '1'
                        ? '#FFFFFF'
                        : colors.legacy.textPrimary
                    }
                    numberOfLines={1}
                  >
                    {category.name}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.inputContainer}>
            <CustomText
              fontSize={14}
              fontWeight="500"
              color={colors.legacy.textPrimary}
              style={styles.inputLabel}
            >
              Tags
            </CustomText>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.legacy.surface,
                  color: colors.legacy.textPrimary,
                  borderColor: colors.legacy.border,
                },
              ]}
              placeholder="Add tags (comma separated)"
              placeholderTextColor={colors.legacy.textSecondary}
              value="demo, video, spred"
              editable={false}
            />
            <CustomText
              fontSize={12}
              color={colors.legacy.textSecondary}
              style={styles.helperText}
            >
              Help viewers find your video by adding relevant tags
            </CustomText>
          </View>

          {/* Visibility */}
          <View style={styles.inputContainer}>
            <CustomText
              fontSize={14}
              fontWeight="500"
              color={colors.legacy.textPrimary}
              style={styles.inputLabel}
            >
              Visibility
            </CustomText>
            <View style={styles.visibilityOptions}>
              {[
                { value: 'public', label: 'Public', icon: 'public' },
                { value: 'private', label: 'Private', icon: 'lock' },
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.visibilityOption,
                    formData.visibility === option.value && [
                      styles.selectedVisibility,
                      { backgroundColor: '#F45303' },
                    ],
                    {
                      backgroundColor: colors.legacy.surface,
                      borderColor: colors.legacy.border,
                    },
                  ]}
                  onPress={() =>
                    Alert.alert(
                      'Demo Mode',
                      'This is a demo screen. Visibility selection is disabled.',
                    )
                  }
                >
                  <Icon
                    name={option.icon}
                    size={16}
                    color={
                      formData.visibility === option.value
                        ? '#FFFFFF'
                        : colors.legacy.textSecondary
                    }
                  />
                  <CustomText
                    fontSize={14}
                    fontWeight="500"
                    color={
                      formData.visibility === option.value
                        ? '#FFFFFF'
                        : colors.legacy.textPrimary
                    }
                  >
                    {option.label}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Upload Button */}
        <CustomButton
          title="Demo Mode"
          onPress={() =>
            Alert.alert(
              'Demo Mode',
              'This is a demonstration of the upload interface. All features are disabled.',
            )
          }
          disabled={false}
          style={styles.uploadButton}
        />

        {/* Upload Progress */}
        {isUploading && (
          <View
            style={[
              styles.progressContainer,
              { backgroundColor: colors.legacy.surface },
            ]}
          >
            <CustomText
              fontSize={14}
              fontWeight="500"
              color={colors.legacy.textPrimary}
            >
              Upload Progress: {uploadProgress}%
            </CustomText>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: colors.legacy.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  styles.progressFillActive,
                  { width: `${uploadProgress}%` },
                ]}
              />
            </View>
            <CustomText fontSize={12} color={colors.legacy.textSecondary}>
              Please keep the app open while uploading
            </CustomText>
          </View>
        )}
      </ScrollView>

      {/* Thumbnail Picker Modal */}
      <Modal
        visible={showThumbnailPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.legacy.background },
          ]}
        >
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: colors.legacy.surface },
            ]}
          >
            <TouchableOpacity onPress={() => setShowThumbnailPicker(false)}>
              <Icon name="close" size={24} color={colors.legacy.textPrimary} />
            </TouchableOpacity>
            <CustomText
              fontSize={18}
              fontWeight="600"
              color={colors.legacy.textPrimary}
            >
              Choose Thumbnail
            </CustomText>
            <View style={styles.modalHeaderRight} />
          </View>

          <ScrollView style={styles.thumbnailsContainer}>
            {generatedThumbnails.map((thumbUri, index) => (
              <TouchableOpacity
                key={index}
                style={styles.thumbnailOption}
                onPress={() => selectThumbnail(thumbUri)}
              >
                <Image
                  source={{ uri: thumbUri }}
                  style={styles.thumbnailImage}
                />
                <CustomText
                  fontSize={12}
                  color={colors.legacy.textSecondary}
                  style={styles.thumbnailTime}
                >
                  {index + 1}s
                </CustomText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Poster Options Modal */}
      <Modal visible={showPosterOptions} animationType="slide" transparent>
        <View style={[styles.modalOverlay, styles.modalOverlayBackground]}>
          <View
            style={[
              styles.posterOptionsModal,
              { backgroundColor: colors.legacy.surface },
            ]}
          >
            <View style={styles.posterOptionsHeader}>
              <CustomText
                fontSize={18}
                fontWeight="600"
                color={colors.legacy.textPrimary}
              >
                Add Poster
              </CustomText>
              <TouchableOpacity onPress={() => setShowPosterOptions(false)}>
                <Icon
                  name="close"
                  size={24}
                  color={colors.legacy.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.posterOptionButton,
                { backgroundColor: colors.legacy.border },
              ]}
              onPress={pickPosterFromGallery}
            >
              <Icon
                name="picture"
                size={24}
                color={colors.legacy.textPrimary}
              />
              <View style={styles.posterOptionText}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.legacy.textPrimary}
                >
                  Choose from Gallery
                </CustomText>
                <CustomText fontSize={14} color={colors.legacy.textSecondary}>
                  Select an image from your photo library
                </CustomText>
              </View>
              <Icon
                name="arrow-right"
                size={20}
                color={colors.legacy.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.posterOptionButton,
                { backgroundColor: colors.legacy.border },
              ]}
              onPress={pickPosterFromCamera}
            >
              <Icon name="camera" size={24} color={colors.legacy.textPrimary} />
              <View style={styles.posterOptionText}>
                <CustomText
                  fontSize={16}
                  fontWeight="600"
                  color={colors.legacy.textPrimary}
                >
                  Take Photo
                </CustomText>
                <CustomText fontSize={14} color={colors.legacy.textSecondary}>
                  Use camera to capture a new poster
                </CustomText>
              </View>
              <Icon
                name="arrow-right"
                size={20}
                color={colors.legacy.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: colors.legacy.border },
              ]}
              onPress={() => setShowPosterOptions(false)}
            >
              <CustomText
                fontSize={16}
                fontWeight="600"
                color={colors.legacy.textSecondary}
              >
                Cancel
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  headerRight: {
    width: 40,
  },
  demoBadge: {
    backgroundColor: '#F45303',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadTypeContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  uploadTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  activeUploadType: {
    // Active state handled inline
  },
  videoPicker: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  pickVideoText: {
    marginTop: 16,
    marginBottom: 8,
  },
  videoInfoText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedVideoContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  videoPreviewContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  videoThumbnail: {
    width: 120,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  videoPlaceholder: {
    width: 120,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  changeVideoButton: {
    marginTop: 8,
  },
  thumbnailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  selectedCategory: {
    // Selected state handled inline
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  selectedVisibility: {
    // Selected state handled inline
  },
  uploadButton: {
    marginBottom: 16,
  },
  progressContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginVertical: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressFillActive: {
    backgroundColor: '#F45303',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  modalHeaderRight: {
    width: 40,
  },
  thumbnailsContainer: {
    flex: 1,
    padding: 16,
  },
  thumbnailOption: {
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnailImage: {
    width: screenWidth - 32,
    height: ((screenWidth - 32) * 9) / 16,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  thumbnailTime: {
    marginTop: 8,
  },
  posterSection: {
    marginBottom: 24,
  },
  sectionSubtitle: {
    marginBottom: 16,
    opacity: 0.8,
  },
  posterPicker: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  addPosterText: {
    marginTop: 16,
    marginBottom: 8,
  },
  posterInfoText: {
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedPosterContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  posterPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  posterPreview: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
  },
  posterInfoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  posterActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  posterActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  posterOptionsModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  posterOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  posterOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  posterOptionText: {
    flex: 1,
    marginLeft: 16,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  addStreamLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F45303',
  },
});

export default Upload;
