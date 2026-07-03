import { respond } from "../../utils/respond.js";
import {
  createCourseService,
  updateCourseService,
  deleteCourseService,
  getCoursesService,
  getAdminCoursesService,
  getCourseByIdService,
} from "../../services/course.service.js";

// ==========================================
// CREATE COURSE / SUBJECT (Admin Only)
// ==========================================
export const createCourse = async (req, res, next) => {
  try {
    const course = await createCourseService(req.body, req.file);
    return respond(res, 201, "Course/Subject created successfully.", course);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// UPDATE COURSE / SUBJECT (Admin Only)
// ==========================================
export const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await updateCourseService(id, req.body, req.file);
    return respond(res, 200, "Course updated successfully.", course);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE COURSE / SUBJECT (Admin Only)
// ==========================================
export const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteCourseService(id);
    return respond(res, 200, "Course/Subject deleted successfully.");
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ACTIVE COURSES / SUBJECTS (Public / Students)
// ==========================================
export const getCourses = async (req, res, next) => {
  try {
    const courses = await getCoursesService(req.query.batch);
    return respond(res, 200, "Courses fetched successfully.", courses);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ALL COURSES (Admin Only)
// ==========================================
export const getAdminCourses = async (req, res, next) => {
  try {
    const courses = await getAdminCoursesService(req.query.batch);
    return respond(res, 200, "All courses fetched successfully.", courses);
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET COURSE BY ID (Public / Students)
// ==========================================
export const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const course = await getCourseByIdService(id);
    return respond(res, 200, "Course fetched successfully.", course);
  } catch (error) {
    next(error);
  }
};
