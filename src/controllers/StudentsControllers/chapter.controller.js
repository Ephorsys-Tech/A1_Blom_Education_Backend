import Chapter from "../../model/StudentModel/chapter.model.js";
import Course from "../../model/StudentModel/course.model.js";
import Lecture from "../../model/StudentModel/lecture.model.js";
import { deleteFromCloudinary } from "../../config/cloudinary.config.js";

// ==========================================
// CREATE CHAPTER (Admin Only)
// ==========================================
export const createChapter = async (req, res) => {
  try {
    const { name, chapterNumber, description, course: courseId, sortOrder } = req.body || {};

    if (!name || chapterNumber === undefined || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Name, chapterNumber, and course reference are required.",
      });
    }

    // Verify course exists
    const targetCourse = await Course.findById(courseId);
    if (!targetCourse) {
      return res.status(404).json({
        success: false,
        message: "Course/Subject not found.",
      });
    }

    // Check unique chapterNumber per course
    const duplicate = await Chapter.findOne({ course: courseId, chapterNumber });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Chapter number ${chapterNumber} already exists in this course.`,
      });
    }

    const chapter = await Chapter.create({
      name,
      chapterNumber,
      description: description || "",
      course: courseId,
      sortOrder: sortOrder || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Chapter created successfully.",
      data: chapter,
    });
  } catch (error) {
    console.error("Create Chapter Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating chapter.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE CHAPTER (Admin Only)
// ==========================================
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, chapterNumber, description, course: courseId, sortOrder, isActive } = req.body || {};

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found.",
      });
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
        return res.status(400).json({
          success: false,
          message: `Chapter number ${chapterNumber} already exists in this course.`,
        });
      }
      chapter.chapterNumber = chapterNumber;
    }

    if (courseId) {
      const targetCourse = await Course.findById(courseId);
      if (!targetCourse) {
        return res.status(404).json({
          success: false,
          message: "New referenced course not found.",
        });
      }
      chapter.course = courseId;
    }

    if (name !== undefined) chapter.name = name;
    if (description !== undefined) chapter.description = description;
    if (sortOrder !== undefined) chapter.sortOrder = sortOrder;
    if (isActive !== undefined) chapter.isActive = isActive;

    await chapter.save();

    return res.status(200).json({
      success: true,
      message: "Chapter updated successfully.",
      data: chapter,
    });
  } catch (error) {
    console.error("Update Chapter Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating chapter.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE CHAPTER (Admin Only)
// ==========================================
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found.",
      });
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

    return res.status(200).json({
      success: true,
      message: "Chapter and its lectures deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Chapter Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting chapter.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ACTIVE CHAPTERS (Public / Students)
// ==========================================
export const getChapters = async (req, res) => {
  try {
    const { course: courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course query parameter is required.",
      });
    }

    const chapters = await Chapter.find({ course: courseId, isActive: true })
      .sort({ sortOrder: 1, chapterNumber: 1 });

    return res.status(200).json({
      success: true,
      message: "Chapters fetched successfully.",
      data: chapters,
    });
  } catch (error) {
    console.error("Get Chapters Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching chapters.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL CHAPTERS (Admin Only)
// ==========================================
export const getAdminChapters = async (req, res) => {
  try {
    const { course: courseId } = req.query;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "Course query parameter is required.",
      });
    }

    const chapters = await Chapter.find({ course: courseId })
      .sort({ sortOrder: 1, chapterNumber: 1 });

    return res.status(200).json({
      success: true,
      message: "All chapters fetched successfully.",
      data: chapters,
    });
  } catch (error) {
    console.error("Get Admin Chapters Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching admin chapters.",
      error: error.message,
    });
  }
};

// ==========================================
// GET CHAPTER BY ID (Public / Students)
// ==========================================
export const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findById(id).populate("course", "name code");
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Chapter details fetched successfully.",
      data: chapter,
    });
  } catch (error) {
    console.error("Get Chapter By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching chapter details.",
      error: error.message,
    });
  }
};
