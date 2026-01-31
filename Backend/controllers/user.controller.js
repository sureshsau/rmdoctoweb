import USER from "../models/user.model.js";
import AppError from "../utils/AppError.js"
import { createUserService } from "../services/user.service.js";


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



export const createUser = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;

    if (!name || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Name and phone are required" });
    }

    const result = await createUserService({ name, phone, email });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

