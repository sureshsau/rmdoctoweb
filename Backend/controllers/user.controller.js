import USER from "../models/user.model.js";
import AppError from "../utils/AppError.js"



export const getAllUserController=async(req,res)=>{
    try{
        const users=await USER.find().select("_id name email phone userType profiles").lean();
        return res.status(200).json({
            message:"user fetch successfully",
            users:users,
            length:users.length
        })

    }catch(err){
        console.log("error in getAllUserController",err);
        throw new AppError("Intenal sever Error",500);
    }
}