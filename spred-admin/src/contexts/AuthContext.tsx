import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser, AdminRole, AdminPermission } from '../types/admin';
// import { apiService } from '../services/api'; // Commented out for mock auth

interface AuthContextType {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (permission: AdminPermission) => boolean;
  hasRole: (role: AdminRole) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        // Invalid stored user data
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Mock authentication for demo purposes
      // In production, this would call the real API
      const mockUsers: Record<string, { password: string; user: AdminUser }> = {
        'admin@spred.com': {
          password: 'admin123',
          user: {
            id: '1',
            email: 'admin@spred.com',
            name: 'Super Admin',
            role: AdminRole.SUPER_ADMIN,
            permissions: Object.values(AdminPermission),
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        'superadmin@spred.com': {
          password: 'super123',
          user: {
            id: '2',
            email: 'superadmin@spred.com',
            name: 'Super Admin',
            role: AdminRole.SUPER_ADMIN,
            permissions: Object.values(AdminPermission),
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        'content@spred.com': {
          password: 'content123',
          user: {
            id: '3',
            email: 'content@spred.com',
            name: 'Content Admin',
            role: AdminRole.CONTENT_ADMIN,
            permissions: [
              AdminPermission.CONTENT_READ,
              AdminPermission.CONTENT_WRITE,
              AdminPermission.CONTENT_DELETE,
              AdminPermission.CONTENT_MODERATE,
            ],
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        'useradmin@spred.com': {
          password: 'user123',
          user: {
            id: '4',
            email: 'useradmin@spred.com',
            name: 'User Admin',
            role: AdminRole.USER_ADMIN,
            permissions: [
              AdminPermission.USER_READ,
              AdminPermission.USER_WRITE,
              AdminPermission.USER_DELETE,
              AdminPermission.USER_SUSPEND,
            ],
            isActive: true,
            lastLogin: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockUser = mockUsers[email];
      if (!mockUser || mockUser.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Store token and user data
      const mockToken = `mock_token_${Date.now()}`;
      localStorage.setItem('admin_token', mockToken);
      localStorage.setItem('admin_user', JSON.stringify(mockUser.user));

      setUser(mockUser.user);

      // Uncomment below for real API call when backend is ready
      /*
      const response = await apiService.adminLogin(email, password);

      if (response.success && response.data) {
        const { token, user: userData } = response.data;

        // Store token and user data
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_user', JSON.stringify(userData));

        setUser(userData);
      } else {
        throw new Error(response.message || 'Login failed');
      }
      */

    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  const hasPermission = (permission: AdminPermission): boolean => {
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === AdminRole.SUPER_ADMIN) return true;

    return user.permissions.includes(permission);
  };

  const hasRole = (role: AdminRole): boolean => {
    return user?.role === role;
  };

  const isSuperAdmin = (): boolean => {
    return user?.role === AdminRole.SUPER_ADMIN;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    hasPermission,
    hasRole,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};