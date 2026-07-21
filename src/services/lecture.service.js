import mongoose from "mongoose";
import Lecture from "../model/appModel/lecture.model.js";
import Chapter from "../model/appModel/chapter.model.js";
import Subject from "../model/appModel/subjects.model.js";
import Classes from "../model/appModel/classes.model.js";
import Student from "../model/appModel/student.model.js";
import { processUploadedVideo } from "./video.service.js";
import { uploadDirectoryToS3, uploadFileToS3 } from "../utils/s3Helper.js";
import fs from "fs";
import path from "path";

// ==========================================
// CREATE LECTURE Service
// ==========================================
export const createLectureService = async (data, files) => {
  const {
    title,
    description,
    chapter: chapterId,
    classes: inputClassesId,
    thumbnailUrl: directThumbnailUrl,
    videoUrl: directVideoUrl,
    isPreview,
    sortOrder,
    chunkDuration,
  } = data || {};

  if (!title || !chapterId) {
    const error = new Error("Title and chapter reference are required.");
    error.statusCode = 400;
    throw error;
  }

  // Parse file references (supports multer fields or single file)
  let videoFile = null;
  let thumbnailFile = null;

  if (files) {
    if (files.video) {
      videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
    } else if (files.path) {
      videoFile = files;
    }

    if (files.thumbnail || files.thumbnailUrl) {
      const thumb = files.thumbnail || files.thumbnailUrl;
      thumbnailFile = Array.isArray(thumb) ? thumb[0] : thumb;
    }
  }

  // Verify chapter exists and retrieve its subject
  const targetChapter = await Chapter.findById(chapterId);
  if (!targetChapter) {
    const error = new Error("Referenced chapter not found.");
    error.statusCode = 404;
    throw error;
  }

  const targetSubject = await Subject.findById(targetChapter.subject);
  if (!targetSubject) {
    const error = new Error("Referenced subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Determine class ID (passed directly or inherited from Subject)
  let classesId = inputClassesId || targetSubject.classes;
  if (!classesId) {
    const error = new Error("Class reference is required.");
    error.statusCode = 400;
    throw error;
  }

  const targetClass = await Classes.findById(classesId);
  if (!targetClass) {
    const error = new Error("Referenced class not found.");
    error.statusCode = 404;
    throw error;
  }

  let videoUrl = directVideoUrl || "";
  let duration = 0;
  let thumbnailUrl = directThumbnailUrl || "";
  
  // Pre-generate lecture ID for structured S3 path
  const lectureId = new mongoose.Types.ObjectId();

  // Handle Thumbnail Upload if file attached
  if (thumbnailFile) {
    try {
      const ext = path.extname(thumbnailFile.originalname || thumbnailFile.filename || ".jpg");
      const thumbS3Key = `thumbnails/lecture-${lectureId}${ext}`;
      thumbnailUrl = await uploadFileToS3(thumbnailFile.path, thumbS3Key);

      if (fs.existsSync(thumbnailFile.path)) {
        fs.unlinkSync(thumbnailFile.path);
      }
    } catch (thumbErr) {
      console.error("Error uploading lecture thumbnail to S3:", thumbErr);
    }
  }

  // Handle Video Processing and Upload
  if (videoFile) {
    const durationSec = Number(chunkDuration) || 10;
    const processResult = await processUploadedVideo(videoFile.path, durationSec);
    
    // Upload directory to S3
    const s3Prefix = `videos/subject-${targetChapter.subject}/chapter-${chapterId}/lecture-${lectureId}`;
    const s3Urls = await uploadDirectoryToS3(processResult.outputDir, s3Prefix);

    // Find the master playlist URL
    const masterUrl = s3Urls.find(url => url.endsWith('master.m3u8'));
    
    if (!masterUrl) {
      throw new Error("Failed to generate or upload master playlist.");
    }

    videoUrl = masterUrl;
    duration = processResult.duration || 0;

    // Clean up local files
    try {
      if (fs.existsSync(processResult.outputDir)) {
        fs.rmSync(processResult.outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
      if (fs.existsSync(videoFile.path)) {
        fs.unlinkSync(videoFile.path);
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up local files:", cleanupErr);
    }
  }

  if (!videoUrl) {
    const error = new Error("Please upload a video file or provide a video URL.");
    error.statusCode = 400;
    throw error;
  }

  const lecture = await Lecture.create({
    _id: lectureId,
    title,
    description: description || "",
    thumbnailUrl,
    videoUrl,
    duration,
    chapter: chapterId,
    subject: targetChapter.subject,
    classes: classesId,
    isPreview: isPreview === "true" || isPreview === true,
    sortOrder: sortOrder || 0,
  });

  return lecture;
};

// ==========================================
// UPDATE LECTURE Service
// ==========================================
export const updateLectureService = async (id, data, files) => {
  const {
    title,
    description,
    chapter: chapterId,
    classes: inputClassesId,
    thumbnailUrl: directThumbnailUrl,
    videoUrl: directVideoUrl,
    isPreview,
    sortOrder,
    isActive,
    chunkDuration,
  } = data || {};

  const lecture = await Lecture.findById(id);
  if (!lecture) {
    const error = new Error("Lecture not found.");
    error.statusCode = 404;
    throw error;
  }

  let videoFile = null;
  let thumbnailFile = null;

  if (files) {
    if (files.video) {
      videoFile = Array.isArray(files.video) ? files.video[0] : files.video;
    } else if (files.path) {
      videoFile = files;
    }

    if (files.thumbnail || files.thumbnailUrl) {
      const thumb = files.thumbnail || files.thumbnailUrl;
      thumbnailFile = Array.isArray(thumb) ? thumb[0] : thumb;
    }
  }

  if (chapterId && chapterId.toString() !== lecture.chapter.toString()) {
    const targetChapter = await Chapter.findById(chapterId);
    if (!targetChapter) {
      const error = new Error("New referenced chapter not found.");
      error.statusCode = 404;
      throw error;
    }
    const targetSubject = await Subject.findById(targetChapter.subject);
    lecture.chapter = chapterId;
    lecture.subject = targetChapter.subject;
    if (targetSubject && targetSubject.classes) {
      lecture.classes = targetSubject.classes;
    }
  }

  if (inputClassesId) {
    const targetClass = await Classes.findById(inputClassesId);
    if (!targetClass) {
      const error = new Error("Referenced class not found.");
      error.statusCode = 404;
      throw error;
    }
    lecture.classes = inputClassesId;
  }

  if (title !== undefined) lecture.title = title;
  if (description !== undefined) lecture.description = description;
  if (isPreview !== undefined) lecture.isPreview = isPreview === "true" || isPreview === true;
  if (sortOrder !== undefined) lecture.sortOrder = sortOrder;
  if (isActive !== undefined) lecture.isActive = isActive;

  if (directThumbnailUrl !== undefined) {
    lecture.thumbnailUrl = directThumbnailUrl;
  }

  if (thumbnailFile) {
    try {
      const ext = path.extname(thumbnailFile.originalname || thumbnailFile.filename || ".jpg");
      const thumbS3Key = `thumbnails/lecture-${lecture._id}${ext}`;
      lecture.thumbnailUrl = await uploadFileToS3(thumbnailFile.path, thumbS3Key);

      if (fs.existsSync(thumbnailFile.path)) {
        fs.unlinkSync(thumbnailFile.path);
      }
    } catch (thumbErr) {
      console.error("Error uploading lecture thumbnail to S3:", thumbErr);
    }
  }

  if (directVideoUrl) {
    lecture.videoUrl = directVideoUrl;
    lecture.duration = 0;
  }

  if (videoFile) {
    const durationSec = Number(chunkDuration) || 10;
    const processResult = await processUploadedVideo(videoFile.path, durationSec);
    
    const s3Prefix = `videos/subject-${lecture.subject}/chapter-${lecture.chapter}/lecture-${lecture._id}`;
    const s3Urls = await uploadDirectoryToS3(processResult.outputDir, s3Prefix);

    const masterUrl = s3Urls.find(url => url.endsWith('master.m3u8'));
    
    if (!masterUrl) {
      throw new Error("Failed to generate or upload master playlist.");
    }

    lecture.videoUrl = masterUrl;
    lecture.duration = processResult.duration || 0;

    try {
      if (fs.existsSync(processResult.outputDir)) {
        fs.rmSync(processResult.outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
      if (fs.existsSync(videoFile.path)) {
        fs.unlinkSync(videoFile.path);
      }
    } catch (cleanupErr) {
      console.error("Error cleaning up local files:", cleanupErr);
    }
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
