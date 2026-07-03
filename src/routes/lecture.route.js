import express from "express";
import {
  createLecture,
  updateLecture,
  deleteLecture,
  getLectures,
} from "../controllers/StudentsControllers/lecture.controller.js";
import protect, { authorize } from "../middleware/auth.middleware.js";
import { isAuthenticated } from "../middleware/isAuthenticated.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// ==========================================
// STUDENT / VISITOR ROUTES (Protected)
// ==========================================
router.get("/", isAuthenticated, getLectures);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post("/", protect, authorize("admin", "app-manager"), upload.single("video"), createLecture);
router.put("/:id", protect, authorize("admin", "app-manager"), upload.single("video"), updateLecture);
router.delete("/:id", protect, authorize("admin", "app-manager"), deleteLecture);

export default router;
