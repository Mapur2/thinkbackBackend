import dotenv from "dotenv"
import connectDB from "./db/db.js";
import {app} from './app.js'
import { startWellbeingScheduler } from './wellbeingScheduler.js';
dotenv.config()


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`⚙️  Server is running at port : ${process.env.PORT || 8000}`);
        
        // Start the wellbeing tracker scheduler
        startWellbeingScheduler();
    })
})
.catch((err)=>{
    console.log("Cannot Start App");
})

