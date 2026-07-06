import express from "express";
import {
  createChapter,
  updateChapter,
  deleteChapter,
  getChapters,
  getAdminChapters,
  getChapterById,
} from "../../controllers/appController/chapter.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", getChapters);
router.get("/:id", getChapterById);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post("/", protect, authorize("admin", "app-manager"), upload.none(), createChapter);
router.get("/admin/all", protect, authorize("admin", "app-manager"), getAdminChapters);
router.put("/:id", protect, authorize("admin", "app-manager"), upload.none(), updateChapter);
router.delete("/:id", protect, authorize("admin", "app-manager"), deleteChapter);

export default router;
