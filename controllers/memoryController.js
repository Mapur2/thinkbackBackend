import Memory from '../models/Memory.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { transcribeAudio } from '../utils/transcription.js';
import { generateAIAnalysis,generateAIAnalyzedTimeline } from '../utils/aiAnalysis.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: "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",
});

// Create a new memory (voice/text/dream)
export const createMemory = asyncHandler(async (req, res) => {
  const { title, type = 'voice', mood, tags, location, isPublic = false } = req.body;
  const userId = req.user.id; // From JWT middleware

  let memoryData = {
    userId,
    title,
    type,
    mood,
    tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    location,
    isPublic
  };

  // Handle voice recording
  if (type === 'voice' && req.file) {
    try {
      console.log('Processing voice memory with file:', req.file.path);
      
      // 1. Transcribe audio first (using file path from multer)
      let transcription = null;
      if (process.env.ENABLE_TRANSCRIPTION === 'true') {
        console.log('Starting transcription...');
        transcription = await transcribeAudio(req.file.path);
        console.log('Transcription result:', transcription);
        memoryData.transcription = transcription;
      }

      // 2. Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const audioResult = await uploadToCloudinary(req.file.path);
      memoryData.audioUrl = audioResult.url;
      memoryData.duration = audioResult.duration;

      // 3. AI Analysis with Gemini
      if (process.env.ENABLE_AI_ANALYSIS === 'true') {
        console.log('Starting AI analysis...');
        const aiAnalysis = await generateAIAnalysis({
          transcription: memoryData.transcription,
          title,
          mood
        });
        memoryData.aiSummary = aiAnalysis.summary;
        
        // Override mood if AI detects different emotion
        if (aiAnalysis.detectedMood && !mood) {
          memoryData.mood = aiAnalysis.detectedMood;
        }
        
        // Add AI suggested tags to existing tags
        if (aiAnalysis.suggestedTags) {
          const suggestedTagsArray = aiAnalysis.suggestedTags.split(',').map(tag => tag.trim());
          const existingTags = memoryData.tags || [];
          const combinedTags = [...new Set([...existingTags, ...suggestedTagsArray])];
          memoryData.tags = combinedTags;
          console.log('Combined tags:', combinedTags);
        }
      }

    } catch (error) {
      console.error('Audio processing error:', error);
      throw new ApiError(500, `Audio processing failed: ${error.message}`);
    }
  }

  // Create memory in database
  console.log('Creating memory in database...');
  const memory = await Memory.create(memoryData);

  res.status(201).json(
    new ApiResponse(201, memory, "Memory created successfully")
  );
});

// Get all memories for a user
export const getMemories = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, type, mood } = req.query;

  const filter = { userId, isArchived: false };
  if (type) filter.type = type;
  if (mood) filter.mood = mood;

  const memories = await Memory.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();

  const total = await Memory.countDocuments(filter);

  res.json(
    new ApiResponse(200, {
      memories,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    }, "Memories retrieved successfully")
  );
});

// Get memory by ID
export const getMemoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const memory = await Memory.findOne({ _id: id, userId });
  if (!memory) {
    throw new ApiError(404, "Memory not found");
  }

  res.json(
    new ApiResponse(200, memory, "Memory retrieved successfully")
  );
});

// Update memory
export const updateMemory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const memory = await Memory.findOneAndUpdate(
    { _id: id, userId },
    updateData,
    { new: true }
  );

  if (!memory) {
    throw new ApiError(404, "Memory not found");
  }

  res.json(
    new ApiResponse(200, memory, "Memory updated successfully")
  );
});

// Delete memory
export const deleteMemory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const memory = await Memory.findOneAndDelete({ _id: id, userId });
  if (!memory) {
    throw new ApiError(404, "Memory not found");
  }

  // TODO: Delete from Cloudinary if it's a voice memory

  res.json(
    new ApiResponse(200, {}, "Memory deleted successfully")
  );
});

// Search memories
export const searchMemories = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { q, type, mood, startDate, endDate } = req.query;

  const filter = { userId, isArchived: false };

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { transcription: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } }
    ];
  }

  if (type) filter.type = type;
  if (mood) filter.mood = mood;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const memories = await Memory.find(filter).sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, memories, "Search completed successfully")
  );
});

// Get memories by mood
export const getMemoriesByMood = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { mood } = req.params;

  const memories = await Memory.find({ 
    userId, 
    mood, 
    isArchived: false 
  }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, memories, "Memories retrieved by mood")
  );
});

// Get AI-powered timeline
export const getTimeline = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const filter = {
      userId,
      isArchived: false,
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    const memories = await Memory.find(filter)
      .sort({ createdAt: -1 })
      .select('title type mood createdAt tags transcription aiSummary')
      .exec();

    // AI-driven milestone generation
    const milestones = await generateAIMilestones(memories);

    res.json(
      new ApiResponse(200, {
        milestones,
        totalMilestones: milestones.length,
      }, "AI-powered timeline retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, `Timeline generation failed: ${error.message}`);
  }
});

// Helper function to generate AI milestones
const generateAIMilestones = async (memories) => {
  if (memories.length < 2) return []; // Clustering needs at least 2 memories

  const memoryTexts = memories.map(m =>
    `${m.title}. ${m.transcription || ''} ${m.tags?.join(', ') || ''}`
  );

  // Use AI to cluster memories
  const clusters = await clusterMemoriesWithAI(memoryTexts);

  // Create milestones from clusters
  const milestones = clusters.map(cluster => {
    if (!cluster.indices || cluster.indices.length === 0) return null;
    
    const primaryMemory = memories[cluster.indices[0]];
    const title = cluster.clusterName;
    
    // Get all memories in the cluster
    const clusterMemories = cluster.indices.map(index => memories[index]);
    
    return {
      title,
      date: primaryMemory.createdAt,
      type: 'ai-generated',
      icon: getIconForTopic(title),
      mood: getDominantMood(clusterMemories),
      memories: clusterMemories.map(m => ({
        _id: m._id,
        title: m.title,
        type: m.type
      })),
      count: cluster.indices.length,
    };
  }).filter(Boolean); // Remove null entries from failed clusters

  return milestones.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// AI function to cluster memories
const clusterMemoriesWithAI = async (memoryTexts) => {
  let completion;
  try {
    const prompt = `
      You are a helpful assistant that organizes memories. Group the following memories into clusters based on shared topics, events, or themes.

      Memories to cluster:
      ${memoryTexts.map((text, index) => `[${index}] ${text}`).join('\n')}

      Your task is to return a valid JSON array of clusters. Each object in the array should have a "clusterName" (a short, descriptive title for the group, like "Trip to Japan" or "Project Phoenix") and an "indices" array (containing the integer indices of the memories belonging to that cluster).

      Example Response Format:
      [
        {
          "clusterName": "Example Trip",
          "indices": [0, 2]
        },
        {
          "clusterName": "Work Project",
          "indices": [1, 3]
        }
      ]

      IMPORTANT: Only output the raw JSON array. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
    `;

    completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
    });

    const response = completion.choices[0]?.message?.content || '[]';
    
    // The model should return a clean JSON string.
    return JSON.parse(response);
  } catch (error) {
    console.error('AI Clustering failed:', error);
    if (error instanceof SyntaxError) {
        console.error("Failed to parse AI response:", completion?.choices[0]?.message?.content);
    }
    return [];
  }
};

// Get memories for a specific milestone
export const getMilestoneMemories = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { milestoneId } = req.params;

  try {
    // Find the milestone memory
    const milestone = await Memory.findOne({ 
      _id: milestoneId, 
      userId, 
      isMilestone: true 
    });

    if (!milestone) {
      throw new ApiError(404, "Milestone not found");
    }

    // Find memories around the milestone date (e.g., within 7 days)
    const milestoneDate = new Date(milestone.createdAt);
    const startDate = new Date(milestoneDate.getTime() - (7 * 24 * 60 * 60 * 1000));
    const endDate = new Date(milestoneDate.getTime() + (7 * 24 * 60 * 60 * 1000));

    const memories = await Memory.find({
      userId,
      isArchived: false,
      isMilestone: false,
      createdAt: { $gte: startDate, $lte: endDate }
    })
    .sort({ createdAt: -1 })
    .select('title type mood createdAt tags');

    res.json(
      new ApiResponse(200, {
        milestone,
        memories,
        totalMemories: memories.length
      }, "Milestone memories retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, `Milestone memories retrieval failed: ${error.message}`);
  }
});

// Get memory reel (curated montage)
export const getMemoryReel = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { mood, timeRange = 'month', limit = 10 } = req.query;

  try {
    const filter = { userId, isArchived: false };
    if (mood) filter.mood = mood;

    // Add time range filter
    const timeRangeFilter = getTimeRangeFilter(timeRange);
    if (timeRangeFilter) {
      filter.createdAt = timeRangeFilter;
    }

    const memories = await Memory.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('title type mood createdAt tags audioUrl transcription aiSummary')
      .exec();

    // Generate reel summary
    const reelSummary = generateReelSummary(memories);

    res.json(
      new ApiResponse(200, {
        memories,
        reelSummary,
        suggestedMusic: getSuggestedMusic(memories)
      }, "Memory reel generated successfully")
    );
  } catch (error) {
    throw new ApiError(500, `Memory reel generation failed: ${error.message}`);
  }
});

// Helper function to group memories by time
const groupMemoriesByTime = (memories, groupBy) => {
  const groups = {};
  
  memories.forEach(memory => {
    const date = new Date(memory.createdAt);
    let key;
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        key = date.getFullYear().toString();
        break;
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(memory);
  });
  
  return Object.entries(groups).map(([period, memories]) => ({
    period,
    memories,
    count: memories.length,
    dominantMood: getDominantMood(memories)
  }));
};

// Helper function to generate milestones
const generateMilestones = (memories) => {
  const milestones = [];
  
  // First memory milestone
  if (memories.length > 0) {
    const firstMemory = memories[memories.length - 1];
    milestones.push({
      type: 'first',
      title: 'First Memory',
      date: firstMemory.createdAt,
      memoryId: firstMemory._id,
      icon: '🎯'
    });
  }
  
  // Mood milestones
  const moodCounts = {};
  memories.forEach(memory => {
    moodCounts[memory.mood] = (moodCounts[memory.mood] || 0) + 1;
  });
  
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count >= 5) {
      const milestoneMemory = memories.find(m => m.mood === mood);
      milestones.push({
        type: 'mood',
        title: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Streak`,
        date: milestoneMemory.createdAt,
        memoryId: milestoneMemory._id,
        icon: getMoodIcon(mood),
        count
      });
    }
  });
  
  // Type milestones
  const typeCounts = {};
  memories.forEach(memory => {
    typeCounts[memory.type] = (typeCounts[memory.type] || 0) + 1;
  });
  
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count >= 3) {
      const milestoneMemory = memories.find(m => m.type === type);
      milestones.push({
        type: 'category',
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Explorer`,
        date: milestoneMemory.createdAt,
        memoryId: milestoneMemory._id,
        icon: getTypeIcon(type),
        count
      });
    }
  });
  
  return milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
};

// Helper function to calculate mood streaks
const calculateMoodStreaks = (memories) => {
  const streaks = {};
  let currentStreak = 1;
  let currentMood = null;
  
  memories.forEach((memory, index) => {
    if (memory.mood === currentMood) {
      currentStreak++;
    } else {
      if (currentMood && currentStreak > 1) {
        streaks[currentMood] = Math.max(streaks[currentMood] || 0, currentStreak);
      }
      currentStreak = 1;
      currentMood = memory.mood;
    }
  });
  
  // Handle last streak
  if (currentMood && currentStreak > 1) {
    streaks[currentMood] = Math.max(streaks[currentMood] || 0, currentStreak);
  }
  
  return streaks;
};

// Helper function to get dominant mood
const getDominantMood = (memories) => {
  const moodCounts = {};
  memories.forEach(memory => {
    if (memory.mood) {
      moodCounts[memory.mood] = (moodCounts[memory.mood] || 0) + 1;
    }
  });

  return Object.keys(moodCounts).length > 0
    ? Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0][0]
    : 'unknown';
};

// Helper function to get time range filter
const getTimeRangeFilter = (timeRange) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return null;
  }
  
  return { $gte: startDate, $lte: now };
};

// Helper function to generate reel summary
const generateReelSummary = (memories) => {
  if (memories.length === 0) return "No memories to show";
  
  const totalMemories = memories.length;
  const dominantMood = getDominantMood(memories);
  const types = [...new Set(memories.map(m => m.type))];
  
  return `A ${totalMemories}-memory journey through ${types.join(', ')} experiences, predominantly ${dominantMood}.`;
};

// Helper function to get suggested music
const getSuggestedMusic = (memories) => {
  const dominantMood = getDominantMood(memories);
  
  const musicSuggestions = {
    joy: 'Upbeat, cheerful melodies',
    sadness: 'Soft, reflective tunes',
    excitement: 'Energetic, dynamic rhythms',
    calm: 'Peaceful, ambient sounds',
    anxiety: 'Soothing, gentle harmonies',
    gratitude: 'Warm, uplifting compositions',
    curious: 'Explorative, mysterious tones',
    regret: 'Melancholic, introspective pieces'
  };
  
  return musicSuggestions[dominantMood] || 'Adaptive mood-based music';
};

// Helper functions for icons
const getMoodIcon = (mood) => {
  const icons = {
    joy: '😊',
    sadness: '😢',
    excitement: '🎉',
    calm: '😌',
    anxiety: '😰',
    gratitude: '🙏',
    curious: '🤔',
    regret: '😔'
  };
  return icons[mood] || '📝';
};

const getTypeIcon = (type) => {
  const icons = {
    voice: '🎤',
    text: '✍️',
    dream: '😴'
  };
  return icons[type] || '📝';
};

// Helper function to get icon for topic
const getIconForTopic = (topic) => {
  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes('job') || lowerTopic.includes('work')) return '💼';
  if (lowerTopic.includes('trip') || lowerTopic.includes('travel')) return '✈️';
  if (lowerTopic.includes('project') || lowerTopic.includes('code')) return '💻';
  if (lowerTopic.includes('breakup') || lowerTopic.includes('heartbreak')) return '💔';
  if (lowerTopic.includes('graduation') || lowerTopic.includes('college')) return '🎓';
  if (lowerTopic.includes('celebration') || lowerTopic.includes('party')) return '🎉';
  return '📝';
};

// Get all available moods
export const getAllMoods = asyncHandler(async (req, res) => {
  const moods = [
    'joy',
    'sadness', 
    'excitement',
    'calm',
    'anxiety',
    'gratitude',
    'curious',
    'regret'
  ];

  res.json(
    new ApiResponse(200, { moods }, "Moods retrieved successfully")
  );
});

// Get memories by date
export const getMemoriesByDate = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;

  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const memories = await Memory.find({
    userId,
    createdAt: { $gte: startDate, $lte: endDate },
    isArchived: false
  }).sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, memories, "Memories retrieved by date")
  );
}); 