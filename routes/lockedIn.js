import { Router } from 'express';
import { createLockedIn, getAllLockedIn } from '../controllers/lockedInController.js';
import {verifyJWT} from '../middleware/verifyJWT.js';
import lockedInUpload from '../middleware/lockedInUpload.js';

const router = Router();

// Secure all routes
router.use(verifyJWT);

// POST /api/locked-in/ - Create a new locked-in message
router.post(
    '/', 
    lockedInUpload.single('image'), // 'image' is the field name for the single file
    createLockedIn
);

// GET /api/locked-in/ - Get all locked-in messages for the user
router.get('/', getAllLockedIn);

export default router; 