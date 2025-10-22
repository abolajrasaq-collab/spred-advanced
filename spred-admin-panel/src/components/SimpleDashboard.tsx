import React, { useState, useEffect } from 'react';
import { spredApi } from '../services/spredApi';

interface SimpleDashboardProps {
  onLogout: () => void;
}

const SimpleDashboard: React.FC<SimpleDashboardProps> = ({ onLogout }) => {
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalViews: 0,
    totalDownloads: 0,
    totalRevenue: 0,
  });
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load videos from SPRED API
      const videosData = await spredApi.getAllVideos();

      // Calculate stats from video data
      const totalViews = videosData.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
      const totalDownloads = videosData.reduce((sum: number, video: any) => sum + (video.downloads || 0), 0);

      setStats({
        totalVideos: videosData.length,
        totalViews,
        totalDownloads,
        totalRevenue: 0, // Would come from wallet API
      });

      setVideos(videosData.slice(0, 5)); // Show first 5 videos
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Loading SPRED Dashboard...</h2>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #3498db',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '20px auto'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={loadData}
          style={{
            padding: '10px 20px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '10px'
      }}>
        <div>
          <h1 style={{ margin: '0', fontSize: '1.8rem' }}>SPRED Admin Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Real-time analytics from SPRED APIs</p>
        </div>
        <button
          onClick={onLogout}
          style={{
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎬</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3498db' }}>
            {formatNumber(stats.totalVideos)}
          </div>
          <div style={{ color: '#666' }}>Total Videos</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👁️</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#27ae60' }}>
            {formatNumber(stats.totalViews)}
          </div>
          <div style={{ color: '#666' }}>Total Views</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⬇️</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f39c12' }}>
            {formatNumber(stats.totalDownloads)}
          </div>
          <div style={{ color: '#666' }}>Total Downloads</div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e74c3c' }}>
            ${formatNumber(stats.totalRevenue)}
          </div>
          <div style={{ color: '#666' }}>Total Revenue</div>
        </div>
      </div>

      {/* Recent Videos */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Recent Videos</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Title</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Views</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Downloads</th>
                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Year</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video, index) => (
                <tr key={video._ID || index} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '10px' }}>
                    {video.title?.length > 50
                      ? `${video.title.substring(0, 50)}...`
                      : video.title || 'Untitled'}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {formatNumber(video.views || 0)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {formatNumber(video.downloads || 0)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {video.year || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Status */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>API Status</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{
            padding: '10px 15px',
            background: '#d4edda',
            color: '#155724',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}>
            ✅ SPRED API Connected
          </div>
          <div style={{
            padding: '10px 15px',
            background: '#d1ecf1',
            color: '#0c5460',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}>
            📊 Real-time Data
          </div>
          <div style={{
            padding: '10px 15px',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '5px',
            fontWeight: 'bold'
          }}>
            ⚠️ User API Limited
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimpleDashboard;