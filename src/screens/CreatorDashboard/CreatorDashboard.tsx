import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from '../../components/Icon/Icon';
import { ICONS } from '../../constants/icons';
import CreatorService, { CreatorStats } from '../../services/CreatorService';
import VideoTypeToggle from '../../components/CreatorDashboard/VideoTypeToggle';

const CreatorDashboard = ({ navigation }: any) => {
  // Use static demo data for fast loading - no API calls
  const [selectedVideoType, setSelectedVideoType] = useState<
    'video' | 'short' | 'livestream'
  >('video');

  // Static demo data for instant loading
  const demoStats = {
    totalRevenue: 15420,
    monthlyRevenue: 3250,
    uploadedVideos: 42,
    subscribersCount: 12500,
    totalViews: 285000,
    totalDownloads: 8750,
    offlineShares: 3200,
    videoStats: [
      {
        id: '1',
        title: 'How to Create Amazing Content',
        videoType: 'video',
        views: 45000,
        downloads: 1200,
        shares: 450,
        watchTime: 720,
        revenue: 1250,
        uploadDate: '2024-01-15',
      },
      {
        id: '2',
        title: 'Spred Platform Tutorial',
        videoType: 'short',
        views: 28000,
        downloads: 800,
        shares: 320,
        watchTime: 480,
        revenue: 850,
        uploadDate: '2024-01-18',
      },
      {
        id: '3',
        title: 'Live Streaming Best Practices',
        videoType: 'livestream',
        views: 35000,
        downloads: 950,
        shares: 380,
        watchTime: 600,
        revenue: 1100,
        uploadDate: '2024-01-20',
      },
    ],
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) {
      return '₦0';
    }
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // No loading state - instant demo data
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name={ICONS.ARROW_LEFT} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Creator Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Revenue Overview */}
        <View style={styles.revenueCard}>
          <Text style={styles.cardTitle}>Total Revenue</Text>
          <Text style={styles.revenueAmount}>
            {formatCurrency(demoStats?.totalRevenue)}
          </Text>
          <Text style={styles.monthlyRevenue}>
            This month: {formatCurrency(demoStats?.monthlyRevenue)}
          </Text>

          <View style={styles.earningsBreakdown}>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Downloads</Text>
              <Text style={styles.earningValue}>
                {formatCurrency((demoStats?.totalDownloads || 0) * 10)}
              </Text>
            </View>
            <View style={styles.earningItem}>
              <Text style={styles.earningLabel}>Spred Shares</Text>
              <Text style={styles.earningValue}>
                {formatCurrency((demoStats?.offlineShares || 0) * 5)}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Icon name={ICONS.VIDEO_LIBRARY} size={24} color="#F45303" />
            <Text style={styles.metricValue}>
              {demoStats?.uploadedVideos || 0}
            </Text>
            <Text style={styles.metricLabel}>Videos</Text>
          </View>
          <View style={styles.metricCard}>
            <Icon name={ICONS.PEOPLE} size={24} color="#4CAF50" />
            <Text style={styles.metricValue}>
              {formatNumber(demoStats?.subscribersCount)}
            </Text>
            <Text style={styles.metricLabel}>Subscribers</Text>
          </View>
          <View style={styles.metricCard}>
            <Icon name={ICONS.EYE} size={24} color="#2196F3" />
            <Text style={styles.metricValue}>
              {formatNumber(demoStats?.totalViews)}
            </Text>
            <Text style={styles.metricLabel}>Views</Text>
          </View>
          <View style={styles.metricCard}>
            <Icon name={ICONS.DOWNLOAD_ARROW} size={24} color="#FF9800" />
            <Text style={styles.metricValue}>
              {formatNumber(demoStats?.totalDownloads)}
            </Text>
            <Text style={styles.metricLabel}>Downloads</Text>
          </View>
          <View style={styles.metricCard}>
            <Icon name={ICONS.STARS} size={24} color="#fff" />
            <Text style={styles.metricValue}>
              {formatNumber(demoStats?.offlineShares)}
            </Text>
            <Text style={styles.metricLabel}>Shares</Text>
          </View>
        </View>

        {/* Video Performance */}
        <View style={styles.videoSection}>
          <Text style={styles.sectionTitle}>All Videos</Text>
          <VideoTypeToggle
            selectedType={selectedVideoType}
            onTypeChange={setSelectedVideoType}
          />
          {demoStats?.videoStats && demoStats.videoStats.length > 0 ? (
            demoStats.videoStats
              .filter(
                video =>
                  video.videoType === selectedVideoType ||
                  (video.videoType === undefined &&
                    selectedVideoType === 'video'),
              )
              .map(video => (
                <View key={video?.id || Math.random()} style={styles.videoCard}>
                  <View style={styles.videoHeader}>
                    <View style={styles.videoTitleContainer}>
                      <Text style={styles.videoTitle}>
                        {video?.title || 'Untitled Video'}
                      </Text>
                      <View
                        style={[
                          styles.videoTypeBadge,
                          {
                            backgroundColor:
                              video?.videoType === 'short'
                                ? '#FF9800'
                                : video?.videoType === 'livestream'
                                ? '#F44336'
                                : '#2196F3',
                          },
                        ]}
                      >
                        <Text style={styles.videoTypeText}>
                          {video?.videoType === 'short'
                            ? 'Short'
                            : video?.videoType === 'livestream'
                            ? 'Live'
                            : 'Video'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.videoDate}>
                      {video?.uploadDate
                        ? new Date(video.uploadDate).toLocaleDateString()
                        : 'Unknown date'}
                    </Text>
                  </View>

                  <View style={styles.videoStats}>
                    <View style={styles.videoStat}>
                      <Icon name={ICONS.EYE} size={16} color="#999" />
                      <Text style={styles.videoStatText}>
                        {formatNumber(video?.views)}
                      </Text>
                    </View>
                    <View style={styles.videoStat}>
                      <Icon
                        name={ICONS.DOWNLOAD_ARROW}
                        size={16}
                        color="#999"
                      />
                      <Text style={styles.videoStatText}>
                        {formatNumber(video?.downloads)}
                      </Text>
                    </View>
                    <View style={styles.videoStat}>
                      <Icon name={ICONS.STARS} size={16} color="#fff" />
                      <Text style={styles.videoStatText}>
                        {formatNumber(video?.shares)}
                      </Text>
                    </View>
                    <View style={styles.videoStat}>
                      <Icon name={ICONS.SCHEDULE} size={16} color="#999" />
                      <Text style={styles.videoStatText}>
                        {Math.floor((video?.watchTime || 0) / 60)}h
                      </Text>
                    </View>
                  </View>

                  <View style={styles.videoRevenue}>
                    <Text style={styles.videoRevenueText}>
                      Revenue: {formatCurrency(video?.revenue)}
                    </Text>
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>
                {selectedVideoType === 'video'
                  ? 'No videos uploaded yet'
                  : selectedVideoType === 'short'
                  ? 'No shorts uploaded yet'
                  : 'No livestreams created yet'}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Upload')}
            >
              <Icon name={ICONS.CLOUD_UPLOAD} size={24} color="#F45303" />
              <Text style={styles.quickActionText}>Upload Video</Text>
            </TouchableOpacity>
            {/* SpredWallet temporarily disabled */}
            {/* <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('SpredWallet')}
            >
              <Icon
                name={ICONS.ACCOUNT_BALANCE_WALLET}
                size={24}
                color="#4CAF50"
              />
              <Text style={styles.quickActionText}>View Earnings</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => {
                // Navigate to analytics when implemented
                // DISABLED FOR PERFORMANCE
                // console.log('Navigate to detailed analytics');
              }}
            >
              <Icon name={ICONS.ANALYTICS} size={24} color="#2196F3" />
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Account')}
            >
              <Icon name={ICONS.SETTINGS} size={24} color="#FF9800" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#353535',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  revenueCard: {
    backgroundColor: '#2a2a2a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  monthlyRevenue: {
    fontSize: 14,
    color: '#999',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  videoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  videoCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  videoTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  videoTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  videoTypeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  videoDate: {
    fontSize: 12,
    color: '#999',
  },
  videoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  videoStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoStatText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  videoRevenue: {
    alignItems: 'flex-end',
  },
  videoRevenueText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  earningsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  earningItem: {
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  earningValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  topVideosSection: {
    marginBottom: 24,
  },
  topVideoCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F45303',
  },
  topVideoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  topVideoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topVideoStat: {
    fontSize: 14,
    color: '#999',
  },
  topVideoRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  analyticsSection: {
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F45303',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  // Spred Wallet Styles
  walletSection: {
    marginBottom: 24,
  },
  walletHeader: {
    marginBottom: 16,
  },
  walletTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  demoBadge: {
    backgroundColor: 'rgba(244, 83, 3, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(244, 83, 3, 0.4)',
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F45303',
    textAlign: 'center',
  },
  walletSubtitle: {
    fontSize: 14,
    color: '#999',
    marginLeft: 32,
  },
  walletCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  walletCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  walletBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  walletMonthlyEarnings: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 12,
  },
  walletBreakdown: {
    gap: 8,
  },
  walletBreakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walletBreakdownLabel: {
    fontSize: 12,
    color: '#999',
  },
  walletBreakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  walletTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletTrendText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  walletActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  walletActionButton: {
    width: '23%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  walletActionText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  walletTransactions: {
    marginBottom: 16,
  },
  walletTransactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  transactionList: {
    gap: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  walletStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 83, 3, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 83, 3, 0.2)',
  },
  walletStatusText: {
    fontSize: 12,
    color: '#F45303',
    marginLeft: 8,
    flex: 1,
  },
  // Token Section Styles
  tokenSection: {
    marginBottom: 20,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  tokenBadge: {
    backgroundColor: 'rgba(214, 158, 46, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(214, 158, 46, 0.4)',
  },
  tokenBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D69E2E',
  },
  tokenCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  tokenBalance: {
    alignItems: 'flex-start',
  },
  tokenAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D69E2E',
    marginBottom: 2,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#999',
  },
  tokenValue: {
    alignItems: 'flex-end',
  },
  tokenUsdValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  tokenChange: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  tokenActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenButton: {
    width: '23%',
    backgroundColor: '#2a2a2a',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  tokenButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  // Expanded Wallet Actions Styles
  expandedWalletActions: {
    marginBottom: 20,
  },
  expandedActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  expandedActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  expandedActionButton: {
    width: '31%',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 2,
  },
  expandedActionSubtext: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    lineHeight: 12,
  },
  // Enhanced Transactions Styles
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    color: '#F45303',
    marginRight: 4,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionUsd: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  // Analytics Overview Styles
  analyticsOverviewSection: {
    marginBottom: 24,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  periodText: {
    fontSize: 12,
    color: '#F45303',
    marginRight: 4,
  },
  // Ratio Card Styles
  ratioCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  ratioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  ratioContainer: {
    gap: 12,
  },
  ratioItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioBarContainer: {
    width: 60,
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  ratioBar: {
    height: '100%',
    borderRadius: 4,
  },
  ratioDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  ratioValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ccc',
  },
  ratioCount: {
    fontSize: 12,
    color: '#999',
  },
  // Revenue Chart Styles
  revenueChartCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  pieChartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    marginRight: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  pieSlice: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    transformOrigin: 'center',
  },
  chartLegend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#ccc',
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  // Trend Chart Styles
  trendCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  trendChart: {
    marginBottom: 16,
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
    paddingHorizontal: 8,
  },
  trendBarContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: '100%',
  },
  trendBar: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    marginBottom: 4,
  },
  trendDayLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  trendMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  trendMetric: {
    alignItems: 'center',
  },
  trendMetricLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  trendMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreatorDashboard;
