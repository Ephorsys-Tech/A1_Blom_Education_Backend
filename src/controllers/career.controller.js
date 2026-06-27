import CareerModel from "../model/career.model.js";
import ApplicationModel from "../model/application.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// Job Opening Management (Admin & Public)
// ==========================================

// Create Job Opening (Admin)
export const createJob = async (req, res) => {
  try {
    const { title, department, location, description, requirements, experience, salary, isActive } = req.body;

    if (!title || !department || !location || !description || !experience) {
      return res.status(400).json({
        success: false,
        message: "Title, department, location, description, and experience are required",
      });
    }

    let parsedRequirements = [];
    if (requirements) {
      if (Array.isArray(requirements)) {
        parsedRequirements = requirements;
      } else if (typeof requirements === "string") {
        parsedRequirements = requirements.split(",").map((req) => req.trim()).filter(Boolean);
      }
    }

    const job = await CareerModel.create({
      title,
      department,
      location,
      description,
      requirements: parsedRequirements,
      experience,
      salary: salary || "",
      isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : true,
    });

    return res.status(201).json({
      success: true,
      message: "Job posting created successfully",
      data: job,
    });
  } catch (error) {
    console.error("Create Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating job posting",
      error: error.message,
    });
  }
};

// Get Active Jobs (Public)
export const getJobs = async (req, res) => {
  try {
    const jobs = await CareerModel.find({ isActive: true }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Get Active Jobs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching job openings",
      error: error.message,
    });
  }
};

// Get All Jobs (Admin)
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await CareerModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Get All Jobs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching job openings",
      error: error.message,
    });
  }
};

// Toggle Job Status (Admin)
export const toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await CareerModel.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found",
      });
    }

    job.isActive = !job.isActive;
    await job.save();

    return res.status(200).json({
      success: true,
      message: `Job posting status updated to ${job.isActive ? "Active" : "Inactive"}`,
      data: job,
    });
  } catch (error) {
    console.error("Toggle Job Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating job status",
      error: error.message,
    });
  }
};

// Delete Job Posting (Admin)
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await CareerModel.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found",
      });
    }

    // Delete job
    await CareerModel.findByIdAndDelete(id);

    // Optionally delete related applications or leave them in the database.
    // For completeness, we delete applications associated with this job
    const applications = await ApplicationModel.find({ jobId: id });
    for (const app of applications) {
      if (app.resumePublicId) {
        try {
          await deleteFromCloudinary(app.resumePublicId, "raw"); // PDF/Word docs are raw resources in cloudinary
        } catch (e) {
          console.error(`Failed to delete resume ${app.resumePublicId} from Cloudinary:`, e);
        }
      }
    }
    await ApplicationModel.deleteMany({ jobId: id });

    return res.status(200).json({
      success: true,
      message: "Job posting and all associated applications deleted successfully",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting job posting",
      error: error.message,
    });
  }
};

// ==========================================
// Job Application Management (Admin & Public)
// ==========================================

// Apply for Job (Public)
export const applyJob = async (req, res) => {
  try {
    const { jobId, name, email, phone, coverLetter } = req.body;

    if (!jobId || !name || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Job ID, name, email, and phone number are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume file (PDF/Doc) is required",
      });
    }

    // Check if the job opening exists and is active
    const job = await CareerModel.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        message: "Job opening is either inactive or not found",
      });
    }

    // Upload resume to Cloudinary as raw resource type (PDFs and documents are uploaded as raw or auto)
    const uploadResult = await uploadToCloudinary(req.file.buffer, "resumes", "raw");

    const application = await ApplicationModel.create({
      jobId,
      name,
      email,
      phone,
      resumeUrl: uploadResult.url,
      resumePublicId: uploadResult.publicId,
      coverLetter: coverLetter || "",
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Apply Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while submitting application",
      error: error.message,
    });
  }
};

// Get All Applications (Admin)
export const getApplications = async (req, res) => {
  try {
    const applications = await ApplicationModel.find()
      .populate("jobId", "title department location")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Get Applications Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while retrieving applications",
      error: error.message,
    });
  }
};

// Delete Job Application (Admin)
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await ApplicationModel.findById(id);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Delete resume from Cloudinary
    if (application.resumePublicId) {
      await deleteFromCloudinary(application.resumePublicId, "raw");
    }

    await ApplicationModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete Application Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting application",
      error: error.message,
    });
  }
};
