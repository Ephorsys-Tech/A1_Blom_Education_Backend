import ContactModel from "../../model/webModel/contact.model.js";
import { z } from "zod";

const contactForm = z.object({
  name: z
    .string()
    .min(2, "Name is required")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters"),
    email: z.string().email({ message: "Enter a valid email" }),
    number: z
    .string()
    .regex(/^[0-9]{10}$/, "Phone must be 10 digits"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(5, "Message is required"),
});

// Submit Contact Form
export const submitContact = async (req, res) => {
  try {
    const result = contactForm.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const { name, email, number, subject, message } = result.data;

    const contact = await ContactModel.create({
      name,
      email,
      number,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Submit Contact Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting contact form",
      error: error.message,
    });
  }
};

// Get All Contact Submissions (Admin)
export const getContacts = async (req, res) => {
  try {
    const submissions = await ContactModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Get Contacts Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching contact submissions",
      error: error.message,
    });
  }
};

// Delete Contact Submission
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    const submission = await ContactModel.findById(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Contact submission not found",
      });
    }

    await ContactModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Contact submission deleted successfully",
    });
  } catch (error) {
    console.error("Delete Contact Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting contact submission",
      error: error.message,
    });
  }
};
