import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';

interface OccupancyData {
  currentOccupancy: number;
  maxCapacity: number;
  percentage: number;
  isAvailable: boolean;
  isNearCapacity: boolean;
  isAtCapacity: boolean;
  lastUpdated: string;
}

interface OccupancyAlert {
  type: 'FULL' | 'WARNING';
  message: string;
  currentOccupancy: number;
  maxCapacity: number;
  percentage: number;
  isAvailable: boolean;
  isNearCapacity: boolean;
  isAtCapacity: boolean;
  lastUpdated: string;
}

interface UserAction {
  type: 'ENTRY' | 'EXIT';
  userName: string;
  userId: string;
  timestamp: string;
  currentOccupancy: number;
  maxCapacity: number;
}

interface LibraryStatusUpdate {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  message?: string;
  isAutoScheduled: boolean;
  autoOpenTime?: string;
  autoCloseTime?: string;
  maintenanceMessage?: string;
  lastUpdated: string;
  updatedBy?: string;
}

export const useSocket = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [occupancyData, setOccupancyData] = useState<OccupancyData | null>(null);
  const [occupancyAlert, setOccupancyAlert] = useState<OccupancyAlert | null>(null);
  const [userAction, setUserAction] = useState<UserAction | null>(null);
  const [libraryStatus, setLibraryStatus] = useState<LibraryStatusUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to Socket.io server
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['polling', 'websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
      setIsConnected(true);
      
      // Authenticate user with socket server
      if (user?.id) {
        socket.emit('user:authenticate', user.id);
        console.log('User authenticated with socket:', user.id);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.io server:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.log('Socket.io connection error:', error);
      setIsConnected(false);
      setConnectionError(error.message || 'Connection failed');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.io reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_error', (error) => {
      console.log('Socket.io reconnection error:', error);
      setIsConnected(false);
    });

    // Occupancy update event
    socket.on('occupancy:update', (data: OccupancyData) => {
      console.log('Received occupancy update:', data);
      setOccupancyData(data);
    });

    // Occupancy alert event
    socket.on('occupancy:alert', (alert: OccupancyAlert) => {
      console.log('Received occupancy alert:', alert);
      setOccupancyAlert(alert);
    });

    // User action event
    socket.on('user:action', (action: UserAction) => {
      console.log('Received user action:', action);
      setUserAction(action);
    });

    // Library status update event
    socket.on('library:statusUpdate', (status: LibraryStatusUpdate) => {
      console.log('Received library status update:', status);
      setLibraryStatus(status);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]); // Re-run when user changes

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  const emit = (event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  };

  return {
    isConnected,
    occupancyData,
    occupancyAlert,
    userAction,
    libraryStatus,
    connectionError,
    reconnect,
    emit,
    on,
    off,
    socket: socketRef.current
  };
};