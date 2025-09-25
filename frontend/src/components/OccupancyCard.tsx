import React from 'react';
import { OccupancyData } from '../services/occupancyService';

// Simple SVG Icons
const AlertTriangleIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface OccupancyCardProps {
  occupancy: OccupancyData;
  isConnected: boolean;
  connectionError?: string | null;
  lastUpdated?: string;
}

const OccupancyCard: React.FC<OccupancyCardProps> = ({ 
  occupancy, 
  isConnected, 
  connectionError,
  lastUpdated 
}) => {
  const getStatusColor = () => {
    if (occupancy.isAtCapacity) return 'text-red-600';
    if (occupancy.isNearCapacity) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (occupancy.isAtCapacity) return <AlertTriangleIcon />;
    if (occupancy.isNearCapacity) return <AlertTriangleIcon />;
    return <CheckCircleIcon />;
  };

  const getStatusText = () => {
    if (occupancy.isAtCapacity) return 'Library is FULL';
    if (occupancy.isNearCapacity) return 'Library is nearly full';
    return '';
  };

  const getProgressBarColor = () => {
    if (occupancy.percentage >= 100) return 'bg-red-500';
    if (occupancy.percentage >= 90) return 'bg-yellow-500';
    if (occupancy.percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Occupancy Status</h2>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <div className="flex items-center text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          ) : connectionError ? (
            <div className="flex items-center text-yellow-600">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">Reconnecting...</span>
            </div>
          ) : (
            <div className="flex items-center text-red-600">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Display */}
      <div className="text-center mb-6">
        {getStatusText() && (
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-2xl font-bold">{getStatusText()}</span>
            </div>
          </div>
        )}

        {/* Occupancy Numbers */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{occupancy.currentOccupancy}</div>
            <div className="text-sm text-gray-600">Current</div>
          </div>
          <div className="text-gray-400">/</div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{occupancy.maxCapacity}</div>
            <div className="text-sm text-gray-600">Max Capacity</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{occupancy.percentage}%</div>
            <div className="text-sm text-gray-600">Full</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(occupancy.percentage, 100)}%` }}
          />
        </div>

        {/* Available Seats */}
        <div className="text-sm text-gray-600">
          {occupancy.maxCapacity - occupancy.currentOccupancy} seats available
        </div>
      </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="flex items-center justify-center text-sm text-gray-500">
            <ClockIcon />
            <span className="ml-2">Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
          </div>
        )}
    </div>
  );
};

export default OccupancyCard;
