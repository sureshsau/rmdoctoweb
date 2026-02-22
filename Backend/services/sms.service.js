import axios from "axios";
import dotenv from "dotenv";
dotenv.config();



export const sendLoginOtpSms = async ({ mobile, otp }) => {
  try {
    mobile = String(mobile).replace(/\D/g, "");

    const formattedMobile = mobile.startsWith("91")
      ? mobile
      : `91${mobile}`;

    const expiryMinutes = 5;

    // 🧪 DEV MODE
    if (process.env.NODE_ENV !== "production") {
      console.log("🧪 DEV OTP:", otp);
      return { success: true, message: "OTP simulated (DEV MODE)" };
    }

    const response = await axios.post(
      "https://control.msg91.com/api/v5/flow/",
      {
        template_id: process.env.MSG91_LOGIN_TEMPLATE_ID,
        short_url: "0",
        recipients: [
          {
            mobiles: formattedMobile,
            numeric1: otp,          // ##numeric1##
            numeric2: expiryMinutes // ##numeric2##
          }
        ]
      },
      {
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          "content-type": "application/json"
        }
      }
    );
    console.log(response);
    return response.data;

  } catch (err) {
    console.error("SMS ERROR:", err.response?.data || err.message);
    throw new Error("Failed to send OTP SMS");
  }
};

