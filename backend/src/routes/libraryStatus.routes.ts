import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireRole } from '../middleware/role';
import { 
  getLibraryStatus, 
  updateLibraryStatus, 
  getLibraryStatusHistory 
} from '../controllers/libraryStatus.controller';

const router = Router();

// Public route to get current library status
router.get('/', getLibraryStatus);

// Protected routes (Admin only)
router.put('/', authenticateToken, requireRole(['ADMIN']), updateLibraryStatus);
router.get('/history', authenticateToken, requireRole(['ADMIN']), getLibraryStatusHistory);

export default router;
