import mongoose, { connect } from "mongoose";
let connectdb = async()=>{
    try{
        await mongoose.connect(process.env.Mongo_URI);
        console.log("connect to database");
    }catch(err){
        console.log(err);
    }
}
export default connectdb;

