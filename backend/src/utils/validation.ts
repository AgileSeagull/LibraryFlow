import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * User registration validation schema
 */
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  role: z.enum(['ADMIN', 'STUDENT']).optional().default('STUDENT')
});

/**
 * User login validation schema
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required')
});

/**
 * Password update validation schema
 */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'New password must contain at least one lowercase letter, one uppercase letter, and one number')
});

/**
 * User profile update validation schema
 */
export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .optional()
});

/**
 * System configuration validation schema
 */
export const systemConfigSchema = z.object({
  maxCapacity: z.number()
    .int('Max capacity must be an integer')
    .min(1, 'Max capacity must be at least 1')
    .max(10000, 'Max capacity cannot exceed 10,000')
});

/**
 * Entry/Exit log validation schema
 */
export const entryExitLogSchema = z.object({
  type: z.enum(['ENTRY', 'EXIT'])
});

// Type exports for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SystemConfigInput = z.infer<typeof systemConfigSchema>;
export type EntryExitLogInput = z.infer<typeof entryExitLogSchema>;
