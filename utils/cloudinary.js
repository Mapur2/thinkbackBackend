import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name:"dl6qnuiud",
    api_key:"585514673928671",
    api_secret:"pI7vMJV4qTuKffOLRzVJMRCpCjQ"
});


const uploadToCloudinary = async (filepath, resourceType = "auto") => {
    try {
        if (!filepath) return null
        
        // Determine resource type based on file extension
        const fileExtension = filepath.split('.').pop().toLowerCase()
        let cloudinaryResourceType = resourceType
        
        if (resourceType === "auto") {
            if (['mp3', 'wav', 'm4a', 'ogg', 'aac', 'webm'].includes(fileExtension)) {
                cloudinaryResourceType = "video" // Cloudinary handles audio as video
            } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                cloudinaryResourceType = "image"
            }
        }
        
        const result = await cloudinary.uploader.upload(filepath, {
            resource_type: cloudinaryResourceType,
            format: fileExtension === 'webm' ? 'mp3' : undefined, // Convert webm to mp3 for better compatibility
        })
        
        // Clean up the temporary file
        fs.unlinkSync(filepath)
        return result
    }
    catch (error) {
        console.log("Cloudinary upload error:", error)
        // Clean up the temporary file even if upload fails
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }
        return null
    }
}

export { uploadToCloudinary }