import mongoose from "mongoose"
const connectDB=async ()=>{
    try{
        const connect = await mongoose.connect(`${process.env.MONGO_URI}`)
    }
    catch(err){
        console.log("Mongo Connect Error",err)
        process.exit(1)
    }
}
export default connectDB