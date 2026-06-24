const jobApplicationTemplate = ({
  fullName,
  jobTitle,
  experience,
  email,
  phone,
}) => {
  return `
    
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px 20px;">

      <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">

        <!-- Header -->
        <div style="background:#2563eb; padding:30px; text-align:center;">
          <h1 style="color:white; margin:0; font-size:24px;">
            Application Received
          </h1>
        </div>

        <!-- Body -->
        <div style="padding:30px; color:#334155; line-height:1.8;">

          <p style="font-size:15px;">
            Dear 
            <strong>${fullName}</strong>,
          </p>

          <p style="font-size:15px;">
            Thank you for applying for the position of 
            <strong>${jobTitle}</strong>.
          </p>

          <p style="font-size:15px;">
            Our HR team has successfully received your application.
            We will review your profile and contact you shortly.
          </p>

          <!-- Application Details -->
          <div style="margin-top:25px; border:1px solid #e2e8f0; border-radius:10px; padding:20px; background:#f8fafc;">

            <h3 style="margin-top:0; color:#0f172a;">
              Application Details
            </h3>

            <p>
              <strong>Job Position:</strong>
              ${jobTitle}
            </p>

            <p>
              <strong>Experience:</strong>
              ${experience}
            </p>

            <p>
              <strong>Email:</strong>
              ${email}
            </p>

            <p>
              <strong>Phone:</strong>
              ${phone}
            </p>

          </div>

          <!-- Footer Text -->
          <p style="margin-top:30px; font-size:14px;">
            Thank you for your interest in joining our company.
          </p>

          <p style="font-size:14px;">
            Regards,<br/>
            <strong>HR Team</strong>
          </p>

        </div>

      </div>

    </div>

  `;
};

export default jobApplicationTemplate;
