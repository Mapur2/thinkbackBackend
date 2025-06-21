import { Router } from 'express';
import { getLatestInsight, markInsightAsSeen } from '../controllers/wellbeingController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

// Secure all routes
router.use(verifyJWT);

// GET /api/wellbeing/ - Get the latest unseen wellbeing insight for the user
router.get('/', getLatestInsight);

// PATCH /api/wellbeing/:insightId/seen - Mark an insight as seen
router.delete('/:insightId/seen', markInsightAsSeen);

export default router; 