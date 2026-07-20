import CareerModel from "../../model/webModel/career.model.js";
import ApplicationModel from "../../model/webModel/application.model.js";
import { uploadBufferToS3, deleteFileFromS3 } from "../../utils/s3Helper.js";
import path from "path";
import { z } from "zod";

const ApplyJobForm = z.object({
  name: z
    .string()
    .min(2, "Name is required")
    .regex(/^[A-Za-z\s]+$/, "Name should contain only letters"),
  email: z.string().email({ message: "Enter a valid email" }),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^[0-9]+$/, "Phone number should contain only digits"),
  jobId: z.string().min(1, "Job ID is required"),
});

// ==========================================
// Job Posting Management (Admin)
// ==========================================

// Create Job Posting
export const createJob = async (req, res) => {
  try {
    const { title, department, location, jobType, description, requirements, responsibilities } = req.body;

    if (!title || !department || !location || !jobType || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, department, location, jobType, and description are required",
      });
    }

    const job = await CareerModel.create({
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      jobType: jobType.trim(),
      description: description.trim(),
      requirements: Array.isArray(requirements) ? requirements : [],
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
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

// Get All Job Postings (Admin & Public)
export const getJobs = async (req, res) => {
  try {
    const jobs = await CareerModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Get Jobs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching jobs",
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

// Update Job Posting
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, department, location, jobType, description, requirements, responsibilities, isActive } = req.body;

    const job = await CareerModel.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    if (title) job.title = title.trim();
    if (department) job.department = department.trim();
    if (location) job.location = location.trim();
    if (jobType) job.jobType = jobType.trim();
    if (description) job.description = description.trim();
    if (requirements !== undefined) job.requirements = Array.isArray(requirements) ? requirements : [];
    if (responsibilities !== undefined) job.responsibilities = Array.isArray(responsibilities) ? responsibilities : [];
    if (isActive !== undefined) job.isActive = isActive;

    await job.save();

    return res.status(200).json({
      success: true,
      message: "Job posting updated successfully",
      data: job,
    });
  } catch (error) {
    console.error("Update Job Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating job posting",
      error: error.message,
    });
  }
};

// Delete Job Posting
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await CareerModel.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job posting not found",
      });
    }

    // Delete job
    await CareerModel.findByIdAndDelete(id);

    // For completeness, delete applications associated with this job
    const applications = await ApplicationModel.find({ jobId: id });
    for (const app of applications) {
      if (app.resumePublicId || app.resumeUrl) {
        try {
          await deleteFileFromS3(app.resumePublicId || app.resumeUrl);
        } catch (e) {
          console.error(
            `Failed to delete resume ${app.resumePublicId} from S3:`,
            e,
          );
        }
      }
    }
    await ApplicationModel.deleteMany({ jobId: id });

    return res.status(200).json({
      success: true,
      message:
        "Job posting and all associated applications deleted successfully",
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
    const result = ApplyJobForm.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const { name, email, phone, jobId } = result.data;

    // File validation
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

    // Upload resume to S3
    const ext = path.extname(req.file.originalname || "") || ".pdf";
    const s3Key = `careers/resume-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const uploadResult = await uploadBufferToS3(
      req.file.buffer,
      s3Key,
      req.file.mimetype || "application/pdf"
    );

    const application = await ApplicationModel.create({
      jobId,
      name,
      email,
      phone,
      resumeUrl: uploadResult.url,
      resumePublicId: uploadResult.key,
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

    // Delete resume from S3
    if (application.resumePublicId || application.resumeUrl) {
      await deleteFileFromS3(application.resumePublicId || application.resumeUrl);
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
