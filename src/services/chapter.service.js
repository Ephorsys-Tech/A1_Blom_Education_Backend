import Chapter from "../model/appModel/chapter.model.js";
import Subject from "../model/appModel/subjects.model.js";
import Lecture from "../model/appModel/lecture.model.js";

// ==========================================
// CREATE CHAPTER Service
// ==========================================
export const createChapterService = async (data) => {
  const { name, chapterNumber, description, subject: subjectId, sortOrder } = data || {};

  if (!name || chapterNumber === undefined || !subjectId) {
    const error = new Error("Name, chapterNumber, and subject reference are required.");
    error.statusCode = 400;
    throw error;
  }

  // Verify subject exists
  const targetSubject = await Subject.findById(subjectId);
  if (!targetSubject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check unique chapterNumber per subject
  const duplicate = await Chapter.findOne({ subject: subjectId, chapterNumber });
  if (duplicate) {
    const error = new Error(`Chapter number ${chapterNumber} already exists in this subject.`);
    error.statusCode = 400;
    throw error;
  }

  const chapter = await Chapter.create({
    name,
    chapterNumber,
    description: description || "",
    subject: subjectId,
    sortOrder: sortOrder || 0,
  });

  return chapter;
};

// ==========================================
// UPDATE CHAPTER Service
// ==========================================
export const updateChapterService = async (id, data) => {
  const { name, chapterNumber, description, subject: subjectId, sortOrder, isActive } = data || {};

  const chapter = await Chapter.findById(id);
  if (!chapter) {
    const error = new Error("Chapter not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check duplicate chapterNumber if changed
  if (chapterNumber !== undefined && (chapterNumber !== chapter.chapterNumber || (subjectId && subjectId !== chapter.subject.toString()))) {
    const activeSubjectId = subjectId || chapter.subject;
    const duplicate = await Chapter.findOne({
      subject: activeSubjectId,
      chapterNumber,
      _id: { $ne: id },
    });
    if (duplicate) {
      const error = new Error(`Chapter number ${chapterNumber} already exists in this subject.`);
      error.statusCode = 400;
      throw error;
    }
    chapter.chapterNumber = chapterNumber;
  }

  if (subjectId) {
    const targetSubject = await Subject.findById(subjectId);
    if (!targetSubject) {
      const error = new Error("New referenced subject not found.");
      error.statusCode = 404;
      throw error;
    }
    chapter.subject = subjectId;
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

  // Find and delete all lectures in this chapter
  await Lecture.deleteMany({ chapter: id });

  await Chapter.findByIdAndDelete(id);
  return true;
};

// ==========================================
// GET ACTIVE CHAPTERS Service
// ==========================================
export const getChaptersService = async (subjectId) => {
  if (!subjectId) {
    const error = new Error("Subject query parameter is required.");
    error.statusCode = 400;
    throw error;
  }

  const chapters = await Chapter.find({ subject: subjectId, isActive: true })
    .sort({ sortOrder: 1, chapterNumber: 1 });

  return chapters;
};

// ==========================================
// GET ALL CHAPTERS (Admin Only) Service
// ==========================================
export const getAdminChaptersService = async (subjectId) => {
  if (!subjectId) {
    const error = new Error("Subject query parameter is required.");
    error.statusCode = 400;
    throw error;
  }

  const chapters = await Chapter.find({ subject: subjectId })
    .sort({ sortOrder: 1, chapterNumber: 1 });

  return chapters;
};

// ==========================================
// GET CHAPTER BY ID Service
// ==========================================
export const getChapterByIdService = async (id) => {
  const chapter = await Chapter.findById(id).populate("subject", "name code");
  if (!chapter) {
    const error = new Error("Chapter not found.");
    error.statusCode = 404;
    throw error;
  }
  return chapter;
};
