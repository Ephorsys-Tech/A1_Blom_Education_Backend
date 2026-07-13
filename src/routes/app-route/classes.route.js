import express from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getClasses,
  getAdminClasses,
  getClassById,
} from "../../controllers/appController/classes.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createClassSchema, updateClassSchema } from "../../validations/classes.validation.js";
import { paramIdSchema } from "../../validations/common.validation.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================

// get classes
// get -> api/v1/classes
router.get("/", getClasses);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================

// Create Classes
// POST -> api/v1/classes   
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  upload.single("thumbnail"),
  validate({ body: createClassSchema }),
  createClass
);

// get classes for admin
// get -> api/v1/classes/admin/all
router.get("/admin/all", protect, authorize("admin", "app-manager"), getAdminClasses);

// update class
// put -> api/v1/classes/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  upload.single("thumbnail"),
  validate({ params: paramIdSchema, body: updateClassSchema }),
  updateClass
);

// delete class
// delete -> api/v1/classes/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema }),
  deleteClass
);

export default router;
