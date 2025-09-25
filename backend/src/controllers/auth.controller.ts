import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken, generateQRCode } from '../utils/auth';
import { registerSchema, loginSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate unique QR code
    const qrCode = generateQRCode();

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        qrCode: qrCode
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please check your input data',
        details: error.message
      });
    }

    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(validatedData.password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      qrCode: user.qrCode,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      user: userData,
      token
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Please check your input data',
        details: error.message
      });
    }

    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve profile'
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName } = req.body;

    // Basic validation
    if (!firstName && !lastName) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide at least one field to update'
      });
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        qrCode: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
};
