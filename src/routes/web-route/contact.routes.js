import express from "express";
import {
  submitContact,
  getContacts,
  deleteContact,
} from "../../controllers/webController/contact.controller.js";
import protect from "../../middleware/auth.middleware.js";

const router = express.Router();

// Public route to submit contact inquiry
router.post("/", submitContact);

// Admin routes to view and delete inquiries
router.get("/", protect, getContacts);
router.delete("/:id", protect, deleteContact);

export default router;
