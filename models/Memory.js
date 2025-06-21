import mongoose from 'mongoose';

const memorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['voice', 'text'], // Simplified types
    required: true,
  },
  description: { // For text memories
    type: String,
    trim: true,
  },
  audioUrl: { // For voice memories
    type: String,
  },
  imageUrl: { // Optional image for both types
    type: String,
  },
  aiSummary: { // Will be made smaller
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    min: 0
  },
  mood: { // Will now store 'emoji + mood' from AI
    type: String,
  },
  location: { // Simplified to a string
    type: String,
    trim: true,
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
memorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Memory', memorySchema); 