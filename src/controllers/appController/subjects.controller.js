import { respond } from "../../utils/respond.js";
import {
  createSubjectService,
  updateSubjectService,
  deleteSubjectService,
  getSubjectsService,
  getAdminSubjectsService,
  getSubjectByIdService,
} from "../../services/subjects.service.js";

// ==========================================
// CREATE SUBJECT (Admin Only)
// ==========================================
export const createSubject = async (req, res, next) => {
  try {
    const subject = await createSubjectService(req.body, req.file);
    return respond(res, 201, "Subject created successfully.", subject);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE SUBJECT (Admin Only)
// ==========================================
export const updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await updateSubjectService(id, req.body, req.file);
    return respond(res, 200, "Subject updated successfully.", subject);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE SUBJECT (Admin Only)
// ==========================================
export const deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteSubjectService(id);
    return respond(res, 200, "Subject deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ACTIVE SUBJECTS (Public / Students)
// ==========================================
export const getSubjects = async (req, res, next) => {
  try {
    const subjects = await getSubjectsService(req.query.classes);
    return respond(res, 200, "Subjects fetched successfully.", subjects);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL SUBJECTS (Admin Only)
// ==========================================
export const getAdminSubjects = async (req, res, next) => {
  try {
    const subjects = await getAdminSubjectsService(req.query.classes);
    return respond(res, 200, "All subjects fetched successfully.", subjects);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET SUBJECT BY ID (Public / Students)
// ==========================================
export const getSubjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const subject = await getSubjectByIdService(id);
    return respond(res, 200, "Subject fetched successfully.", subject);
  } catch (error) {
    next(error);
  }
};
