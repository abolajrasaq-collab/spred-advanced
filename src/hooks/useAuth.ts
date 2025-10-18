import { useSelector, useDispatch } from 'react-redux';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  refreshToken,
  clearError,
  selectUser,
  selectToken,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
} from '../store/auth';
import { UserInfo } from '../types/api';
import logger from '../utils/logger';

/**
 * Custom hook for authentication operations
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const login = async (email: string, password: string) => {
    try {
      logger.userAction('login_attempt', { email }, 'Auth');
      dispatch(loginStart());

      // Here you would typically make an API call
      // For now, we'll simulate a successful login
      const mockUser: UserInfo = {
        id: '1',
        name: 'Test User',
        email,
        avatar: 'https://example.com/avatar.jpg',
        walletBalance: 0,
        token: 'mock_token',
        refreshToken: 'mock_refresh_token',
        account_Reference: 'ACC_001',
        phoneNumber: '+1234567890',
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dispatch(
        loginSuccess({
          user: mockUser,
          token: 'mock_token',
          refreshToken: 'mock_refresh_token',
        }),
      );

      logger.userAction('login_success', { userId: mockUser.id }, 'Auth');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      logger.error('login_error', err as Error, 'Auth');
      dispatch(loginFailure(errorMessage));
    }
  };

  const logoutUser = () => {
    logger.userAction('logout', { userId: user?.id }, 'Auth');
    dispatch(logout());
  };

  const updateUserInfo = (updates: Partial<UserInfo>) => {
    dispatch(updateUser(updates));
    logger.info('user_updated', updates, 'Auth');
  };

  const refreshUserToken = (newToken: string, newRefreshToken: string) => {
    dispatch(refreshToken({ token: newToken, refreshToken: newRefreshToken }));
    logger.info('token_refreshed', { hasToken: !!newToken }, 'Auth');
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  return {
    // State
    user,
    token,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    logout: logoutUser,
    updateUser: updateUserInfo,
    refreshToken: refreshUserToken,
    clearError: clearAuthError,

    // Computed values
    isLoggedIn: isAuthenticated && !!user,
    hasError: !!error,
  };
};

export default useAuth;
