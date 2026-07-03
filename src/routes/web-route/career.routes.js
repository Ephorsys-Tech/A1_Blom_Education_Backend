import express from "express";
import {
  createJob,
  getJobs,
  getAllJobs,
  toggleJobStatus,
  deleteJob,
  applyJob,
  getApplications,
  deleteApplication,
} from "../../controllers/webController/career.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getJobs); // Get active job openings
router.post("/apply", upload.single("resume"), applyJob); // Apply for a job opening with resume file

// Protected routes (Admin only)
router.get("/admin", protect, getAllJobs); // Get all jobs (active and inactive)
router.post("/", protect, createJob); // Create new job opening
router.put("/:id/toggle", protect, toggleJobStatus); // Toggle status
router.delete("/:id", protect, deleteJob); // Delete job opening and related applications

router.get("/applications", protect, getApplications); // Get all applications
router.delete("/applications/:id", protect, deleteApplication); // Delete single application

export default router;
