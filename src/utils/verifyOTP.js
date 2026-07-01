import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

export const verifyOTP = async (mobile, otp) => {
  try {
    const phone = mobile.startsWith("+91") ? mobile : `+91${mobile}`;

    const verificationCheck = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phone,
        code: otp,
      });

    return verificationCheck;
  } catch (error) {
    console.error(error);
    throw new Error("OTP Verification Failed");
  }
};
