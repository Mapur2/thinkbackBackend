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
    enum: ['voice', 'text', 'dream'],
    default: 'voice'
  },
  audioUrl: {
    type: String, // Cloudinary URL
    required: function() { return this.type === 'voice'; }
  },
  transcription: {
    type: String,
    trim: true
  },
  aiSummary: {
    type: String,
    trim: true
  },
  duration: {
    type: Number, // in seconds
    min: 0
  },
  mood: {
    type: String,
    enum: ["anger","nostalgic",'joy', 'sadness', 'excitement', 'calm', 'anxiety', 'gratitude', 'curious', 'regret'],
    required: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [Number] // [longitude, latitude]
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
memorySchema.index({ userId: 1, createdAt: -1 });
memorySchema.index({ userId: 1, mood: 1 });
memorySchema.index({ userId: 1, tags: 1 });

export default mongoose.model('Memory', memorySchema); 