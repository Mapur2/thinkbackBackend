
import twilio from 'twilio'
import ApiError from './ApiError.js';
const accountSid = `${process.env.TWILIO_API}`;
const authToken = `${process.env.TWILIO_AUTH}`;
const client = twilio(accountSid, authToken);

export const sendNoti=async (phone,content)=>{
    try {
        const message=await client.messages
        .create({
          body:content,
          from: '+12603708155',
          to:`+91${phone}`  
        })
        return message;
    } catch (error) {
        throw new ApiError(400,error.message)
    }
            
}