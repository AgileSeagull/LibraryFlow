import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { 
  getOccupancyStats, 
  updateMaxCapacity, 
  adjustOccupancy, 
  getOccupancyAnalytics 
} from '../controllers/adminOccupancy.controller';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// Get comprehensive occupancy statistics
router.get('/stats', getOccupancyStats);

// Update maximum capacity
router.put('/max-capacity', updateMaxCapacity);

// Manually adjust occupancy count
router.post('/adjust', adjustOccupancy);

// Get occupancy analytics
router.get('/analytics', getOccupancyAnalytics);

export default router;
