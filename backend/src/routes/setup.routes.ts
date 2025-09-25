import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Temporary route to create admin user (remove in production)
router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@library.com' }
    });

    if (existingAdmin) {
      return res.json({
        message: 'Admin user already exists',
        email: existingAdmin.email,
        qrCode: existingAdmin.qrCode
      });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const qrCode = crypto.randomBytes(8).toString('hex').toUpperCase();

    const admin = await prisma.user.create({
      data: {
        email: 'admin@library.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        qrCode: qrCode
      }
    });

    res.json({
      message: 'Admin user created successfully',
      email: admin.email,
      password: 'admin123',
      qrCode: admin.qrCode,
      role: admin.role
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

export default router;
