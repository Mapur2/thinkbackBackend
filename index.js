import dotenv from "dotenv"
import connectDB from "./db/db.js";
import {app} from './app.js'
dotenv.config()


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log("Started app at ",process.env.PORT);
        
    })
})
.catch((err)=>{
    console.log("Cannot Start App");
})

