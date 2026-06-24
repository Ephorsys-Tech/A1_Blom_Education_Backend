const leadSubmittedTemplate = ({
  name,
  inquiryType,
  productSlug,
  quantity,
  phone,
  email,
  address,
  message,
}) => {
  return `
  <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 15px;">
      <tr>
        <td align="center">

          <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <tr>
              <td style="background:linear-gradient(135deg,#1d4ed8,#312e81);padding:40px 30px;text-align:center;">
                
                <h1 style="margin:0;font-size:32px;color:#ffffff;font-weight:800;">
                  Thank You, ${name}
                </h1>

                <p style="margin-top:12px;font-size:15px;color:#dbeafe;line-height:1.7;">
                  Your inquiry has been submitted successfully.
                  <br />
                  Our medical support team will get back to you within 
                  <b>12 hours</b>.
                </p>

              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:35px 30px;">

                <h2 style="margin:0 0 25px;color:#0f172a;font-size:24px;font-weight:800;">
                  Inquiry Details
                </h2>

                <table width="100%" cellpadding="0" cellspacing="0">

                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="color:#64748b;font-size:14px;">
                        Inquiry Type
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;">
                        ${inquiryType}
                      </h4>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="color:#64748b;font-size:14px;">
                        Product
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;">
                        ${productSlug}
                      </h4>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="color:#64748b;font-size:14px;">
                        Quantity
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;">
                        ${quantity}
                      </h4>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="color:#64748b;font-size:14px;">
                        Phone Number
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;">
                        ${phone}
                      </h4>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="color:#64748b;font-size:14px;">
                        Email Address
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;">
                        ${email}
                      </h4>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 0;border-bottom:1px solid #e2e8f0;">
                      <span style="color:#64748b;font-size:14px;">
                        Address
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;line-height:1.7;">
                        ${address}
                      </h4>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:14px 0;">
                      <span style="color:#64748b;font-size:14px;">
                        Additional Message
                      </span>

                      <h4 style="margin:5px 0 0;font-size:17px;color:#0f172a;line-height:1.7;">
                        ${message || "No additional message provided"}
                      </h4>
                    </td>
                  </tr>

                </table>

                <!-- SUPPORT -->
                <div style="margin-top:35px;background:#eff6ff;border:1px solid #bfdbfe;padding:22px;border-radius:18px;">

                  <h3 style="margin:0 0 10px;color:#1d4ed8;font-size:20px;">
                    What Happens Next?
                  </h3>

                  <p style="margin:0;color:#334155;font-size:15px;line-height:1.8;">
                    • Our support team will review your inquiry.
                    <br />
                    • We will contact you shortly via phone or email.
                    <br />
                    • Product availability and pricing details will be shared.
                    <br />
                    • Delivery and setup guidance will also be provided.
                  </p>

                </div>

              </td>
            </tr>

<!-- FOOTER -->
<tr>
  <td style="background:#0f172a;padding:40px 30px;text-align:center;">

    <!-- COMPANY LOGO -->
    <img
      src="https://saverasurgicalgroup.com/mylogo.png"
      alt="Savera Surgical Group"
      width="120"
      style="display:block;margin:0 auto 20px;"
    />

    <!-- COMPANY NAME -->
    <h3
      style="
        margin:0;
        color:#ffffff;
        font-size:24px;
        font-weight:700;
      "
    >
      Savera Surgical Group
    </h3>

    <p
      style="
        margin:12px 0 20px;
        color:#cbd5e1;
        font-size:14px;
        line-height:1.8;
      "
    >
      Trusted Medical Equipment Rental & Sales Partner
    </p>

    <!-- CONTACT INFO -->
    <table
      cellpadding="0"
      cellspacing="0"
      align="center"
      style="margin:auto;"
    >
      <tr>
        <td
          style="
            color:#e2e8f0;
            font-size:14px;
            padding:6px 0;
          "
        >
          📞 Phone:
          <a
            href="tel:+919853024404"
            style="color:#93c5fd;text-decoration:none;"
          >
            +91 98530 24404
          </a>
        </td>
      </tr>

      <tr>
        <td
          style="
            color:#e2e8f0;
            font-size:14px;
            padding:6px 0;
          "
        >
          ✉ Email:
          <a
            href="mailto:info@saverasurgicalgroup.com"
            style="color:#93c5fd;text-decoration:none;"
          >
            info@saverasurgicalgroup.com
          </a>
        </td>
      </tr>

      <tr>
        <td
          style="
            color:#e2e8f0;
            font-size:14px;
            padding:6px 0;
          "
        >
          🌐 Website:
          <a
            href="https://saverasurgicalgroup.com"
            target="_blank"
            style="color:#93c5fd;text-decoration:none;"
          >
            www.saverasurgicalgroup.com
          </a>
        </td>
      </tr>
    </table>

    <!-- DIVIDER -->
    <div
      style="
        height:1px;
        background:#334155;
        margin:25px 0;
      "
    ></div>

    <!-- SUPPORT MESSAGE -->
    <p
      style="
        margin:0;
        color:#cbd5e1;
        font-size:14px;
        line-height:1.8;
      "
    >
      If you have any questions regarding your inquiry,
      our support team is always ready to assist you.
    </p>

    <p
      style="
        margin-top:12px;
        color:#94a3b8;
        font-size:13px;
      "
    >
      Thank you for choosing Savera Surgical Group.
    </p>

    <!-- COPYRIGHT -->
    <p
      style="
        margin-top:25px;
        color:#64748b;
        font-size:12px;
      "
    >
      © ${new Date().getFullYear()} Savera Surgical Group.
      All Rights Reserved.
    </p>

  </td>
</tr>

          </table>

        </td>
      </tr>
    </table>

  </div>
  `;
};

export default leadSubmittedTemplate;
