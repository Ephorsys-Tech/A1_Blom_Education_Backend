import { sendMail } from "./sendMail.js";

export const sendEmailOTP = async (email, otp) => {
  const subject = "Email Verification OTP - A1 Blom Education";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2563eb; text-align: center;">Verify Your Email Address</h2>
      <p>Hello,</p>
      <p>Thank you for registering with A1 Blom Education. Please use the following One-Time Password (OTP) to verify your email address:</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e3a8a;">${otp}</span>
      </div>
      
      <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">© ${new Date().getFullYear()} A1 Blom Education. All rights reserved.</p>
    </div>
  `;
  return await sendMail(email, subject, html);
};
