import { respond } from "../../utils/respond.js";
import {
  createClassService,
  updateClassService,
  deleteClassService,
  getClassesService,
  getAdminClassesService,
  getClassByIdService,
} from "../../services/classes.service.js";

// ==========================================
// CREATE CLASS (Admin Only)
// ==========================================
export const createClass = async (req, res, next) => {
  try {
    const classes = await createClassService(req.body, req.file);
    return respond(res, 201, "Class created successfully.", classes);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE CLASS (Admin Only)
// ==========================================
export const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classes = await updateClassService(id, req.body, req.file);
    return respond(res, 200, "Class updated successfully.", classes);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE CLASS (Admin Only)
// ==========================================
export const deleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteClassService(id);
    return respond(res, 200, "Class deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ACTIVE CLASSES (Public / Students)
// ==========================================
export const getClasses = async (req, res, next) => {
  try {
    const classesList = await getClassesService();
    return respond(res, 200, "Classes fetched successfully.", classesList);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL CLASSES (Admin Only)
// ==========================================
export const getAdminClasses = async (req, res, next) => {
  try {
    const classesList = await getAdminClassesService();
    return respond(res, 200, "All classes fetched successfully.", classesList);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CLASS BY ID (Public / Students)
// ==========================================
export const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const classes = await getClassByIdService(id);
    return respond(res, 200, "Class fetched successfully.", classes);
  } catch (error) {
    next(error);
  }
};
