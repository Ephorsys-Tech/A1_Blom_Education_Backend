const frontendUrl = process.env.frontendUrl;

export const managerAccessTemplate = (role, name, userId, email, password) => {
  const emailSubject = `Welcome to A1 Blom Education - ${
    role === "web-manager" ? "Web" : "App"
  } Manager Access`;

  const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to A1 Blom Education</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>An administrator has created a new <strong>${
          role === "web-manager" ? "Web" : "App"
        } Manager</strong> account for you.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Your Login Credentials:</h3>
          <p><strong>Login URL:</strong> <a href="${process.env.frontendUrl}">Login Here</a></p>
          <p><strong>User ID:</strong> ${userId}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        
        <p><em>Note: You can log in using either your Email or User ID.</em></p>
        <p style="color: #dc2626;"><strong>Security Warning:</strong> Please do not share these credentials with anyone. It is highly recommended to change your password after your first login.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">© ${new Date().getFullYear()} A1 Blom Education. All rights reserved.</p>
      </div>
    `;

  return { emailSubject, emailHtml };
};
