import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getShifts,
  createShift,
  updateShift,
  assignShift,
  getShiftAssignments,
  deleteShiftAssignment,
} from '../controllers/shift.controller';

const router = express.Router();

router.use(authenticate);

router.get('/', getShifts);
router.post('/', createShift);
router.put('/:id', updateShift);
router.post('/assign', assignShift);
router.get('/assignments', getShiftAssignments);
router.delete('/assignments/:id', deleteShiftAssignment);

export default router;
