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

export interface OccupancyStats {
  currentOccupancy: number;
  maxCapacity: number;
  percentage: number;
  isAvailable: boolean;
  isNearCapacity: boolean;
  isAtCapacity: boolean;
  todayEntries: number;
  todayExits: number;
  activeUsers: number;
  recentLogs: Array<{
    id: string;
    type: 'ENTRY' | 'EXIT';
    timestamp: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  hourlyStats: Array<{
    hour: string;
    entries: number;
    exits: number;
    netChange: number;
  }>;
  lastUpdated: string;
}

export interface OccupancyAnalytics {
  dailyStats: Array<{
    date: string;
    entries: number;
    exits: number;
    netChange: number;
  }>;
  peakHours: Array<{
    hour: string;
    entries: number;
    exits: number;
    netChange: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

export interface AdjustOccupancyRequest {
  action: 'increment' | 'decrement' | 'set';
  amount?: number;
}

const getOccupancyStats = async (): Promise<OccupancyStats> => {
  const response = await api.get<OccupancyStats>('/api/admin/occupancy/stats');
  return response.data;
};

const updateMaxCapacity = async (maxCapacity: number): Promise<OccupancyStats> => {
  const response = await api.put<OccupancyStats>('/api/admin/occupancy/max-capacity', { maxCapacity });
  return response.data;
};

const adjustOccupancy = async (data: AdjustOccupancyRequest): Promise<OccupancyStats> => {
  const response = await api.post<OccupancyStats>('/api/admin/occupancy/adjust', data);
  return response.data;
};

const getOccupancyAnalytics = async (days: number = 7): Promise<OccupancyAnalytics> => {
  const response = await api.get<OccupancyAnalytics>(`/api/admin/occupancy/analytics?days=${days}`);
  return response.data;
};

export const adminOccupancyService = {
  getOccupancyStats,
  updateMaxCapacity,
  adjustOccupancy,
  getOccupancyAnalytics
};
