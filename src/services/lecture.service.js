import mongoose from "mongoose";
import Lecture from "../model/appModel/lecture.model.js";
import Chapter from "../model/appModel/chapter.model.js";
import Subject from "../model/appModel/subjects.model.js";
import Student from "../model/appModel/student.model.js";
import { processUploadedVideo } from "./video.service.js";
import { uploadDirectoryToS3 } from "../utils/s3Helper.js";
import fs from "fs";
import path from "path";

// ==========================================
// CREATE LECTURE Service
// ==========================================
export const createLectureService = async (data, file) => {
  const { title, description, chapter: chapterId, isPreview, sortOrder, videoUrl: directVideoUrl, chunkDuration } = data || {};

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
  let duration = 0;
  
  // Pre-generate lecture ID for structured S3 path
  const lectureId = new mongoose.Types.ObjectId();

  if (file) {
    // Process local disk uploaded video: generate chunks locally
    const durationSec = Number(chunkDuration) || 10;
    const processResult = await processUploadedVideo(file.path, durationSec);
    
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
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
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
    videoUrl,
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
  const { title, description, chapter: chapterId, isPreview, sortOrder, isActive, videoUrl: directVideoUrl, chunkDuration } = data || {};

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
    lecture.videoUrl = directVideoUrl;
    lecture.duration = 0;
  }

  if (file) {
    // Process local disk uploaded video: generate chunks locally
    const durationSec = Number(chunkDuration) || 10;
    const processResult = await processUploadedVideo(file.path, durationSec);
    
    // Upload directory to S3
    const s3Prefix = `videos/subject-${lecture.subject}/chapter-${lecture.chapter}/lecture-${lecture._id}`;
    const s3Urls = await uploadDirectoryToS3(processResult.outputDir, s3Prefix);

    // Find the master playlist URL
    const masterUrl = s3Urls.find(url => url.endsWith('master.m3u8'));
    
    if (!masterUrl) {
      throw new Error("Failed to generate or upload master playlist.");
    }

    lecture.videoUrl = masterUrl;
    lecture.duration = processResult.duration || 0;

    // Clean up local files
    try {
      if (fs.existsSync(processResult.outputDir)) {
        fs.rmSync(processResult.outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      }
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
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
