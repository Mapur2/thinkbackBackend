import multer from "multer";
import path from "path";

// Configure disk storage for temporary files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to allow only image types
const fileFilter = (req, file, cb) => {
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedImageMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images (jpeg, png, gif, webp) are allowed.'), false);
    }
};

// Create the multer instance
const lockedInUpload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25MB per file
    }
});

export default lockedInUpload; 