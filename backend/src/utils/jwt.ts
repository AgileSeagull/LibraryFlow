import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export const generateToken = (user: AuthUser): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h'
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
