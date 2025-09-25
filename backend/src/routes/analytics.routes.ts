import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import {
  getAnalytics,
  getRealTimeAnalytics
} from '../controllers/analytics.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Get comprehensive analytics data
router.get('/', getAnalytics);

// Get real-time analytics for live updates
router.get('/realtime', getRealTimeAnalytics);

export default router;
