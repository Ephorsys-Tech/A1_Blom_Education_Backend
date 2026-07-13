import Subject from "../model/appModel/subjects.model.js";
import Classes from "../model/appModel/classes.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// CREATE SUBJECT Service
// ==========================================
export const createSubjectService = async (data, file) => {
  const { name, code, description, price, discountPrice, classes: classesId, sortOrder } = data;

  if (!name || !code || !classesId || price === undefined) {
    const error = new Error("Name, code, class reference, and price are required fields.");
    error.statusCode = 400;
    throw error;
  }

  // Verify class exists
  const targetClass = await Classes.findById(classesId);
  if (!targetClass) {
    const error = new Error("Referenced class not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check code uniqueness
  const codeExists = await Subject.findOne({ code });
  if (codeExists) {
    const error = new Error(`Subject with code '${code}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  let thumbnail = { public_id: "", url: "" };
  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, "subjects", "image");
    thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  const subject = await Subject.create({
    name,
    code,
    description: description || "",
    price,
    discountPrice: discountPrice || 0,
    classes: classesId,
    sortOrder: sortOrder || 0,
    thumbnail,
  });

  // Increment totalSubjects count in the corresponding class
  targetClass.totalSubjects = (targetClass.totalSubjects || 0) + 1;
  await targetClass.save();

  return subject;
};

// ==========================================
// UPDATE SUBJECT Service
// ==========================================
export const updateSubjectService = async (id, data, file) => {
  const { name, code, description, price, discountPrice, classes: classesId, sortOrder, isActive } = data;

  const subject = await Subject.findById(id);
  if (!subject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check code uniqueness if code is changed
  if (code && code !== subject.code) {
    const codeExists = await Subject.findOne({ code });
    if (codeExists) {
      const error = new Error(`Subject with code '${code}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
    subject.code = code;
  }

  // Handle class change and adjust counts
  if (classesId && classesId.toString() !== subject.classes.toString()) {
    const newClass = await Classes.findById(classesId);
    if (!newClass) {
      const error = new Error("New referenced class not found.");
      error.statusCode = 404;
      throw error;
    }

    // Decrement totalSubjects from old class
    await Classes.findByIdAndUpdate(subject.classes, { $inc: { totalSubjects: -1 } });
    // Increment totalSubjects in new class
    newClass.totalSubjects = (newClass.totalSubjects || 0) + 1;
    await newClass.save();

    subject.classes = classesId;
  }

  if (name !== undefined) subject.name = name;
  if (description !== undefined) subject.description = description;
  if (price !== undefined) subject.price = price;
  if (discountPrice !== undefined) subject.discountPrice = discountPrice;
  if (sortOrder !== undefined) subject.sortOrder = sortOrder;
  if (isActive !== undefined) subject.isActive = isActive;

  if (file) {
    // Delete old thumbnail if it exists
    if (subject.thumbnail && subject.thumbnail.public_id) {
      await deleteFromCloudinary(subject.thumbnail.public_id, "image");
    }
    const uploadResult = await uploadToCloudinary(file.buffer, "subjects", "image");
    subject.thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  await subject.save();
  return subject;
};

// ==========================================
// DELETE SUBJECT Service
// ==========================================
export const deleteSubjectService = async (id) => {
  const subject = await Subject.findById(id);
  if (!subject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete thumbnail from Cloudinary if exists
  if (subject.thumbnail && subject.thumbnail.public_id) {
    await deleteFromCloudinary(subject.thumbnail.public_id, "image");
  }

  const classesId = subject.classes;

  await Subject.findByIdAndDelete(id);

  // Decrement totalSubjects count in the corresponding class
  if (classesId) {
    await Classes.findByIdAndUpdate(classesId, { $inc: { totalSubjects: -1 } });
  }

  return true;
};

// ==========================================
// GET ACTIVE SUBJECTS Service
// ==========================================
export const getSubjectsService = async (queryClass) => {
  const filter = { isActive: true };

  if (queryClass) {
    filter.classes = queryClass;
  }

  const subjects = await Subject.find(filter)
    .populate("classes", "name classNumber description")
    .sort({ sortOrder: 1 });

  return subjects;
};

// ==========================================
// GET ALL SUBJECTS (Admin) Service
// ==========================================
export const getAdminSubjectsService = async (queryClass) => {
  const filter = {};

  if (queryClass) {
    filter.classes = queryClass;
  }

  const subjects = await Subject.find(filter)
    .populate("classes", "name classNumber description")
    .sort({ sortOrder: 1 });

  return subjects;
};

// ==========================================
// GET SUBJECT BY ID Service
// ==========================================
export const getSubjectByIdService = async (id) => {
  const subject = await Subject.findById(id).populate("classes", "name classNumber description");
  if (!subject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    throw error;
  }
  return subject;
};
