import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  getPerformanceStats,
  deletePerformanceReview,
} from '../controllers/performance.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getPerformanceReviews);
router.post('/', createPerformanceReview);
router.put('/:id', updatePerformanceReview);
router.get('/stats', getPerformanceStats);
router.delete('/:id', deletePerformanceReview);

export default router;
