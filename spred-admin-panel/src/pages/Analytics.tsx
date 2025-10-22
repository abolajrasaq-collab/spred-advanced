import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  Video,
  Eye,
  Calendar,
  Download
} from 'lucide-react';
import { apiService } from '../services/api';

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', dateRange],
    queryFn: () => apiService.getAnalytics({
      startDate: getStartDate(dateRange),
      endDate: new Date().toISOString(),
      metrics: ['users', 'content', 'engagement', 'revenue']
    }),
  });

  const getStartDate = (range: string) => {
    const now = new Date();
    switch (range) {
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      case '1y':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        now.setDate(now.getDate() - 30);
    }
    return now.toISOString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Mock data for demonstration
  const userGrowthData = [
    { name: 'Jan', users: 1200, premium: 240 },
    { name: 'Feb', users: 1350, premium: 270 },
    { name: 'Mar', users: 1500, premium: 300 },
    { name: 'Apr', users: 1680, premium: 336 },
    { name: 'May', users: 1850, premium: 370 },
    { name: 'Jun', users: 2100, premium: 420 },
  ];

  const contentEngagementData = [
    { name: 'Mon', views: 12500, downloads: 850 },
    { name: 'Tue', views: 13200, downloads: 920 },
    { name: 'Wed', views: 11800, downloads: 780 },
    { name: 'Thu', views: 14100, downloads: 1050 },
    { name: 'Fri', views: 15800, downloads: 1200 },
    { name: 'Sat', views: 17200, downloads: 1350 },
    { name: 'Sun', views: 16500, downloads: 1280 },
  ];

  const deviceData = [
    { name: 'Mobile', value: 65, color: '#F45303' },
    { name: 'Tablet', value: 20, color: '#FF9800' },
    { name: 'Desktop', value: 15, color: '#4CAF50' },
  ];

  const topContentData = [
    { title: 'Action Movie 1', views: 45000, engagement: 4.8 },
    { title: 'Comedy Special', views: 32000, engagement: 4.6 },
    { title: 'Drama Series', views: 28000, engagement: 4.7 },
    { title: 'Documentary', views: 22000, engagement: 4.5 },
    { title: 'Short Film', views: 18000, engagement: 4.3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">New Users</p>
              <p className="text-2xl font-semibold text-gray-900">2,450</p>
              <p className="text-sm text-green-600">+12.5% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Eye className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Total Views</p>
              <p className="text-2xl font-semibold text-gray-900">892K</p>
              <p className="text-sm text-green-600">+8.2% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Downloads</p>
              <p className="text-2xl font-semibold text-gray-900">15.2K</p>
              <p className="text-sm text-green-600">+15.3% from last period</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">$12.5K</p>
              <p className="text-sm text-green-600">+22.1% from last period</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#F45303" name="Total Users" />
              <Bar dataKey="premium" fill="#FF9800" name="Premium Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Content Engagement Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Content Engagement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={contentEngagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#4CAF50"
                strokeWidth={2}
                name="Views"
              />
              <Line
                type="monotone"
                dataKey="downloads"
                stroke="#2196F3"
                strokeWidth={2}
                name="Downloads"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Device Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Content</h3>
          <div className="space-y-4">
            {topContentData.map((content, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{content.title}</p>
                  <p className="text-xs text-gray-500">{content.views.toLocaleString()} views</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-900">{content.engagement}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < Math.floor(content.engagement) ? 'bg-yellow-400' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analytics Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Analytics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Daily Active Users
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8,920</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7,850</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+13.6%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Video Views
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">892,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">825,000</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+8.1%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Average Session Duration
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24m 32s</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">22m 15s</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+10.8%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Content Uploads
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">156</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">142</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+9.9%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;