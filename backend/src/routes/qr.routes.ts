import { Router } from 'express';
import { getMyQRCode, scanQRCode, getOccupancy } from '../controllers/qr.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Get current user's QR code (Student or Admin)
router.get('/my-code', authenticateToken, getMyQRCode);

// Scan QR code (Admin only)
router.post('/scan', authenticateToken, requireRole([Role.ADMIN]), scanQRCode);

// Get current occupancy status (authenticated users)
router.get('/occupancy', authenticateToken, getOccupancy);

export default router;

