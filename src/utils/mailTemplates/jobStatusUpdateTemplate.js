const jobStatusUpdateTemplate = ({
  fullName,
  jobTitle,
  status,
}) => {

  const statusColors = {
    pending: "#f59e0b",
    reviewed: "#3b82f6",
    shortlisted: "#10b981",
    rejected: "#ef4444",
  };

  const statusMessages = {
    pending:
      "Your application is currently under review.",

    reviewed:
      "Our HR team has reviewed your application.",

    shortlisted:
      "Congratulations! You have been shortlisted for the next round.",

    rejected:
      "Thank you for your interest. Currently we are moving forward with other candidates.",
  };

  return `

    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:40px 20px;">

      <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">

        <!-- Header -->
        <div style="background:${statusColors[status]}; padding:30px; text-align:center;">

          <h1 style="color:white; margin:0; font-size:24px;">
            Application Status Updated
          </h1>

        </div>

        <!-- Body -->
        <div style="padding:30px; color:#334155; line-height:1.8;">

          <p>
            Dear <strong>${fullName}</strong>,
          </p>

          <p>
            Your application status for the position of 
            <strong>${jobTitle}</strong> has been updated.
          </p>

          <!-- Status Box -->
          <div style="margin:25px 0; padding:20px; border-radius:10px; background:#f8fafc; border:1px solid #e2e8f0; text-align:center;">

            <p style="margin-bottom:10px; font-size:14px; color:#64748b;">
              Current Status
            </p>

            <span style="
              display:inline-block;
              padding:10px 18px;
              border-radius:999px;
              background:${statusColors[status]};
              color:white;
              font-size:14px;
              font-weight:bold;
              text-transform:capitalize;
            ">
              ${status}
            </span>

          </div>

          <p>
            ${statusMessages[status]}
          </p>

          <br/>

          <p>
            Regards,<br/>
            <strong>HR Team</strong>
          </p>

        </div>

      </div>

    </div>

  `;
};

export default jobStatusUpdateTemplate;