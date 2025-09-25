import React, { useEffect, useState } from 'react';

// Simple SVG Icons
const AlertTriangleIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

interface OccupancyAlertProps {
  alert: {
    type: 'FULL' | 'WARNING';
    message: string;
    currentOccupancy: number;
    maxCapacity: number;
    percentage: number;
  } | null;
  onDismiss: () => void;
}

const OccupancyAlert: React.FC<OccupancyAlertProps> = ({ alert, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  if (!alert || !isVisible) return null;

  const getAlertStyles = () => {
    switch (alert.type) {
      case 'FULL':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: <AlertTriangleIcon />
        };
      case 'WARNING':
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: <AlertTriangleIcon />
        };
      default:
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          icon: <CheckCircleIcon />
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-lg transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            {styles.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${styles.textColor}`}>
              {alert.message}
            </h3>
            <p className={`text-xs ${styles.textColor} mt-1`}>
              Current occupancy: {alert.currentOccupancy} / {alert.maxCapacity} ({alert.percentage}%)
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className={`inline-flex ${styles.textColor} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-500`}
            >
              <XIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OccupancyAlert;
