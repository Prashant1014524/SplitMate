import { Router } from 'express';
import { getGroups, createGroup, getGroupBalances, getGroupById, joinGroup } from '../controllers/groupController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getGroups);
router.post('/', createGroup);
router.get('/:id', getGroupById);
router.post('/:id/join', joinGroup);
router.get('/:id/balances', getGroupBalances);

export default router;
