export const congratulationTemplate = (fullName, email, mobile, classNumber) => {
  const emailSubject = "Welcome to A1 Blom Education - Registration Successful! 🎉";

  const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.025em;">A1 Blom Education</h1>
          <p style="color: #4b5563; font-size: 16px; margin-top: 5px;">Unlock Your Learning Potential</p>
        </div>
        
        <div style="border-top: 4px solid #2563eb; padding-top: 25px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 22px; font-weight: 600;">Congratulations, ${fullName}!</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Your registration has been completed successfully. We are absolutely thrilled to welcome you to the A1 Blom Education community!</p>
          
          <div style="background-color: #f9fafb; border: 1px solid #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h3 style="margin-top: 0; color: #374151; font-size: 16px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Registration Summary:</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #4b5563;">
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151; width: 120px;">Email:</td>
                <td style="padding: 6px 0;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151;">Mobile:</td>
                <td style="padding: 6px 0;">${mobile}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: 600; color: #374151;">Class:</td>
                <td style="padding: 6px 0;">Class ${classNumber}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Please ensure both your mobile number and email address are verified using the OTPs sent to you to fully activate all application features.</p>
          
          <div style="text-align: center; margin: 30px 0 15px 0;">
            <p style="color: #9ca3af; font-size: 13px; font-style: italic;">If you did not register for this account, please contact our support team immediately.</p>
          </div>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
        <div style="font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.5;">
          <p style="margin: 0 0 5px 0;">© ${new Date().getFullYear()} A1 Blom Education. All rights reserved.</p>
          <p style="margin: 0;">Designed to provide top-tier academic training and support.</p>
        </div>
      </div>
    `;

  return { emailSubject, emailHtml };
};
