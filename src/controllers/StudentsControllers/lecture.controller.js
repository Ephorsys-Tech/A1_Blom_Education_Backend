import Lecture from "../../model/StudentModel/lecture.model.js";
import Chapter from "../../model/StudentModel/chapter.model.js";
import Course from "../../model/StudentModel/course.model.js";
import Student from "../../model/StudentModel/student.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.config.js";

// ==========================================
// CREATE LECTURE VIDEO (Admin Only)
// ==========================================
export const createLecture = async (req, res) => {
  try {
    const { title, description, chapter: chapterId, isPreview, sortOrder, videoUrl: directVideoUrl } = req.body || {};

    if (!title || !chapterId) {
      return res.status(400).json({
        success: false,
        message: "Title and chapter reference are required.",
      });
    }

    // Verify chapter exists and retrieve its course
    const targetChapter = await Chapter.findById(chapterId);
    if (!targetChapter) {
      return res.status(404).json({
        success: false,
        message: "Referenced chapter not found.",
      });
    }

    let videoUrl = directVideoUrl || "";
    let videoPublicId = "";
    let duration = 0;

    if (req.file) {
      // Upload video buffer to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.buffer, "lectures", "video");
      videoUrl = uploadResult.url;
      videoPublicId = uploadResult.publicId;
      duration = uploadResult.duration || 0;
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        message: "Please upload a video file or provide a video URL.",
      });
    }

    const lecture = await Lecture.create({
      title,
      description: description || "",
      videoUrl,
      videoPublicId,
      duration,
      chapter: chapterId,
      course: targetChapter.course,
      isPreview: isPreview === "true" || isPreview === true,
      sortOrder: sortOrder || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Lecture video uploaded successfully.",
      data: lecture,
    });
  } catch (error) {
    console.error("Create Lecture Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating lecture.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE LECTURE VIDEO (Admin Only)
// ==========================================
export const updateLecture = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, chapter: chapterId, isPreview, sortOrder, isActive, videoUrl: directVideoUrl } = req.body;

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found.",
      });
    }

    if (chapterId && chapterId.toString() !== lecture.chapter.toString()) {
      const targetChapter = await Chapter.findById(chapterId);
      if (!targetChapter) {
        return res.status(404).json({
          success: false,
          message: "New referenced chapter not found.",
        });
      }
      lecture.chapter = chapterId;
      lecture.course = targetChapter.course;
    }

    if (title !== undefined) lecture.title = title;
    if (description !== undefined) lecture.description = description;
    if (isPreview !== undefined) lecture.isPreview = isPreview === "true" || isPreview === true;
    if (sortOrder !== undefined) lecture.sortOrder = sortOrder;
    if (isActive !== undefined) lecture.isActive = isActive;

    if (directVideoUrl) {
      // If direct URL is provided, replace old Cloudinary resource
      if (lecture.videoPublicId) {
        await deleteFromCloudinary(lecture.videoPublicId, "video");
        lecture.videoPublicId = "";
      }
      lecture.videoUrl = directVideoUrl;
      lecture.duration = 0;
    }

    if (req.file) {
      // Upload new video file to Cloudinary
      if (lecture.videoPublicId) {
        await deleteFromCloudinary(lecture.videoPublicId, "video");
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, "lectures", "video");
      lecture.videoUrl = uploadResult.url;
      lecture.videoPublicId = uploadResult.publicId;
      lecture.duration = uploadResult.duration || 0;
    }

    await lecture.save();

    return res.status(200).json({
      success: true,
      message: "Lecture updated successfully.",
      data: lecture,
    });
  } catch (error) {
    console.error("Update Lecture Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating lecture.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE LECTURE VIDEO (Admin Only)
// ==========================================
export const deleteLecture = async (req, res) => {
  try {
    const { id } = req.params;

    const lecture = await Lecture.findById(id);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found.",
      });
    }

    // Delete video from Cloudinary if exists
    if (lecture.videoPublicId) {
      await deleteFromCloudinary(lecture.videoPublicId, "video");
    }

    await Lecture.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Lecture deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Lecture Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting lecture.",
      error: error.message,
    });
  }
};

// ==========================================
// GET LECTURES BY CHAPTER (Student / Authenticated)
// Includes access control: unlocks videoUrl only for enrolled students (or preview lectures)
// ==========================================
export const getLectures = async (req, res) => {
  try {
    const { chapter: chapterId } = req.query;

    if (!chapterId) {
      return res.status(400).json({
        success: false,
        message: "Chapter query parameter is required.",
      });
    }

    const chapterObj = await Chapter.findById(chapterId);
    if (!chapterObj) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found.",
      });
    }

    const courseObj = await Course.findById(chapterObj.course);
    if (!courseObj) {
      return res.status(404).json({
        success: false,
        message: "Associated course/subject not found.",
      });
    }

    // Check if the student is enrolled in either the Course (subject) or the parent Batch (class)
    const student = await Student.findById(req.student._id);
    const hasCourseEnrollment = student.enrolledCourses.some(
      (item) => item.course.toString() === courseObj._id.toString()
    );
    const hasBatchEnrollment = student.enrolledBatches.some(
      (item) => item.batch.toString() === courseObj.batch.toString()
    );

    const isEnrolled = hasCourseEnrollment || hasBatchEnrollment;

    // Fetch active lectures
    const lectures = await Lecture.find({ chapter: chapterId, isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 });

    // Process lectures to hide videoUrl if not enrolled and isPreview is false
    const processedLectures = lectures.map((lecture) => {
      const lectureJSON = lecture.toJSON();
      if (isEnrolled || lectureJSON.isPreview) {
        lectureJSON.isLocked = false;
      } else {
        // Lock the lecture: hide the videoUrl
        lectureJSON.videoUrl = "";
        lectureJSON.isLocked = true;
      }
      return lectureJSON;
    });

    return res.status(200).json({
      success: true,
      message: "Lectures fetched successfully.",
      isEnrolled,
      data: processedLectures,
    });
  } catch (error) {
    console.error("Get Lectures Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching lectures.",
      error: error.message,
    });
  }
};
