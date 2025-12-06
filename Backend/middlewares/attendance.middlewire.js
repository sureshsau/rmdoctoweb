import AppError from "../utils/AppError.js"

const getAttendaceSettings=async(req,res)=>{
    try{
        
    }catch(err){
        throw new AppError('Internal server error while fetching attendance settings',500);
    }
}