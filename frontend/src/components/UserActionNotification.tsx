import React, { useEffect, useState } from 'react';

interface UserAction {
  type: 'ENTRY' | 'EXIT';
  userName: string;
  userId: string;
  timestamp: string;
  currentOccupancy: number;
  maxCapacity: number;
}

interface UserActionNotificationProps {
  action: UserAction | null;
  currentUserId?: string;
  onDismiss: () => void;
}

const UserActionNotification: React.FC<UserActionNotificationProps> = ({ 
  action, 
  currentUserId,
  onDismiss 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (action) {
      setIsVisible(true);
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [action, onDismiss]);

  if (!action || !isVisible) return null;

  const isCurrentUser = currentUserId === action.userId;
  const isEntry = action.type === 'ENTRY';

  const getNotificationStyles = () => {
    if (isEntry) {
      return {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600',
        icon: '🎉',
        title: isCurrentUser ? 'Welcome to the Library!' : `${action.userName} entered the library`,
        message: isCurrentUser 
          ? 'You have successfully entered the library. Enjoy your study session!'
          : `Library occupancy: ${action.currentOccupancy}/${action.maxCapacity}`
      };
    } else {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        icon: '👋',
        title: isCurrentUser ? 'Thank you for visiting!' : `${action.userName} left the library`,
        message: isCurrentUser 
          ? 'You have successfully exited the library. Have a great day!'
          : `Library occupancy: ${action.currentOccupancy}/${action.maxCapacity}`
      };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div className={`fixed top-4 left-4 z-50 max-w-sm w-full ${styles.bgColor} ${styles.borderColor} border rounded-lg shadow-lg transform transition-all duration-300 ${
      isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
    }`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${styles.iconColor} text-2xl`}>
            {styles.icon}
          </div>
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-medium ${styles.textColor}`}>
              {styles.title}
            </h3>
            <p className={`text-xs ${styles.textColor} mt-1`}>
              {styles.message}
            </p>
            <p className={`text-xs ${styles.textColor} mt-1 opacity-75`}>
              {new Date(action.timestamp).toLocaleTimeString()}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className={`inline-flex ${styles.textColor} hover:opacity-75 focus:outline-none`}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserActionNotification;
