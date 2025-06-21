import express from 'express';
import { 
  createMemory, 
  getMemories, 
  getMemoryById, 
  updateMemory, 
  deleteMemory,
  searchMemories,
  getMemoriesByMood,
  getMemoriesByDate,
  getAllMoods,
  getTimeline,
  getMemoryReel,
  getMilestoneMemories
} from '../controllers/memoryController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// All routes require authentication
router.use(verifyJWT);

// Memory CRUD operations
router.post('/create', upload.single('audio'), createMemory);
router.get('/', getMemories);
router.get('/search', searchMemories);
router.get('/moods', getAllMoods);
router.get('/timeline', getTimeline);
router.get('/timeline/:milestoneId/memories', getMilestoneMemories);
router.get('/reel', getMemoryReel);
router.get('/mood/:mood', getMemoriesByMood);
router.get('/date/:date', getMemoriesByDate);
router.get('/:id', getMemoryById);
router.put('/:id', updateMemory);
router.delete('/:id', deleteMemory);

export default router; 