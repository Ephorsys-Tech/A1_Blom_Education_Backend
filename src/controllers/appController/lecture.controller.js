import { respond } from "../../utils/respond.js";
import {
  createLectureService,
  updateLectureService,
  deleteLectureService,
  getLecturesService,
} from "../../services/lecture.service.js";

// ==========================================
// CREATE LECTURE VIDEO (Admin Only)
// ==========================================
export const createLecture = async (req, res, next) => {
  try {
    const lecture = await createLectureService(req.body, req.files || req.file);
    return respond(res, 201, "Lecture video uploaded successfully.", lecture);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE LECTURE VIDEO (Admin Only)
// ==========================================
export const updateLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lecture = await updateLectureService(id, req.body, req.files || req.file);
    return respond(res, 200, "Lecture updated successfully.", lecture);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE LECTURE VIDEO (Admin Only)
// ==========================================
export const deleteLecture = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteLectureService(id);
    return respond(res, 200, "Lecture deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET LECTURES BY CHAPTER (Student / Authenticated)
// Includes access control: unlocks videoUrl only for enrolled students (or preview lectures)
// ==========================================
export const getLectures = async (req, res, next) => {
  try {
    const { chapter: chapterId } = req.query;
    const { isEnrolled, processedLectures } = await getLecturesService(chapterId, req.student._id);

    return res.status(200).json({
      success: true,
      message: "Lectures fetched successfully.",
      isEnrolled,
      data: processedLectures,
    });
  } catch (error) {
    next(error);
  }
};
