import express from "express";
import {
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjects,
  getSubjectById, 
} from "../../controllers/appController/subjects.controller.js";
import protect, { authorize } from "../../middleware/auth.middleware.js";
import upload from "../../middleware/multer.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createSubjectSchema,
  updateSubjectSchema,
  getSubjectsQuerySchema,
} from "../../validations/subjects.validation.js";
import { paramIdSchema } from "../../validations/common.validation.js";

const router = express.Router();

// ==========================================
// PUBLIC ROUTES
// ==========================================
router.get("/", validate({ query: getSubjectsQuerySchema }), getSubjects);
router.get("/:id", validate({ params: paramIdSchema }), getSubjectById);

// ==========================================
// ADMIN ROUTES (Protected)
// ==========================================
router.post(
  "/",
  protect,
  authorize("admin", "app-manager"),
  validate({ body: createSubjectSchema }),
  createSubject
);
router.put(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema, body: updateSubjectSchema }),
  updateSubject
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "app-manager"),
  validate({ params: paramIdSchema }),
  deleteSubject
);

export default router;
