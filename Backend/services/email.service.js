import { transporter } from "../config/Email.js";


export const EmailOtp = async (email, otp) => {
  console.log('email send');
  await transporter.sendMail({
    from: `RMDOCTO <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Your OTP | RMDOCTO",
   html: `
  <div style="
    width: 100%;
    background: #f9f1f1;
    padding: 40px 0;
    font-family: Arial, sans-serif;
  ">
    <div style="
      max-width: 480px;
      margin: auto;
      background: #ffffff;
      border-radius: 10px;
      padding: 30px;
      border: 1px solid #ffd6d6;
      box-shadow: 0px 4px 10px rgba(255, 100, 100, 0.1);
    ">
      <h2 style="
        color: #d72638;
        text-align: center;
        margin-bottom: 20px;
      ">
        RMDOCTO Email Verification
      </h2>

      <p style="
        color: #444;
        font-size: 15px;
        line-height: 1.6;
      ">
        Hello,  
        <br><br>
        Use the OTP below to verify your email for RMDOCTO:
      </p>

      <div style="
        text-align: center;
        margin: 25px 0;
      ">
        <div style="
          display: inline-block;
          padding: 14px 28px;
          font-size: 24px;
          font-weight: bold;
          color: #ffffff;
          background: #d72638;
          border-radius: 8px;
          letter-spacing: 4px;
        ">
          ${otp}
        </div>
      </div>

      <p style="
        color: #777;
        font-size: 13px;
        line-height: 1.6;
        text-align: center;
      ">
        This OTP will expire in 10 minutes.  
        <br>
        If you did not request this, please ignore this email.
      </p>

      <hr style="border: none; border-top: 1px dashed #ffd6d6; margin: 25px 0;">

      <p style="text-align: center; color: #aaa; font-size: 12px;">
        © RMDOCTO — Automated System Email
      </p>
    </div>
  </div>
`
});
};




