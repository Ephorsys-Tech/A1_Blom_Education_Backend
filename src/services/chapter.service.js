import Chapter from "../model/appModel/chapter.model.js";
import Course from "../model/appModel/course.model.js";
import Lecture from "../model/appModel/lecture.model.js";
import { deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// CREATE CHAPTER Service
// ==========================================
export const createChapterService = async (data) => {
  const { name, chapterNumber, description, course: courseId, sortOrder } = data || {};

  if (!name || chapterNumber === undefined || !courseId) {
    const error = new Error("Name, chapterNumber, and course reference are required.");
    error.statusCode = 400;
    throw error;
  }

  // Verify course exists
  const targetCourse = await Course.findById(courseId);
  if (!targetCourse) {
    const error = new Error("Course/Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check unique chapterNumber per course
  const duplicate = await Chapter.findOne({ course: courseId, chapterNumber });
  if (duplicate) {
    const error = new Error(`Chapter number ${chapterNumber} already exists in this course.`);
    error.statusCode = 400;
    throw error;
  }

  const chapter = await Chapter.create({
    name,
    chapterNumber,
    description: description || "",
    course: courseId,
    sortOrder: sortOrder || 0,
  });

  return chapter;
};

// ==========================================
// UPDATE CHAPTER Service
// ==========================================
export const updateChapterService = async (id, data) => {
  const { name, chapterNumber, description, course: courseId, sortOrder, isActive } = data || {};

  const chapter = await Chapter.findById(id);
  if (!chapter) {
    const error = new Error("Chapter not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check duplicate chapterNumber if changed
  if (chapterNumber !== undefined && (chapterNumber !== chapter.chapterNumber || (courseId && courseId !== chapter.course.toString()))) {
    const activeCourseId = courseId || chapter.course;
    const duplicate = await Chapter.findOne({
      course: activeCourseId,
      chapterNumber,
      _id: { $ne: id },
    });
    if (duplicate) {
      const error = new Error(`Chapter number ${chapterNumber} already exists in this course.`);
      error.statusCode = 400;
      throw error;
    }
    chapter.chapterNumber = chapterNumber;
  }

  if (courseId) {
    const targetCourse = await Course.findById(courseId);
    if (!targetCourse) {
      const error = new Error("New referenced course not found.");
      error.statusCode = 404;
      throw error;
    }
    chapter.course = courseId;
  }

  if (name !== undefined) chapter.name = name;
  if (description !== undefined) chapter.description = description;
  if (sortOrder !== undefined) chapter.sortOrder = sortOrder;
  if (isActive !== undefined) chapter.isActive = isActive;

  await chapter.save();
  return chapter;
};

// ==========================================
// DELETE CHAPTER Service
// ==========================================
export const deleteChapterService = async (id) => {
  const chapter = await Chapter.findById(id);
  if (!chapter) {
    const error = new Error("Chapter not found.");
    error.statusCode = 404;
    throw error;
  }

  // Find and delete all lectures in this chapter, cleaning up their Cloudinary videos
  const lectures = await Lecture.find({ chapter: id });
  for (const lecture of lectures) {
    if (lecture.videoPublicId) {
      await deleteFromCloudinary(lecture.videoPublicId, "video");
    }
    await Lecture.findByIdAndDelete(lecture._id);
  }

  await Chapter.findByIdAndDelete(id);
  return true;
};

// ==========================================
// GET ACTIVE CHAPTERS Service
// ==========================================
export const getChaptersService = async (courseId) => {
  if (!courseId) {
    const error = new Error("Course query parameter is required.");
    error.statusCode = 400;
    throw error;
  }

  const chapters = await Chapter.find({ course: courseId, isActive: true })
    .sort({ sortOrder: 1, chapterNumber: 1 });

  return chapters;
};

// ==========================================
// GET ALL CHAPTERS (Admin Only) Service
// ==========================================
export const getAdminChaptersService = async (courseId) => {
  if (!courseId) {
    const error = new Error("Course query parameter is required.");
    error.statusCode = 400;
    throw error;
  }

  const chapters = await Chapter.find({ course: courseId })
    .sort({ sortOrder: 1, chapterNumber: 1 });

  return chapters;
};

// ==========================================
// GET CHAPTER BY ID Service
// ==========================================
export const getChapterByIdService = async (id) => {
  const chapter = await Chapter.findById(id).populate("course", "name code");
  if (!chapter) {
    const error = new Error("Chapter not found.");
    error.statusCode = 404;
    throw error;
  }
  return chapter;
};
