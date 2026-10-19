import { Router } from 'express';
import { scanReceipt } from '../controllers/aiController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticateToken);

// AI Receipt Scan Endpoint
router.post('/scan-receipt', scanReceipt);

export default router;
