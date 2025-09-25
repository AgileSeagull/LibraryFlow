import axios from 'axios';
import { OccupancyUpdate, SystemConfig, EntryExitLog, QRScanRequest } from '../types';

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

export const apiService = {
  // Occupancy management
  async getOccupancy(): Promise<OccupancyUpdate> {
    const response = await api.get('/api/occupancy');
    return response.data;
  },

  async updateOccupancy(data: { maxCapacity: number }): Promise<SystemConfig> {
    const response = await api.put('/api/occupancy/config', data);
    return response.data;
  },

  // QR Code scanning
  async scanQRCode(data: QRScanRequest): Promise<EntryExitLog> {
    const response = await api.post('/api/qr/scan', data);
    return response.data;
  },

  // Entry/Exit logs
  async getLogs(): Promise<EntryExitLog[]> {
    const response = await api.get('/api/logs');
    return response.data;
  },

  async getLogsByUser(userId: string): Promise<EntryExitLog[]> {
    const response = await api.get(`/api/logs/user/${userId}`);
    return response.data;
  },

  // System health
  async getHealth(): Promise<any> {
    const response = await api.get('/api/health');
    return response.data;
  }
};
