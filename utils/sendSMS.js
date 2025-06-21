
import { Client, Account, ID, Databases, Query } from "appwrite";
import dotenv from "dotenv"
dotenv.config()
const apprwriteid = `${process.env.APPWRITE}`
const url = "https://cloud.appwrite.io/v1"

class Service {
    client = new Client();
    account;
    databases;
    adminClient;

    constructor() {
        this.client.setEndpoint(url).setProject(apprwriteid);
        this.account = new Account(this.client);
        this.databases = new Databases(this.client);
    }
    async getOTP(phone) {
        try {
            const token = await this.account.createPhoneToken(
                ID.unique(),
                phone
            );
            console.log(token)
            const userId = token.userId;
            return userId
        } catch (error) {
            return null
        }
    }

    async verifyOTP(userId, otp) {
        try {
            const verification = await this.account.createSession(userId, otp);
            console.log("OTP Verified:", verification); // This should log the result of the OTP verification
            return verification;
        } catch (error) {
            console.error("Error verifying OTP:", error);
            throw error; // Handle error appropriately
        }
    }
}

const service = new Service();
export default service;
