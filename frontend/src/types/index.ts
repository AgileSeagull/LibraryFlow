export enum Role {
  ADMIN = 'ADMIN',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  qrCode: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export enum LogType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT'
}

export interface EntryExitLog {
  id: string;
  userId: string;
  type: LogType;
  timestamp: string;
  user?: User;
}

export interface SystemConfig {
  id: string;
  maxCapacity: number;
  currentOccupancy: number;
  updatedAt: string;
}

export interface OccupancyUpdate {
  currentOccupancy: number;
  maxCapacity: number;
  isAtCapacity: boolean;
}

export interface QRScanRequest {
  qrCode: string;
  type: LogType;
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationErrors {
  [key: string]: string;
}
