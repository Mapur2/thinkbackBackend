import WellbeingInsight from '../models/WellbeingInsight.js';
import Memory from '../models/Memory.js';
import { analyzeMoodTrend, generateWellbeingSuggestion } from '../utils/aiAnalysis.js';
import { generateSuggestionImage } from '../utils/stability.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'node:fs/promises';

const analyzeUserWellbeing = async (userId) => {
    try {
        console.log(`Starting wellbeing analysis for user: ${userId}`);

        // 1. Check if an insight already exists for the user. If so, stop.
        const existingInsight = await WellbeingInsight.findOne({ userId });
        if (existingInsight) {
            console.log(`Skipping analysis for user ${userId}: an unseen insight already exists.`);
            return;
        }

        // 2. Fetch recent memories (last 3 days)
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentMemories = await Memory.find({
            userId,
            createdAt: { $gte: threeDaysAgo }
        }).select('mood');

        if (recentMemories.length < 3) {
            console.log(`Skipping analysis for user ${userId}: not enough recent memories.`);
            return;
        }

        const moods = recentMemories.map(m => m.mood).filter(Boolean);

        // 3. Analyze mood trend
        const moodAnalysis = await analyzeMoodTrend(moods);
        console.log(`Mood analysis for ${userId}:`, moodAnalysis);

        // 4. Decide if a suggestion is warranted
        if (moodAnalysis.trend !== 'Neutral' && moodAnalysis.confidence >= 60) {
            
            // 5. Generate a suggestion
            const suggestionResult = await generateWellbeingSuggestion(moodAnalysis.trend);
            if (!suggestionResult) {
                console.log(`Failed to generate suggestion for user ${userId}.`);
                return;
            }

            console.log(`Generated suggestion for ${userId}:`, suggestionResult);

            // 7. Generate a related image for the suggestion
            let imageUrl = null;
            const tempImagePath = await generateSuggestionImage(suggestionResult.suggestion);
            
            if (tempImagePath) {
                try {
                    const cloudinaryResult = await uploadToCloudinary(tempImagePath);
                    imageUrl = cloudinaryResult.url;
                } catch (uploadError) {
                    console.error(`Failed to upload suggestion image to Cloudinary for user ${userId}:`, uploadError);
                } finally {
                    // Clean up the temporary file regardless of upload success
                    await fs.unlink(tempImagePath);
                }
            }

            // 8. Save the new insight
            await WellbeingInsight.create({
                userId,
                trend: moodAnalysis.trend,
                suggestion: suggestionResult.suggestion,
                imageUrl, // This will be null if image generation or upload failed
            });
            console.log(`Insight created for user ${userId}.`);

        } else {
            console.log(`User ${userId}'s mood trend is neutral or confidence is too low. No action taken.`);
        }

    } catch (error) {
        if (error.code === 11000) { // This is a duplicate key error, which is expected here
            console.log(`Attempted to create a duplicate insight for user ${userId}. Process stopped as intended.`);
        } else {
            console.error(`An error occurred during wellbeing analysis for user ${userId}:`, error);
        }
    }
};

const getLatestInsight = async (req, res) => {
    // Find the most recent, unseen insight for the user.
    const insight = await WellbeingInsight.findOne({ 
        userId: req.user.id,
        seen: false 
    }).sort({ createdAt: -1 });

    if(insight==null)
        res.status(404).json({
            success: false,
          // This will be null if no unseen insight exists
            message:"No insight available"
        });
    res.status(200).json({
        success: true,
        data: insight // This will be null if no unseen insight exists
    });
};

const markInsightAsSeen = async (req, res) => {
    const { insightId } = req.params;
    
    const insight = await WellbeingInsight.findOneAndDelete(
        { _id: insightId, userId: req.user.id }, // Ensure users can only update their own insights
    );

    if (!insight) {
        return res.status(404).json({ success: false, message: 'Insight not found or you are not authorized to update it.' });
    }

    res.status(200).json({ 
        success: true, 
        message: 'Insight marked as seen.',
        data: insight
    });
};

export { 
    analyzeUserWellbeing,
    getLatestInsight,
    markInsightAsSeen
}; 