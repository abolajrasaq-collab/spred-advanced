import {
  BaseQueryFn,
  FetchArgs,
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { Alert } from 'react-native';

// Validate required environment variables
const API_URL = process.env.API_URL;
if (!API_URL) {
  // DISABLED FOR PERFORMANCE
  // console.log('API_URL environment variable is not defined');
  Alert.alert('Configuration Error', 'API_URL is not configured properly');
}

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL || 'https://www.spred.cc/api',
  prepareHeaders: headers => {
    // Add custom headers from environment variables
    if (process.env.CUSTOM_HEADER_MOBILE_APP_PASS) {
      headers.set(
        'mobileAppByPassIVAndKey',
        process.env.CUSTOM_HEADER_MOBILE_APP_PASS,
      );
    }
    if (process.env.CUSTOM_HEADER_USERNAME) {
      headers.set('username', process.env.CUSTOM_HEADER_USERNAME);
    }
    if (process.env.CUSTOM_HEADER_PASSWORD) {
      headers.set('password', process.env.CUSTOM_HEADER_PASSWORD);
    }
    return headers;
  },
});

const baseQueryWithInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error) {
    const { status, data } = result.error as any;

    switch (status) {
      case 401:
        // Handle unauthorized access
        // DISABLED FOR PERFORMANCE
        // console.log('Unauthorized access - token may be expired');
        // TODO: Implement token refresh logic here
        // TODO: Navigate to login screen if needed
        break;
      case 403:
        // DISABLED FOR PERFORMANCE
        // console.log('Forbidden access');
        Alert.alert(
          'Access Denied',
          'You do not have permission to access this resource',
        );
        break;
      case 404:
        // DISABLED FOR PERFORMANCE
        // console.log('Resource not found');
        break;
      case 500:
        // DISABLED FOR PERFORMANCE
        // console.log('Server error');
        Alert.alert(
          'Server Error',
          'Something went wrong on our end. Please try again later.',
        );
        break;
      case 'FETCH_ERROR':
      case 'NETWORK_ERROR':
        // DISABLED FOR PERFORMANCE
        // console.log('Network error');
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.',
        );
        break;
      default:
        // DISABLED FOR PERFORMANCE
        // console.log('API Error:', result.error);
        if (data?.message) {
          Alert.alert('Error', data.message);
        }
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithInterceptor,
  endpoints: () => ({}),
  tagTypes: ['User', 'Video', 'Download', 'Following'],
});

// Export the API instance for use in other services
export { api as spredApi };
