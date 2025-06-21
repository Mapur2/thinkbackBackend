import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from './routes/auth.js';
import memoryRoutes from './routes/memory.js';
const app = express()

app.use(cors({
    origin: "*",
    methods: ["*"],
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())
app.use('/api/auth', authRoutes);
app.use('/api/memory', memoryRoutes);
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is up"
    })
})




export { app }


