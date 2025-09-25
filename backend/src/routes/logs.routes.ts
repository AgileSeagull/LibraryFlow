import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import {
  getEntryExitLogs,
  getLogStatistics,
  getRecentActivity,
  exportLogs
} from '../controllers/logs.controller';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Get entry/exit logs with filtering and pagination
router.get('/', getEntryExitLogs);

// Get log statistics
router.get('/statistics', getLogStatistics);

// Get recent activity
router.get('/recent', getRecentActivity);

// Export logs to CSV
router.get('/export', exportLogs);

export default router;
