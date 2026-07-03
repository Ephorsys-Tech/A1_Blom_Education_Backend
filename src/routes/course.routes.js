import express from "express";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  getCourses,
  getAdminCourses,
  getCourseById,
} from "../controllers/StudentsControllers/course.controller.js";
import protect, { authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", getCourses);
router.get("/:id", getCourseById);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post("/", protect, authorize("admin", "app-manager"), upload.single("thumbnail"), createCourse);
router.get("/admin/all", protect, authorize("admin", "app-manager"), getAdminCourses);
router.put("/:id", protect, authorize("admin", "app-manager"), upload.single("thumbnail"), updateCourse);
router.delete("/:id", protect, authorize("admin", "app-manager"), deleteCourse);

export default router;
