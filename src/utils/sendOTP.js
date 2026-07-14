import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOTP = async (mobile, otp) => {
  try {
    const phone = mobile.startsWith("+91") ? mobile : `+91${mobile}`;

    if (otp) {
      if (!process.env.TWILIO_PHONE_NUMBER) {
        console.warn("TWILIO_PHONE_NUMBER environment variable is not defined. SMS sending might fail.");
      }

      const message = await client.messages.create({
        body: `Your OTP for verification is ${otp}. It is valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER || "+1234567890",
        to: phone,
      });

      console.log("SMS Message sent:", message.sid);
      return message;
    } else {
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({
          to: phone,
          channel: "sms",
        });

      console.log("Verification:", verification);
      return verification;
    }
  } catch (error) {
    console.error("Twilio Error:", error);

    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("More Info:", error.moreInfo);

    throw new Error("Failed to send OTP");
  }
};