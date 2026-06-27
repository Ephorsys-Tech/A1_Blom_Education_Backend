import ContactModel from "../model/contact.model.js";

// Submit Contact Form
export const submitContact = async (req, res) => {
  try {
    const { name, email, number, subject, message } = req.body;

    if (!name || !email || !number || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields (name, email, number, subject, message) are required",
      });
    }

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
