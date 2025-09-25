import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: Role;
  };
}

/**
 * Middleware to authenticate JWT token
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid JWT token in the Authorization header'
      });
    }

    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'The user associated with this token no longer exists'
      });
    }

    req.user = {
      userId: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid or expired token',
      message: 'Please login again to get a new token'
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This resource requires one of the following roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Convenience middleware for admin-only routes
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  return requireRole([Role.ADMIN])(req, res, next);
};
