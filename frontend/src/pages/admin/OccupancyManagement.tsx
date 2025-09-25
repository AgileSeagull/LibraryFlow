import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { adminOccupancyService, OccupancyStats, OccupancyAnalytics } from '../../services/adminOccupancyService';
import { libraryStatusService, LibraryStatus } from '../../services/libraryStatusService';
import OccupancyAlert from '../../components/OccupancyAlert';

// Custom SVG Icons
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

const TrendingUpIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const OccupancyManagement: React.FC = () => {
  const { user } = useAuth();
  const { isConnected, occupancyData, occupancyAlert } = useSocket();
  
  const [stats, setStats] = useState<OccupancyStats | null>(null);
  const [analytics, setAnalytics] = useState<OccupancyAnalytics | null>(null);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<any>(null);
  
  // Form states
  const [maxCapacity, setMaxCapacity] = useState<number>(100);
  
  // Library status form states
  const [statusForm, setStatusForm] = useState({
    status: 'OPEN' as 'OPEN' | 'CLOSED' | 'MAINTENANCE',
    message: '',
    isAutoScheduled: false,
    autoOpenTime: '',
    autoCloseTime: '',
    maintenanceMessage: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  // Update stats when Socket.io data changes
  useEffect(() => {
    if (occupancyData) {
      setStats(prev => prev ? { ...prev, ...occupancyData } : null);
    }
  }, [occupancyData]);

  // Handle occupancy alerts
  useEffect(() => {
    if (occupancyAlert) {
      setAlert(occupancyAlert);
    }
  }, [occupancyAlert]);

  const dismissAlert = () => {
    setAlert(null);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [statsData, analyticsData, statusData] = await Promise.all([
        adminOccupancyService.getOccupancyStats(),
        adminOccupancyService.getOccupancyAnalytics(7),
        libraryStatusService.getLibraryStatus()
      ]);
      
      setStats(statsData);
      setAnalytics(analyticsData);
      setLibraryStatus(statusData);
      setMaxCapacity(statsData.maxCapacity);
      setStatusForm({
        status: statusData.status,
        message: statusData.message || '',
        isAutoScheduled: statusData.isAutoScheduled,
        autoOpenTime: statusData.autoOpenTime || '',
        autoCloseTime: statusData.autoCloseTime || '',
        maintenanceMessage: statusData.maintenanceMessage || ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMaxCapacity = async () => {
    try {
      setLoading(true);
      await adminOccupancyService.updateMaxCapacity(maxCapacity);
      // Refetch full stats after update
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update max capacity');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateLibraryStatus = async () => {
    try {
      const updatedStatus = await libraryStatusService.updateLibraryStatus(statusForm);
      setLibraryStatus(updatedStatus);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update library status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading occupancy data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStats}
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
      {/* Occupancy Alert */}
      <OccupancyAlert alert={alert} onDismiss={dismissAlert} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Occupancy Management</h1>
              <p className="text-gray-600">Manage library capacity and status</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Current Occupancy</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.currentOccupancy || 0}</p>
                  <p className="text-sm text-gray-500">of {stats?.maxCapacity || 0} capacity</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUpIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Entries</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.todayEntries || 0}</p>
                  <p className="text-sm text-gray-500">{stats?.todayExits || 0} exits</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.activeUsers || 0}</p>
                  <p className="text-sm text-gray-500">currently inside</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangleIcon />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Capacity Usage</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats?.percentage || 0}%</p>
                  <p className={`text-sm ${stats?.isNearCapacity ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {stats?.isNearCapacity ? 'Near capacity' : 'Normal usage'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Capacity Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Capacity Management</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Capacity
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="10000"
                  />
                  <button
                    onClick={handleUpdateMaxCapacity}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Library Status Management */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Library Status</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({...statusForm, status: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Message
                </label>
                <input
                  type="text"
                  value={statusForm.message}
                  onChange={(e) => setStatusForm({...statusForm, message: e.target.value})}
                  placeholder="Optional status message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoScheduled"
                  checked={statusForm.isAutoScheduled}
                  onChange={(e) => setStatusForm({...statusForm, isAutoScheduled: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoScheduled" className="ml-2 block text-sm text-gray-700">
                  Enable automatic scheduling
                </label>
              </div>

              {statusForm.isAutoScheduled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto Open Time
                    </label>
                    <input
                      type="time"
                      value={statusForm.autoOpenTime}
                      onChange={(e) => setStatusForm({...statusForm, autoOpenTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Auto Close Time
                    </label>
                    <input
                      type="time"
                      value={statusForm.autoCloseTime}
                      onChange={(e) => setStatusForm({...statusForm, autoCloseTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {statusForm.status === 'MAINTENANCE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    value={statusForm.maintenanceMessage}
                    onChange={(e) => setStatusForm({...statusForm, maintenanceMessage: e.target.value})}
                    placeholder="Explain the maintenance work..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <button
                onClick={handleUpdateLibraryStatus}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Library Status
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OccupancyManagement;
