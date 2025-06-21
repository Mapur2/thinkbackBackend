import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
import { ApiError } from './ApiError.js';

cloudinary.config({
    cloud_name:"dl6qnuiud",
    api_key:"585514673928671",
    api_secret:"pI7vMJV4qTuKffOLRzVJMRCpCjQ"
});


const uploadToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new ApiError(400, 'File path is required for upload.');
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto',
            folder: 'echohar',
        });

        console.log('File uploaded to Cloudinary successfully:', response.url);
        // fs.unlinkSync(localFilePath); // CRITICAL: This line is removed. Controller will handle cleanup.
        return response;
    } catch (error) {
        // fs.unlinkSync(localFilePath); // CRITICAL: This line is removed. Let controller manage file even on failure.
        console.error('Cloudinary upload failed:', error);
        throw new ApiError(500, 'Failed to upload file to Cloudinary.');
    }
};

export { uploadToCloudinary };