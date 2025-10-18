/**
 * API Types
 * Comprehensive type definitions for API interactions
 */

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

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retryAttempts: number;
  retryDelay: number;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ApiHeaders {
  'Content-Type'?: string;
  'Authorization'?: string;
  'mobileAppByPassIVAndKey'?: string;
  username?: string;
  password?: string;
  [key: string]: string | undefined;
}

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

export interface Category {
  _ID: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export interface ContentType {
  _ID: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface DownloadRequest {
  contentId: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: 'mp4' | 'mkv' | 'avi';
}

export interface DownloadResponse {
  downloadUrl: string;
  expiresAt: string;
  fileSize: number;
  estimatedTime: number;
}

export interface P2PTransfer {
  id: string;
  senderId: string;
  receiverId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'pending' | 'transferring' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
}

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'promotion' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'download' | 'share' | 'security' | 'performance' | 'update' | 'social';
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  imageUrl?: string;
  data?: Record<string, any>;
}