import { Notification } from "../models/notification.model"


export const GetAllNotification = async(req,res) => {
    try{
        let userid = req.userid; //id which is user._id from client side;
    let notifications = await Notification.find({userId: userid}).sort({createdAt: -1});
    return res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
    }catch(err){
         console.error("Error fetching notifications:", err);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error"
    });
    }
}