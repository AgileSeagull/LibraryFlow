import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireAdmin, getAllUsers);

// Get user by ID
router.get('/:id', authenticateToken, getUserById);

export default router;
