import * as AuthService   from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const response = await AuthService.register(req.body);
    return res.status(response.status).json(response.body);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const response = await AuthService.verifyOtp({ ...req.body, ip: req.ip, device: req.headers['user-agent'] });
    return res.status(response.status).json(response.body);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};
export const login = async (req, res) => {
  try {
    const response = await AuthService.login({
      ...req.body,
      ip: req.ip,
      device: req.headers["user-agent"]
    });

    return res.status(response.status).json(response.body);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

export const resendOtp = async(req,res)=>{
  try{
    const response = await AuthService.resendOtp(req.body);
    return  res.status(response.status).json(response.body);

  }catch(err){
    return res.status(500).json({error: "server error"});
  }
}



export const forgotPasswordSendOtp = async (req, res) => {
  try {
    const response = await AuthService.forgotPasswordSendOtp(req.body);
    return res.status(response.status).json(response.body);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

export const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const response = await AuthService.forgotPasswordVerifyOtp(req.body);
    return res.status(response.status).json(response.body);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const response = await AuthService.resetPassword(req.body);
    return res.status(response.status).json(response.body);
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
};