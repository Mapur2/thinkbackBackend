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

// File filter for audio files
const fileFilter = (req, file, cb) => {
    // Check if it's an audio file
    if (file.fieldname === 'audio') {
        const allowedMimes = [
            'audio/webm',
            'audio/mp3',
            'audio/mpeg',
            'audio/wav',
            'audio/wave',
            'audio/x-wav',
            'audio/m4a',
            'audio/ogg',
            'audio/aac',
            'audio/x-m4a'
        ]
        
        const allowedExtensions = ['.webm', '.mp3', '.wav', '.m4a', '.ogg', '.aac']
        const fileExtension = path.extname(file.originalname).toLowerCase()
        
        // Check MIME type first
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true)
        }
        // Fallback to file extension check
        else if (allowedExtensions.includes(fileExtension)) {
            console.log(`File accepted by extension: ${fileExtension}, MIME: ${file.mimetype}`)
            cb(null, true)
        }
        else {
            console.log(`File rejected - Extension: ${fileExtension}, MIME: ${file.mimetype}`)
            cb(new Error(`Invalid audio file type. Allowed: webm, mp3, wav, m4a, ogg, aac. Got: ${file.mimetype} (${fileExtension})`), false)
        }
    } else {
        cb(null, true)
    }
}

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for audio files
        files: 1 // Only one file at a time
    }
})

export default upload