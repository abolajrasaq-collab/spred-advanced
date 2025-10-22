/**
 * Admin Panel Type Definitions
 * Comprehensive type definitions for the Spred Admin Control Panel
 */

// Admin User Roles and Permissions
export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  CONTENT_ADMIN = 'content_admin',
  USER_ADMIN = 'user_admin',
  ANALYTICS_ADMIN = 'analytics_admin',
  SUPPORT_ADMIN = 'support_admin',
}

export enum AdminPermission {
  // Content Management
  CONTENT_READ = 'content:read',
  CONTENT_WRITE = 'content:write',
  CONTENT_DELETE = 'content:delete',
  CONTENT_MODERATE = 'content:moderate',

  // User Management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_SUSPEND = 'user:suspend',

  // Analytics
  ANALYTICS_READ = 'analytics:read',
  ANALYTICS_EXPORT = 'analytics:export',

  // Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_WRITE = 'settings:write',

  // Admin Management
  ADMIN_READ = 'admin:read',
  ADMIN_WRITE = 'admin:write',
  ADMIN_DELETE = 'admin:delete',
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermission[];
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard Metrics
export interface DashboardMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
  };
  users: {
    total: number;
    active: number;
    premium: number;
    growth: number;
  };
  content: {
    totalVideos: number;
    totalViews: number;
    averageRating: number;
    topPerforming: VideoContent[];
  };
  technical: {
    apiResponseTime: number;
    errorRate: number;
    serverUptime: number;
  };
}

// Content Management Types
export interface AdminVideo extends VideoContent {
  status: 'pending' | 'approved' | 'rejected' | 'published';
  uploadedBy: string;
  uploadDate: Date;
  moderationNotes?: string;
  tags: string[];
  categories: string[];
  quality: VideoQuality[];
  fileSize: number;
  duration: number;
  views: number;
  likes: number;
  shares: number;
}

export interface Category {
  _ID: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  videoCount?: number;
}

export interface VideoQuality {
  id: string;
  name: string;
  resolution: string;
  bitrate: number;
  fileSize: number;
}

// User Management Types
export interface AdminUserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  status: 'active' | 'suspended' | 'banned';
  subscription: {
    type: 'free' | 'premium' | 'enterprise';
    expiresAt?: Date;
    autoRenew: boolean;
  };
  stats: {
    totalViews: number;
    totalDownloads: number;
    totalShares: number;
    joinDate: Date;
    lastActive: Date;
  };
  wallet: {
    balance: number;
    transactions: number;
  };
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// Analytics Types
export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  metrics: {
    users: UserAnalytics;
    content: ContentAnalytics;
    revenue: RevenueAnalytics;
    technical: TechnicalAnalytics;
  };
}

export interface UserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  premiumUsers: number;
  userRetention: number;
  averageSessionTime: number;
  topLocations: LocationData[];
  deviceStats: DeviceStats[];
}

export interface ContentAnalytics {
  totalVideos: number;
  totalViews: number;
  totalDownloads: number;
  topVideos: VideoPerformance[];
  categoryPerformance: CategoryPerformance[];
  uploadTrends: UploadTrend[];
}

export interface RevenueAnalytics {
  totalRevenue: number;
  subscriptionRevenue: number;
  downloadRevenue: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
  lifetimeValue: number;
}

export interface TechnicalAnalytics {
  apiResponseTime: number;
  errorRate: number;
  serverUptime: number;
  bandwidthUsage: number;
  storageUsage: number;
}

// Supporting Types
export interface LocationData {
  country: string;
  region: string;
  count: number;
  percentage: number;
}

export interface DeviceStats {
  platform: 'ios' | 'android' | 'web';
  version: string;
  count: number;
  percentage: number;
}

export interface VideoPerformance {
  videoId: string;
  title: string;
  views: number;
  downloads: number;
  shares: number;
  rating: number;
  revenue: number;
}

export interface CategoryPerformance {
  categoryId: string;
  name: string;
  videoCount: number;
  totalViews: number;
  averageRating: number;
}

export interface UploadTrend {
  date: string;
  uploads: number;
  views: number;
  downloads: number;
}

// Settings Types
export interface SystemSettings {
  general: {
    siteName: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    supportEmail: string;
  };
  content: {
    maxFileSize: number;
    allowedFormats: string[];
    autoModeration: boolean;
    qualitySettings: VideoQuality[];
    compressionEnabled: boolean;
  };
  payment: {
    stripeEnabled: boolean;
    paypalEnabled: boolean;
    subscriptionPlans: SubscriptionPlan[];
    currency: string;
  };
  security: {
    passwordPolicy: PasswordPolicy;
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    smsEnabled: boolean;
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  isActive: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface VideoUploadForm {
  title: string;
  description: string;
  category: string;
  tags: string[];
  file: File;
  thumbnail?: File;
  isPremium: boolean;
}

export interface UserEditForm {
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'banned';
  subscriptionType: 'free' | 'premium' | 'enterprise';
  balance: number;
}

// Table and Filter Types
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableFilters {
  search?: string;
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  category?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

// Video Content (from existing API)
export interface VideoContent {
  _ID: string;
  title: string;
  categoryId: string;
  thumbnailUrl: string;
  videoUrl?: string;
  duration?: number;
  rating?: number;
  year?: string;
  isLive?: boolean;
  isPremium?: boolean;
  isTrending?: boolean;
  views?: number;
  createdAt?: string;
  releaseDate?: string;
  contentTypeId?: string;
  description?: string;
  tags?: string[];
}