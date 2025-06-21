import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import memoryRouter from './routes/memory.js';
import authRouter from './routes/auth.js';
import lockedInRouter from './routes/lockedIn.js';
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

// routes declaration
app.use("/api/auth", authRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/locked-in', lockedInRouter);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is up"
    })
})




export { app }


