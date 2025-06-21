import mongoose from 'mongoose';

const wellbeingInsightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Ensures only one insight document per user can exist
  },
  trend: {
    type: String,
    required: true,
  },
  suggestion: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String, // URL for the AI-generated image
    required: false
  },
  seen: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for efficient querying by user
wellbeingInsightSchema.index({ userId: 1 });

export default mongoose.model('WellbeingInsight', wellbeingInsightSchema); 