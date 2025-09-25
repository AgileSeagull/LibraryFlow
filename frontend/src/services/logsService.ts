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

export interface LogEntry {
  id: string;
  userId: string;
  type: 'ENTRY' | 'EXIT';
  timestamp: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'STUDENT';
  };
}

export interface LogsFilters {
  userName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LogsResponse {
  logs: LogEntry[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

export interface LogStatistics {
  totalLogs: number;
  entryCount: number;
  exitCount: number;
  uniqueUsers: number;
  todayLogs: number;
  thisWeekLogs: number;
  thisMonthLogs: number;
}

const getEntryExitLogs = async (filters: LogsFilters = {}): Promise<LogsResponse> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await api.get<LogsResponse>(`/api/logs?${params.toString()}`);
  return response.data;
};

const getLogStatistics = async (startDate?: string, endDate?: string): Promise<LogStatistics> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const response = await api.get<LogStatistics>(`/api/logs/statistics?${params.toString()}`);
  return response.data;
};

const getRecentActivity = async (): Promise<LogEntry[]> => {
  const response = await api.get<LogEntry[]>('/api/logs/recent');
  return response.data;
};

const exportLogs = async (filters: LogsFilters = {}): Promise<Blob> => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });

  const response = await api.get(`/api/logs/export?${params.toString()}`, {
    responseType: 'blob'
  });
  return response.data;
};

export const logsService = {
  getEntryExitLogs,
  getLogStatistics,
  getRecentActivity,
  exportLogs,
};
