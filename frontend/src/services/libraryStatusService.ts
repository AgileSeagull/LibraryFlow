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

export interface LibraryStatus {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  message?: string;
  isAutoScheduled: boolean;
  autoOpenTime?: string;
  autoCloseTime?: string;
  maintenanceMessage?: string;
  lastUpdated: string;
}

export interface LibraryStatusUpdate {
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  message?: string;
  isAutoScheduled?: boolean;
  autoOpenTime?: string;
  autoCloseTime?: string;
  maintenanceMessage?: string;
}

export interface LibraryStatusHistory {
  id: string;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  message?: string;
  isAutoScheduled: boolean;
  autoOpenTime?: string;
  autoCloseTime?: string;
  maintenanceMessage?: string;
  updatedAt: string;
  updatedBy?: string;
}

const getLibraryStatus = async (): Promise<LibraryStatus> => {
  const response = await api.get<LibraryStatus>('/api/library-status');
  return response.data;
};

const updateLibraryStatus = async (data: LibraryStatusUpdate): Promise<LibraryStatus> => {
  const response = await api.put<LibraryStatus>('/api/library-status', data);
  return response.data;
};

const getLibraryStatusHistory = async (): Promise<LibraryStatusHistory[]> => {
  const response = await api.get<LibraryStatusHistory[]>('/api/library-status/history');
  return response.data;
};

export const libraryStatusService = {
  getLibraryStatus,
  updateLibraryStatus,
  getLibraryStatusHistory
};
