import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { getOccupancyStatus, updateOccupancy, setMaxCapacity } from '../controllers/occupancy.controller';

const router = express.Router();

// GET /api/occupancy - Get current occupancy status (Public)
router.get('/', getOccupancyStatus);

// POST /api/occupancy/update - Update occupancy (Admin only)
router.post('/update', authenticateToken, requireRole(['ADMIN']), updateOccupancy);

// PUT /api/occupancy/max-capacity - Set max capacity (Admin only)
router.put('/max-capacity', authenticateToken, requireRole(['ADMIN']), setMaxCapacity);

export default router;