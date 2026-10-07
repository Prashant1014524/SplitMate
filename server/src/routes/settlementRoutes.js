import { Router } from 'express';
import { getSettlements, createSettlement, deleteSettlement } from '../controllers/settlementController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSettlements);
router.post('/', createSettlement);
router.delete('/:id', deleteSettlement);

export default router;
