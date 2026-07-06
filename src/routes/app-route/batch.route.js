import express from "express";
import {
  createBatch,
  updateBatch,
  deleteBatch,
  getBatches,
  getAdminBatches,
  getBatchById,
} from "../../controllers/appController/batch.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";

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
router.post("/", protect, authorize("admin", "app-manager"), upload.single("thumbnail"), createBatch);

// get batches
// get -> api/v1/batches/admin/all
router.get("/admin/all", protect, authorize("admin", "app-manager"), getAdminBatches);

// update batch
// put -> api/v1/batches/:id
router.put("/:id", protect, authorize("admin", "app-manager"), upload.single("thumbnail"), updateBatch);

// delete batch
// delete -> api/v1/batches/:id
router.delete("/:id", protect, authorize("admin", "app-manager"), deleteBatch);

export default router;
