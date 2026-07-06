import { respond } from "../../utils/respond.js";
import {
  createChapterService,
  updateChapterService,
  deleteChapterService,
  getChaptersService,
  getAdminChaptersService,
  getChapterByIdService,
} from "../../services/chapter.service.js";

// ==========================================
// CREATE CHAPTER (Admin Only)
// ==========================================
export const createChapter = async (req, res, next) => {
  try {
    const chapter = await createChapterService(req.body);
    return respond(res, 201, "Chapter created successfully.", chapter);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE CHAPTER (Admin Only)
// ==========================================
export const updateChapter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chapter = await updateChapterService(id, req.body);
    return respond(res, 200, "Chapter updated successfully.", chapter);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE CHAPTER (Admin Only)
// ==========================================
export const deleteChapter = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteChapterService(id);
    return respond(res, 200, "Chapter and its lectures deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ACTIVE CHAPTERS (Public / Students)
// ==========================================
export const getChapters = async (req, res, next) => {
  try {
    const { course: courseId } = req.query;
    const chapters = await getChaptersService(courseId);
    return respond(res, 200, "Chapters fetched successfully.", chapters);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL CHAPTERS (Admin Only)
// ==========================================
export const getAdminChapters = async (req, res, next) => {
  try {
    const { course: courseId } = req.query;
    const chapters = await getAdminChaptersService(courseId);
    return respond(res, 200, "All chapters fetched successfully.", chapters);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CHAPTER BY ID (Public / Students)
// ==========================================
export const getChapterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const chapter = await getChapterByIdService(id);
    return respond(res, 200, "Chapter details fetched successfully.", chapter);
  } catch (error) {
    next(error);
  }
};
