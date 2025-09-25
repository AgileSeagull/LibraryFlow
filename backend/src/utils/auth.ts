import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with its hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string, role: Role): string => {
  const payload = {
    userId,
    role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): { userId: string; role: Role } => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate unique QR code for user (UUID-based)
 */
export const generateQRCode = (): string => {
  return `LF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};
