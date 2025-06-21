import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import LockedIn from '../models/LockedIn.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import fs from 'fs';

const createLockedIn = asyncHandler(async (req, res) => {
    const { title, message, category, unlockDate } = req.body;
    const userId = req.user.id;

    if (!title || !message || !unlockDate) {
        throw new ApiError(400, 'Title, message, and unlock date are required.');
    }

    if (new Date(unlockDate) <= new Date()) {
        throw new ApiError(400, 'Unlock date must be in the future.');
    }

    let imageUrl;
    const file = req.file;

    if (file) {
        try {
            const uploadResult = await uploadToCloudinary(file.path);
            imageUrl = uploadResult.url;
            // Clean up the local file after successful upload
            fs.unlinkSync(file.path);
        } catch (error) {
            // Clean up local file even if upload fails
            fs.unlinkSync(file.path);
            throw new ApiError(500, 'Image upload failed.');
        }
    }

    const lockedInData = {
        userId,
        title,
        message,
        category: category || '',
        unlockDate,
        imageUrl
    };

    const lockedInMessage = await LockedIn.create(lockedInData);

    res.status(201).json(new ApiResponse(201, lockedInMessage, 'Message locked in for the future!'));
});

const getAllLockedIn = asyncHandler(async (req, res) => {
    const messages = await LockedIn.find({ userId: req.user.id })
                                     .sort({ unlockDate: 'asc' }); // Sort by soonest unlock date first
    
    res.status(200).json(new ApiResponse(200, messages));
});

export {
    createLockedIn,
    getAllLockedIn
}; 