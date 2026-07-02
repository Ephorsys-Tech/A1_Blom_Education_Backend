import express from "express";
import {
  createBatch,
  updateBatch,
  deleteBatch,
  getBatches,
  getAdminBatches,
  getBatchById,
} from "../controllers/StudentsControllers/batch.controller.js";
import protect from "../middleware/auth.middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// get batches
// get -> api/v1/batches
router.get("/", getBatches);

// get batch by id
// get -> api/v1/batches/:id
router.get("/:id", getBatchById);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================

// Create Batches
// POST -> api/v1/batches   
router.post("/", protect, upload.single("thumbnail"), createBatch);

// get batches
// get -> api/v1/batches/admin/all
router.get("/admin/all", protect, getAdminBatches);

// update batch
// put -> api/v1/batches/:id
router.put("/:id", protect, upload.single("thumbnail"), updateBatch);

// delete batch
// delete -> api/v1/batches/:id
router.delete("/:id", protect, deleteBatch);

export default router;
