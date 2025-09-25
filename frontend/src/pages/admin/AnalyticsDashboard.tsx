import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { analyticsService, AnalyticsData, RealTimeAnalytics } from '../../services/analyticsService';

// Custom SVG Icons
const ChartBarIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const UsersIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, realTimeAnalytics] = await Promise.all([
        analyticsService.getAnalytics(selectedPeriod),
        analyticsService.getRealTimeAnalytics()
      ]);
      setAnalytics(analyticsData);
      setRealTimeData(realTimeAnalytics);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      analyticsService.getRealTimeAnalytics()
        .then(setRealTimeData)
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const formatPeriod = (period: string) => {
    switch (period) {
      case '1d': return 'Last 24 Hours';
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 7 Days';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Live Analytics & Insights</h1>
              <p className="mt-2 text-gray-600">Real-time library usage analytics and insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
                </span>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Summary Cards */}
        {realTimeData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUpIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Entries</p>
                  <p className="text-2xl font-semibold text-gray-900">{realTimeData.todayEntries}</p>
                  <p className="text-sm text-gray-500">{realTimeData.todayExits} exits</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Occupancy</p>
                  <p className="text-2xl font-semibold text-gray-900">{realTimeData.currentOccupancy}</p>
                  <p className="text-sm text-gray-500">{realTimeData.occupancyRate}% capacity</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Activity</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics?.summary.totalLogs || 0}</p>
                  <p className="text-sm text-gray-500">{formatPeriod(selectedPeriod)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatTime(realTimeData.timestamp)}
                  </p>
                  <p className="text-sm text-gray-500">Real-time</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Charts */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Activity Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity</h3>
              <div className="space-y-4">
                {analytics.dailyData.slice(-7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                        <span className="text-sm text-gray-500">{day.uniqueUsers} users</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((day.entries / Math.max(...analytics.dailyData.map(d => d.entries))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{day.entries} entries</span>
                        <span>{day.exits} exits</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak Hours Analysis */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h3>
              <div className="space-y-3">
                {analytics.peakHours.peakHours.map((peak, index) => (
                  <div key={peak.hour} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {peak.hour}:00 - {peak.hour + 1}:00
                        </p>
                        <p className="text-xs text-gray-500">{peak.count} activities</p>
                      </div>
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(peak.count / analytics.peakHours.peakHours[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Average hourly activity: <span className="font-medium">{analytics.peakHours.averageHourlyActivity}</span> events
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Active Users */}
        {analytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Users</h3>
              <div className="space-y-3">
                {analytics.userActivity.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium text-purple-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.user?.firstName} {user.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{user.user?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.activityCount}</p>
                      <p className="text-xs text-gray-500">activities</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {realTimeData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {realTimeData.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-3 ${
                          activity.type === 'ENTRY' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.type}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {activity.user.firstName} {activity.user.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Library Status History */}
        {analytics && analytics.libraryStatusHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Library Status History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.libraryStatusHistory.slice(0, 10).map((status) => (
                    <tr key={status.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status.status === 'OPEN' 
                            ? 'bg-green-100 text-green-800'
                            : status.status === 'CLOSED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {status.message || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(status.updatedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
