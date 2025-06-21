import mongoose from 'mongoose';

const lockedInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required.'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required.'],
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  unlockDate: {
    type: Date,
    required: [true, 'Unlock date is required.']
  },
  imageUrl: {
    type: String // Optional Cloudinary URL for a single image
  },
}, { 
  timestamps: true 
});

// Index for efficient querying by user and unlock date
lockedInSchema.index({ userId: 1, unlockDate: 1 });

export default mongoose.model('LockedIn', lockedInSchema); 