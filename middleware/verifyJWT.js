import User from '../models/User.js'
import {ApiError} from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import jwt from 'jsonwebtoken'

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            throw new ApiError(401, "Unauthorized Access - No token provided")
        }

        // Verify JWT token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN)
        
        // Check if token has the expected structure
        if (!decodedToken.id) {
            throw new ApiError(401, "Invalid token structure")
        }

        // Find user by ID (works for both regular and Google OAuth users)
        const user = await User.findById(decodedToken.id).select("-password")

        if (!user) {
            throw new ApiError(401, "User not found - Invalid access token")
        }

        // Add user to request object
        req.user = user
        next()
    } catch (error) {
        console.log("JWT Verification Error:", error.message)
        
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid access token")
        } else if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Access token expired")
        } else {
            throw new ApiError(401, error?.message || "Invalid access token")
        }
    }
})

export { verifyJWT }