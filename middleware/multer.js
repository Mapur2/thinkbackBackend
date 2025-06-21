import multer from "multer"
import path from "path"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp')
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const fileFilter = (req, file, cb) => {
    const allowedAudioMimes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/m4a', 'audio/ogg', 'audio/aac', 'audio/x-m4a'];
    const allowedImageMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedAudioMimes.includes(file.mimetype) || allowedImageMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only audio and image files are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // Increased to 100MB for flexibility
    }
})

export default upload