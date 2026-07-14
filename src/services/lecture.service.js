import Lecture from "../model/appModel/lecture.model.js";
import Chapter from "../model/appModel/chapter.model.js";
import Subject from "../model/appModel/subjects.model.js";
import Student from "../model/appModel/student.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// CREATE LECTURE Service
// ==========================================
export const createLectureService = async (data, file) => {
  const { title, description, chapter: chapterId, isPreview, sortOrder, videoUrl: directVideoUrl } = data || {};

  if (!title || !chapterId) {
    const error = new Error("Title and chapter reference are required.");
    error.statusCode = 400;
    throw error;
  }

  // Verify chapter exists and retrieve its subject
  const targetChapter = await Chapter.findById(chapterId);
  if (!targetChapter) {
    const error = new Error("Referenced chapter not found.");
    error.statusCode = 404;
    throw error;
  }

  let videoUrl = directVideoUrl || "";
  let videoPublicId = "";
  let duration = 0;

  if (file) {
    // Upload video buffer to Cloudinary
    const uploadResult = await uploadToCloudinary(file.buffer, "lectures", "video");
    videoUrl = uploadResult.url;
    videoPublicId = uploadResult.publicId;
    duration = uploadResult.duration || 0;
  }

  if (!videoUrl) {
    const error = new Error("Please upload a video file or provide a video URL.");
    error.statusCode = 400;
    throw error;
  }

  const lecture = await Lecture.create({
    title,
    description: description || "",
    videoUrl,
    videoPublicId,
    duration,
    chapter: chapterId,
    subject: targetChapter.subject,
    isPreview: isPreview === "true" || isPreview === true,
    sortOrder: sortOrder || 0,
  });

  return lecture;
};

// ==========================================
// UPDATE LECTURE Service
// ==========================================
export const updateLectureService = async (id, data, file) => {
  const { title, description, chapter: chapterId, isPreview, sortOrder, isActive, videoUrl: directVideoUrl } = data || {};

  const lecture = await Lecture.findById(id);
  if (!lecture) {
    const error = new Error("Lecture not found.");
    error.statusCode = 404;
    throw error;
  }

  if (chapterId && chapterId.toString() !== lecture.chapter.toString()) {
    const targetChapter = await Chapter.findById(chapterId);
    if (!targetChapter) {
      const error = new Error("New referenced chapter not found.");
      error.statusCode = 404;
      throw error;
    }
    lecture.chapter = chapterId;
    lecture.subject = targetChapter.subject;
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

  if (file) {
    // Upload new video file to Cloudinary
    if (lecture.videoPublicId) {
      await deleteFromCloudinary(lecture.videoPublicId, "video");
    }
    const uploadResult = await uploadToCloudinary(file.buffer, "lectures", "video");
    lecture.videoUrl = uploadResult.url;
    lecture.videoPublicId = uploadResult.publicId;
    lecture.duration = uploadResult.duration || 0;
  }

  await lecture.save();
  return lecture;
};

// ==========================================
// DELETE LECTURE Service
// ==========================================
export const deleteLectureService = async (id) => {
  const lecture = await Lecture.findById(id);
  if (!lecture) {
    const error = new Error("Lecture not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete video from Cloudinary if exists
  if (lecture.videoPublicId) {
    await deleteFromCloudinary(lecture.videoPublicId, "video");
  }

  await Lecture.findByIdAndDelete(id);
  return true;
};

// ==========================================
// GET LECTURES BY CHAPTER Service
// ==========================================
export const getLecturesService = async (chapterId, studentId) => {
  if (!chapterId) {
    const error = new Error("Chapter query parameter is required.");
    error.statusCode = 400;
    throw error;
  }

  const chapterObj = await Chapter.findById(chapterId);
  if (!chapterObj) {
    const error = new Error("Chapter not found.");
    error.statusCode = 404;
    throw error;
  }

  const subjectObj = await Subject.findById(chapterObj.subject);
  if (!subjectObj) {
    const error = new Error("Associated subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check if the student is enrolled in either the Subject or the parent Classes
  const student = await Student.findById(studentId);
  if (!student) {
    const error = new Error("Student not found.");
    error.statusCode = 404;
    throw error;
  }

  const hasSubjectEnrollment = student.enrolledSubjects.some(
    (item) => item.subject.toString() === subjectObj._id.toString()
  );
  const hasClassEnrollment = student.enrolledClasses.some(
    (item) => item.classes.toString() === subjectObj.classes.toString()
  );

  const isEnrolled = hasSubjectEnrollment || hasClassEnrollment; 

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

  return {
    isEnrolled,
    processedLectures,
  };
};
