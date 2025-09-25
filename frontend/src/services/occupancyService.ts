import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/occupancy`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface OccupancyData {
  currentOccupancy: number;
  maxCapacity: number;
  percentage: number;
  isAvailable: boolean;
  isNearCapacity: boolean;
  isAtCapacity: boolean;
  lastUpdated: string;
}

export const occupancyService = {
  // Get current occupancy status
  async getOccupancyStatus(): Promise<OccupancyData> {
    const response = await api.get('/');
    return response.data;
  },

  // Update occupancy (Admin only)
  async updateOccupancy(increment: boolean): Promise<OccupancyData> {
    const response = await api.post('/update', { increment });
    return response.data;
  },

  // Set max capacity (Admin only)
  async setMaxCapacity(maxCapacity: number): Promise<OccupancyData> {
    const response = await api.put('/max-capacity', { maxCapacity });
    return response.data;
  }
};

export default occupancyService;
