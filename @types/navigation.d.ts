import { NavigatorScreenParams } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { VideoResponse, VideoMetadata, UserInfo } from '../src/types/api';

export type MainParamsList = {
  Home: undefined;
  Splash: undefined;
  Loader: undefined;
  Onboarding: undefined;
  dashboard: undefined;
  Register: undefined;
  SignIn: undefined;
  ConfirmEmail: { email: string; userId: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  PhoneVerification: { phoneNumber: string; userId?: string };
  VerificationSuccessful: undefined;
  Success: { message: string; redirectTo?: keyof MainParamsList };
  PlayVideos: { item: VideoResponse };
  PlayDownloadedVideos: { movie: any };
  Download: {
    activeTab?: string;
    spredSelectionMode?: boolean;
    returnToSpred?: boolean;
  };
  CreatorDashboard: undefined;
  Notifications: undefined;
  Settings: undefined;
  Help: undefined;
  Search: { query?: string; category?: string };
  Shorts: undefined;
  Upload: undefined;
  LiveStream: undefined;
  ChannelManager: undefined;
  LiveCategory: undefined;
  CategoryScreen: undefined;
  Account: { userInfo?: UserInfo };
  SpredWallet: { userInfo?: UserInfo };
  Deposit: { amount?: number; currency?: string };
  CreatorProfile: { creatorName: string; creatorId: string };
  DownloadManager: undefined;
  VideoPlayerTest: undefined;
};

export type ApplicationStackParamList = {
  Startup: undefined;
  Main: NavigatorScreenParams<MainParamsList>;
};

export type ApplicationScreenProps =
  StackScreenProps<ApplicationStackParamList>;
