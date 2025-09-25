import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({
      message: 'Users retrieved successfully',
      users,
      count: users.length
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    res.status(200).json({
      message: 'User retrieved successfully',
      user
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
};
