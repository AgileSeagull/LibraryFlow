import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user?.firstName}!</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="card mb-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome to LibraryFlow Admin</h2>
              <p className="text-blue-100">You have successfully logged in as an administrator.</p>
            </div>
            <svg className="w-20 h-20 text-blue-200 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Admin Information */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrator Information</h3>
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">QR Code ID:</span>
              <span className="font-mono text-sm text-gray-900">{user?.qrCode}</span>
            </div>
          </div>
        </div>

        {/* Upcoming Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Occupancy Management */}
          <div className="card">
            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border-2 border-green-300 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/occupancy')}>
              <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-green-900 mb-1">Occupancy Management</h3>
              <p className="text-xs text-green-700 mb-3">Track and manage library capacity</p>
              <button 
                onClick={() => navigate('/admin/occupancy')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Manage Occupancy
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* QR Code Scanner */}
          <div className="card">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/scanner')}>
              <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-4v4m-6-4h2m0 0h2m-2 0v4m0-4V4m6 0v1m-6 0V4m6 0v1" />
              </svg>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">QR Code Scanner</h3>
              <p className="text-xs text-blue-700 mb-3">Scan student entry/exit QR codes</p>
              <button 
                onClick={() => navigate('/admin/scanner')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Open Scanner
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Entry/Exit Logs */}
          <div className="card">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-300 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/logs')}>
              <svg className="w-12 h-12 text-purple-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Entry/Exit Logs</h3>
              <p className="text-xs text-purple-700 mb-3">View detailed access history</p>
              <button 
                onClick={() => navigate('/admin/logs')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                View Logs
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Real-time Dashboard */}
          <div className="card">
            <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300 text-center cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/analytics')}>
              <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Live Analytics & Insights</h3>
              <p className="text-xs text-yellow-700 mb-3">Real-time analytics and insights</p>
              <button 
                onClick={() => navigate('/admin/analytics')}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
              >
                View Analytics
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
