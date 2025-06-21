import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Memory from '../models/Memory.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { transcribeAudio } from '../utils/transcription.js';
import { generateAIAnalysis, generateAIAnalyzedTimeline } from '../utils/aiAnalysis.js';
import { logMemoryToNotion } from '../utils/notion.js';
import fs from 'fs';

// --- Create Memory Functions ---

const createTextMemory = asyncHandler(async (req, res) => {
    const { title, description, location } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
        throw new ApiError(400, 'Title and description are required for a text memory.');
    }

    let imageUrl;
    if (req.file) {
        const imageResult = await uploadToCloudinary(req.file.path);
        imageUrl = imageResult.url;
    }

    const { summary, mood } = await generateAIAnalysis({ textContent: `${title}. ${description}` });

    const memory = await Memory.create({
        userId,
        title,
        description,
        location: location || '',
        imageUrl:imageUrl||null,
        type: 'text',
        aiSummary: summary,
        mood: mood,
    });
    
    // Log to Notion asynchronously
   

    res.status(201).json(new ApiResponse(201, memory, 'Text memory created successfully.'));
});

const createVoiceMemory = asyncHandler(async (req, res) => {
    const { title, location } = req.body;
    const userId = req.user.id;
    
    const voiceFile = req.files?.voice?.[0];
    const imageFile = req.files?.image?.[0];

    if (!title) {
        throw new ApiError(400, 'Title is required for a voice memory.');
    }
    if (!voiceFile) {
        throw new ApiError(400, 'A voice recording is required.');
    }

    let imageUrl;
    if (imageFile) {
        const imageResult = await uploadToCloudinary(imageFile.path);
        imageUrl = imageResult.url;
    }
    
    // Process audio
    const transcriptionResult = await transcribeAudio(voiceFile.path);
    const audioResult = await uploadToCloudinary(voiceFile.path);

    const { summary, mood } = await generateAIAnalysis({ textContent: `${title}. ${transcriptionResult.text}` });

    const memory = await Memory.create({
        userId,
        title,
        location: location || '',
        type: 'voice',
        audioUrl: audioResult.url,
        imageUrl:imageUrl||null,
        duration: audioResult.duration,
        description: transcriptionResult.text,
        aiSummary: summary,
        mood: mood,
    });
    
    // Log to Notion asynchronously
   
    
    // Clean up local files
    fs.unlinkSync(voiceFile.path);
    if(imageFile) fs.unlinkSync(imageFile.path);

    res.status(201).json(new ApiResponse(201, memory, 'Voice memory created successfully.'));
});


// --- Get Memory Functions ---

const getAllMemories = asyncHandler(async (req, res) => {
    const memories = await Memory.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, memories));
});

const searchMemories = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(200).json(new ApiResponse(200, [], "Please provide a search query."));
    }

    const memories = await Memory.find({
        userId: req.user.id,
        $text: { $search: q }
    }, {
        score: { $meta: "textScore" }
    }).sort({
        score: { $meta: "textScore" }
    });

    res.status(200).json(new ApiResponse(200, memories));
});

const getMemoriesByMood = asyncHandler(async (req, res) => {
    const memories = await Memory.find({ 
        userId: req.user.id,
        mood: { $regex: new RegExp(`^${req.params.mood}`, 'i') } // Case-insensitive search
    }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, memories));
});

const getMemoriesByDate = asyncHandler(async (req, res) => {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const memories = await Memory.find({
        userId: req.user.id,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    res.status(200).json(new ApiResponse(200, memories));
});

const getAvailableMoods = asyncHandler(async (req, res) => {
    const moods = await Memory.distinct('mood', { userId: req.user.id });
    res.status(200).json(new ApiResponse(200, moods));
});


// --- Timeline & Milestone Functions ---

const getAITimeline = asyncHandler(async (req, res) => {
    const memories = await Memory.find({ userId: req.user.id }).sort({ createdAt: 'desc' }).select('title createdAt aiSummary').lean();

    if (memories.length < 5) { // Needs a minimum number of memories to be effective
        return res.status(200).json(new ApiResponse(200, {
            timeline: [],
            message: "Not enough memories to generate an AI timeline. Keep adding memories!"
        }));
    }

    const memoryList = memories.map(m => `Date: ${m.createdAt.toISOString().split('T')[0]}, Title: ${m.title}, Summary: ${m.aiSummary}`).join('\n');
    
    const prompt = `
    Analyze the following list of memories and group them into 3-5 distinct, meaningful clusters based on recurring themes, topics, or life events.
    For each cluster, create a "milestone". Each milestone must have:
    1. A short, evocative title (e.g., "The California Trip", "Learning to Code", "Summer of '23").
    2. A one-sentence summary of the theme.
    3. An appropriate emoji.
    4. The start and end dates of the memories in that cluster.
    
    Memories to analyze:
    ${memoryList}
    
    Format the output as a clean JSON array of milestone objects, like this:
    [
      {
        "title": "Milestone Title",
        "summary": "A summary of this period.",
        "emoji": "✈️",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD"
      }
    ]
    `;

    const timeline = await generateAIAnalyzedTimeline({ prompt });

    res.status(200).json(new ApiResponse(200, JSON.parse(timeline)));
});


const getMilestones = asyncHandler(async (req, res) => {
    // This is now handled by getAITimeline.
    // This could be adapted to return user-defined milestones in the future if that feature is added.
    res.status(200).json(new ApiResponse(200, [], "AI Timeline is now the primary method. Use /api/memory/timeline."));
});

const getMemoriesForMilestone = asyncHandler(async (req, res) => {
    // This is complex with dynamic AI milestones. For now, we can search memories
    // based on the title of the milestone provided in the query.
    const { title, startDate, endDate } = req.query;

    if (!title || !startDate || !endDate) {
        throw new ApiError(400, "Milestone 'title', 'startDate', and 'endDate' are required query parameters.");
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Ensure it includes the whole end day

    const memories = await Memory.find({
        userId: req.user.id,
        createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 'asc' });

    res.status(200).json(new ApiResponse(200, memories, `Memories for milestone: ${title}`));
});


export {
    createTextMemory,
    createVoiceMemory,
    getAllMemories,
    searchMemories,
    getMemoriesByMood,
    getMemoriesByDate,
    getAvailableMoods,
    getAITimeline,
    getMilestones,
    getMemoriesForMilestone,
}; 