import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOTP = async (mobile) => {
  try {
    const phone = mobile.startsWith("+91") ? mobile : `+91${mobile}`;

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    console.log("Verification:", verification);

    return verification;
  } catch (error) {
    console.error("Twilio Error:", error);

    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("More Info:", error.moreInfo);

    throw new Error("Failed to send OTP");
  }
};