import AppError from "../utils/AppError.js"
import AttendanceSettings from '../models/attendanceSettings.model.js'

export async function fetchSelfAttendanceSettings(userId) {
  const settings = await AttendanceSettings.findOne({ userId }).lean();

  if (!settings) {
    throw new AppError("Attendance settings not found", 404);
  }

  return settings;
}

export async function fetchAllAttendanceSettings() {
  const settings = await AttendanceSettings.find().lean();
  return settings;
}

export const createAttendanceSetting=async(data)=>{
    try{
        if(!data){
            throw new AppError('missing payload for creating attendance setting');
        }
        console.log(data);
        const attendanceSetting=await AttendanceSettings.findOne({
            userId:data.userId
        });
        if(attendanceSetting){
            return;
        } 
        await AttendanceSettings.create({
            userId:data.userId
        })
    }catch(err){
        throw new AppError("Internal server error while creating Attendance schema",500);
    }
}



export const checkIn=async(data)=>{
    try{
        if(!data){
            throw new AppError('payload is missing',400);
        }
        console.log(data);

    }catch(err){

    }
}