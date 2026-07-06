import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  createSubject,
  getAllSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  deleteSubjectPdf,
  createChapter,
  getAllChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  getPublicClasses,
  getPublicSubjects,
  getPublicChapters,
  getPublicChapterDetail
} from "../../controllers/webController/academic.controller.js";
import protect from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
const router = express.Router();

// ==========================================
// PUBLIC / STUDENT ROUTES
// ==========================================
router.get("/public/classes", getPublicClasses);
router.get("/public/subjects", getPublicSubjects);
router.get("/public/chapters", getPublicChapters);
router.get("/public/chapters/:id", getPublicChapterDetail);

// ==========================================
// ADMIN / MANAGED ROUTES (Protected)
// ==========================================

// Class routes
router.post("/classes", protect, createClass);
router.get("/classes", protect, getAllClasses);
router.get("/classes/:id", protect, getClassById);
router.put("/classes/:id", protect, updateClass);
router.delete("/classes/:id", protect, deleteClass);

// Subject routes (handles textbook PDF upload as 'pdf' field)
router.post("/subjects", protect, upload.single("pdf"), createSubject);
router.get("/subjects", protect, getAllSubjects);
router.get("/subjects/:id", protect, getSubjectById);
router.put("/subjects/:id", protect, upload.single("pdf"), updateSubject);
router.delete("/subjects/:id", protect, deleteSubject);
router.delete("/subjects/:id/pdf", protect, deleteSubjectPdf);

// Chapter routes
router.post("/chapters", protect, createChapter);
router.get("/chapters", protect, getAllChapters);
router.get("/chapters/:id", protect, getChapterById);
router.put("/chapters/:id", protect, updateChapter);
router.delete("/chapters/:id", protect, deleteChapter);

export default router;
