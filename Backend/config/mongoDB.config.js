import mongoose, { connect } from "mongoose";
import dotenv from 'dotenv'
dotenv.config();
let connectdb = async()=>{
    console.log('mongodb url is',process.env.MONGO_URI);
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("connect to database");
    }catch(err){
        console.log(err);
    }
}
export default connectdb;

