import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AnalyticsSummary {
  totalLogs: number;
  totalEntries: number;
  totalExits: number;
  uniqueUsers: number;
  currentOccupancy: number;
  maxCapacity: number;
  occupancyRate: number;
}

export interface HourlyData {
  hour: string;
  entries: number;
  exits: number;
  netChange: number;
}

export interface DailyData {
  date: string;
  entries: number;
  exits: number;
  uniqueUsers: number;
}

export interface PeakHours {
  peakHours: { hour: number; count: number }[];
  averageHourlyActivity: number;
}

export interface UserActivity {
  userId: string;
  activityCount: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface LibraryStatusHistory {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  message?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface AnalyticsData {
  period: string;
  summary: AnalyticsSummary;
  hourlyData: HourlyData[];
  dailyData: DailyData[];
  peakHours: PeakHours;
  userActivity: UserActivity[];
  libraryStatusHistory: LibraryStatusHistory[];
}

export interface RealTimeAnalytics {
  timestamp: string;
  todayEntries: number;
  todayExits: number;
  currentOccupancy: number;
  maxCapacity: number;
  occupancyRate: number;
  recentActivity: {
    id: string;
    type: 'ENTRY' | 'EXIT';
    timestamp: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }[];
}

const getAnalytics = async (period: string = '7d'): Promise<AnalyticsData> => {
  const response = await api.get<AnalyticsData>(`/api/analytics?period=${period}`);
  return response.data;
};

const getRealTimeAnalytics = async (): Promise<RealTimeAnalytics> => {
  const response = await api.get<RealTimeAnalytics>('/api/analytics/realtime');
  return response.data;
};

export const analyticsService = {
  getAnalytics,
  getRealTimeAnalytics,
};
