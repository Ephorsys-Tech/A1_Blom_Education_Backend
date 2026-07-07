export const managerPasswordUpdateTemplate = (role, name, email, newPassword) => {
  const emailSubject = `Your ${role} Account Password Has Been Updated - A1 Blom Education`;

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #2563eb; text-align: center;">Account Password Updated</h2>
      
      <p>Hello ${name},</p>
      
      <p>The system administrator has updated the password for your <strong>${role}</strong> account at A1 Blom Education.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Login Email:</strong> ${email}</p>
        <p style="margin: 5px 0;"><strong>New Password:</strong> ${newPassword}</p>
      </div>
      
      <p style="color: #dc2626; font-weight: bold;">For security reasons, we strongly recommend keeping this information safe and not sharing it with anyone.</p>
      
      <p>If you experience any issues logging in, please contact the main administrator.</p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #6b7280; text-align: center;">© ${new Date().getFullYear()} A1 Blom Education. All rights reserved.</p>
    </div>
  `;

  return { emailSubject, emailHtml };
};
