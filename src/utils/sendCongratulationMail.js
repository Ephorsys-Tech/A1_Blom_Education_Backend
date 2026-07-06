import { sendMail } from "./sendMail.js";
import { congratulationTemplate } from "./mailTemplates/congratulationTemplate.js";

export const sendCongratulationMail = async (email, fullName, details) => {
  const { mobile, classNumber } = details;
  const { emailSubject, emailHtml } = congratulationTemplate(fullName, email, mobile, classNumber);
  return await sendMail(email, emailSubject, emailHtml);
};
