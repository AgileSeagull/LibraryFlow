import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { occupancyService, OccupancyData } from '../services/occupancyService';
import { libraryStatusService, LibraryStatus } from '../services/libraryStatusService';
import OccupancyCard from '../components/OccupancyCard';
import OccupancyAlert from '../components/OccupancyAlert';
import UserActionNotification from '../components/UserActionNotification';

const StudentPortal: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { isConnected, occupancyData, occupancyAlert, userAction, libraryStatus: realtimeLibraryStatus, connectionError } = useSocket();
  
  const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<any>(null);
  const [userActionNotification, setUserActionNotification] = useState<any>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [occupancyData, statusData] = await Promise.all([
          occupancyService.getOccupancyStatus(),
          libraryStatusService.getLibraryStatus()
        ]);
        setOccupancy(occupancyData);
        setLibraryStatus(statusData);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update occupancy when Socket.io data changes
  useEffect(() => {
    if (occupancyData) {
      setOccupancy(occupancyData);
    }
  }, [occupancyData]);

  // Update library status when Socket.io data changes
  useEffect(() => {
    if (realtimeLibraryStatus) {
      setLibraryStatus(realtimeLibraryStatus);
    }
  }, [realtimeLibraryStatus]);

  // Handle occupancy alerts
  useEffect(() => {
    if (occupancyAlert) {
      setAlert(occupancyAlert);
    }
  }, [occupancyAlert]);

  // Handle user actions
  useEffect(() => {
    if (userAction) {
      setUserActionNotification(userAction);
    }
  }, [userAction]);

  const dismissAlert = () => {
    setAlert(null);
  };

  const dismissUserAction = () => {
    setUserActionNotification(null);
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
            onClick={() => window.location.reload()}
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
      
      {/* User Action Notification */}
      <UserActionNotification 
        action={userActionNotification} 
        currentUserId={user?.id}
        onDismiss={dismissUserAction} 
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
              <p className="text-gray-600">Welcome, {user?.firstName}!</p>
            </div>
            <button
              onClick={logout}
              className="btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

               <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 {/* Library Status */}
                 {libraryStatus && (
                   <div className="mb-8">
                     <div className="bg-white rounded-lg shadow p-6">
                       <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-gray-900">Library Status</h3>
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                           libraryStatus.status === 'OPEN' 
                             ? 'bg-green-100 text-green-800'
                             : libraryStatus.status === 'CLOSED'
                             ? 'bg-red-100 text-red-800'
                             : 'bg-yellow-100 text-yellow-800'
                         }`}>
                           {libraryStatus.status === 'OPEN' ? 'Open' : 
                            libraryStatus.status === 'CLOSED' ? 'Closed' : 'Under Maintenance'}
                         </span>
                       </div>
                       
                       {libraryStatus.message && (
                         <p className="text-gray-600 mb-2">{libraryStatus.message}</p>
                       )}
                       
                       {libraryStatus.status === 'MAINTENANCE' && libraryStatus.maintenanceMessage && (
                         <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                           <p className="text-yellow-800 text-sm">{libraryStatus.maintenanceMessage}</p>
                         </div>
                       )}
                       
                       {libraryStatus.isAutoScheduled && (
                         <div className="mt-2 text-sm text-gray-500">
                           <p>Auto-scheduled: {libraryStatus.autoOpenTime} - {libraryStatus.autoCloseTime}</p>
                         </div>
                       )}
                     </div>
                   </div>
                 )}

                 {/* Library Occupancy - Real-time Tracking */}
                 {occupancy && (
                   <div className="mb-8">
                     <OccupancyCard 
                       occupancy={occupancy} 
                       isConnected={isConnected}
                       connectionError={connectionError}
                       lastUpdated={occupancy.lastUpdated}
                     />
                   </div>
                 )}

        {/* Your QR Code */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your QR Code</h3>
            <button
              onClick={() => navigate('/student/qr-code')}
              className="btn-primary text-sm"
            >
              View Full QR Code
            </button>
          </div>
          <div className="bg-white rounded-lg p-8 text-center border-2 border-gray-200">
            <div className="bg-gray-100 rounded-lg p-4 inline-block mb-4">
              <p className="text-4xl font-mono font-bold text-gray-800">{user?.qrCode}</p>
            </div>
            <p className="text-gray-600 mb-2">Use this code for library entry and exit</p>
            <p className="text-sm text-gray-500">Click "View Full QR Code" to see the scannable version</p>
          </div>
        </div>

        {/* User Information */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Role:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">QR Code ID:</span>
              <span className="font-mono text-sm text-gray-900">{user?.qrCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;
