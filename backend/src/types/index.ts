import { User, Role, EntryExitLog, LogType, SystemConfig } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
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

export interface QRScanRequest {
  qrCode: string;
  type: LogType;
}

export interface OccupancyUpdate {
  currentOccupancy: number;
  maxCapacity: number;
  isAtCapacity: boolean;
}

export interface SystemConfigUpdate {
  maxCapacity: number;
}

// Re-export Prisma types
export { User, Role, EntryExitLog, LogType, SystemConfig };
