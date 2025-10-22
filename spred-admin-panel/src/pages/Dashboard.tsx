import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Video,
  TrendingUp,
  DollarSign,
  Activity,
  Server,
  Eye,
  Star
} from 'lucide-react';
import { apiService } from '../services/api';

const Dashboard: React.FC = () => {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: () => apiService.getDashboardMetrics(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Failed to load dashboard metrics. Using fallback data.</p>
      </div>
    );
  }

  const data = metrics?.data;

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${data?.revenue?.today?.toLocaleString() || '0'}`,
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Total Users',
      value: data?.users?.total?.toLocaleString() || '0',
      change: `+${data?.users?.growth || 0}%`,
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Total Videos',
      value: data?.content?.totalVideos?.toLocaleString() || '0',
      change: '+8.2%',
      changeType: 'positive',
      icon: Video,
    },
    {
      name: 'Total Views',
      value: data?.content?.totalViews?.toLocaleString() || '0',
      change: '+15.3%',
      changeType: 'positive',
      icon: Eye,
    },
  ];

  const performanceMetrics = [
    {
      name: 'API Response Time',
      value: `${data?.technical?.apiResponseTime || 0}ms`,
      status: (data?.technical?.apiResponseTime || 0) < 200 ? 'good' : 'warning',
      icon: Activity,
    },
    {
      name: 'Server Uptime',
      value: `${data?.technical?.serverUptime || 0}%`,
      status: (data?.technical?.serverUptime || 0) > 99 ? 'good' : 'warning',
      icon: Server,
    },
    {
      name: 'Error Rate',
      value: `${((data?.technical?.errorRate || 0) * 100).toFixed(2)}%`,
      status: (data?.technical?.errorRate || 0) < 0.05 ? 'good' : 'warning',
      icon: TrendingUp,
    },
    {
      name: 'Avg Rating',
      value: data?.content?.averageRating?.toFixed(1) || '0',
      status: (data?.content?.averageRating || 0) > 4.0 ? 'good' : 'warning',
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary-500" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">System Performance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.name} className="flex items-center">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full ${
                    metric.status === 'good' ? 'bg-green-400' : 'bg-yellow-400'
                  }`}></div>
                  <div className="ml-4">
                    <Icon className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                    <p className="text-lg font-semibold text-gray-900">{metric.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Performing Content</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {data?.content?.topPerforming?.map((item, index) => (
              <div key={item._ID} className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{index + 1}</span>
                </div>
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.categoryId} • {item.views?.toLocaleString()} views</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-500">{item.rating}</span>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No content data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Video className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">New video uploaded</p>
                <p className="text-xs text-gray-500">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">Performance metrics updated</p>
                <p className="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;