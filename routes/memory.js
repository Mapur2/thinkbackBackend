import { Router } from 'express';
import { 
  getAllMemories, 
  searchMemories, 
  getMemoriesByMood, 
  getMemoriesByDate, 
  getAvailableMoods,
  getMilestones,
  getMemoriesForMilestone,
  getAITimeline,
  createVoiceMemory,
  createTextMemory
} from '../controllers/memoryController.js';
import {verifyJWT} from '../middleware/verifyJWT.js';
import upload from '../middleware/multer.js';

const router = Router();

// Secure all routes
router.use(verifyJWT);

// Create Memory Routes
router.post(
  '/text', 
  upload.single('image'), // Optional image upload
  createTextMemory
);

router.post(
  '/voice', 
  upload.fields([
    { name: 'voice', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), 
  createVoiceMemory
);

// Get Memory Routes
router.get('/all', getAllMemories);
router.get('/search', searchMemories);
router.get('/mood/:mood', getMemoriesByMood);
router.get('/date/:date', getMemoriesByDate);
router.get('/moods', getAvailableMoods);

// Timeline & Milestone Routes
router.get('/milestones', getMilestones);
router.get('/milestone/:milestoneId/memories', getMemoriesForMilestone);
router.get('/timeline', getAITimeline);

export default router; 