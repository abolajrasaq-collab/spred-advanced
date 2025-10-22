import React, { useState, useEffect } from 'react';
import { spredApi, AdminStats, SpredVideo } from '../services/spredApi';

interface DashboardProps {
  isAuthenticated: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ isAuthenticated }) => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalVideos: 0,
    totalRevenue: 0,
    totalDownloads: 0,
    totalViews: 0,
  });
  const [videos, setVideos] = useState<SpredVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, videosData] = await Promise.all([
        spredApi.getAdminStats(),
        spredApi.getAllVideos(),
      ]);

      setStats(statsData);
      setVideos(videosData.slice(0, 10)); // Show top 10 videos
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <h2>Loading Dashboard...</h2>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>SPRED Admin Dashboard</h1>
        <p>Real-time analytics and performance metrics</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>{formatNumber(stats.totalUsers)}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎬</div>
          <div className="metric-content">
            <h3>{formatNumber(stats.totalVideos)}</h3>
            <p>Total Videos</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">👁️</div>
          <div className="metric-content">
            <h3>{formatNumber(stats.totalViews)}</h3>
            <p>Total Views</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⬇️</div>
          <div className="metric-content">
            <h3>{formatNumber(stats.totalDownloads)}</h3>
            <p>Total Downloads</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>{stats.activeUsers > 0 ? formatNumber(stats.activeUsers) : 'N/A'}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      {/* Recent Videos Table */}
      <div className="recent-videos">
        <h2>Recent Videos</h2>
        <div className="videos-table">
          <div className="table-header">
            <div>Title</div>
            <div>Views</div>
            <div>Downloads</div>
            <div>Year</div>
          </div>
          {videos.map((video) => (
            <div key={video._ID} className="table-row">
              <div className="video-title">
                {video.title?.length > 50
                  ? `${video.title.substring(0, 50)}...`
                  : video.title || 'Untitled'}
              </div>
              <div>{formatNumber(video.views || 0)}</div>
              <div>{formatNumber(video.downloads || 0)}</div>
              <div>{video.year || 'N/A'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <button className="action-btn" onClick={loadDashboardData}>
            🔄 Refresh Data
          </button>
          <button className="action-btn">
            📊 Export Report
          </button>
          <button className="action-btn">
            ⚙️ Settings
          </button>
          <button className="action-btn">
            📧 Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;