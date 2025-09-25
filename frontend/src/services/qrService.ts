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

export interface QRCodeResponse {
  message: string;
  qrCode: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface ScanResult {
  success: boolean;
  type: 'ENTRY' | 'EXIT';
  currentOccupancy: number;
  maxCapacity: number;
  isAtCapacity: boolean;
  userName: string;
  timestamp: string;
}

export interface OccupancyStatus {
  currentOccupancy: number;
  maxCapacity: number;
  isAtCapacity: boolean;
}

/**
 * Get current user's QR code
 */
export const getMyQRCode = async (): Promise<QRCodeResponse> => {
  const response = await api.get('/api/qr/my-code');
  return response.data;
};

/**
 * Scan a QR code (Admin only)
 */
export const scanQRCode = async (qrCode: string): Promise<ScanResult> => {
  const response = await api.post('/api/qr/scan', { qrCode });
  return response.data;
};

/**
 * Get current occupancy status
 */
export const getOccupancy = async (): Promise<OccupancyStatus> => {
  const response = await api.get('/api/occupancy');
  return response.data;
};

/**
 * Update max capacity (Admin only)
 */
export const updateMaxCapacity = async (maxCapacity: number): Promise<OccupancyStatus> => {
  const response = await api.put('/api/occupancy', { maxCapacity });
  return response.data;
};

const qrService = {
  getMyQRCode,
  scanQRCode,
  getOccupancy,
  updateMaxCapacity
};

export default qrService;

