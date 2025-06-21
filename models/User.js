import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
    trim: true,
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true, // allow guest users without email
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: false, // not required for OAuth or guest
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
  },
  voiceSignature: {
    type: String, // URL or Cloudinary ID
    required: false,
  },
  profileImage: {
    type: String, // URL or Cloudinary ID
    required: false,
  },
}, { timestamps: true });

export default mongoose.model('User', userSchema); 