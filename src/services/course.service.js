import Course from "../model/appModel/course.model.js";
import Batch from "../model/appModel/batch.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// CREATE COURSE / SUBJECT Service
// ==========================================
export const createCourseService = async (data, file) => {
  const { name, code, description, price, discountPrice, batch: batchId, sortOrder } = data;

  if (!name || !code || !batchId || price === undefined) {
    const error = new Error("Name, code, batch reference, and price are required fields.");
    error.statusCode = 400;
    throw error;
  }

  // Verify batch exists
  const targetBatch = await Batch.findById(batchId);
  if (!targetBatch) {
    const error = new Error("Referenced batch not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check code uniqueness
  const codeExists = await Course.findOne({ code });
  if (codeExists) {
    const error = new Error(`Course with code '${code}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  let thumbnail = { public_id: "", url: "" };
  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, "courses", "image");
    thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  const course = await Course.create({
    name,
    code,
    description: description || "",
    price,
    discountPrice: discountPrice || 0,
    batch: batchId,
    sortOrder: sortOrder || 0,
    thumbnail,
  });

  // Increment totalSubjects count in the corresponding batch
  targetBatch.totalSubjects = (targetBatch.totalSubjects || 0) + 1;
  await targetBatch.save();

  return course;
};

// ==========================================
// UPDATE COURSE / SUBJECT Service
// ==========================================
export const updateCourseService = async (id, data, file) => {
  const { name, code, description, price, discountPrice, batch: batchId, sortOrder, isActive } = data;

  const course = await Course.findById(id);
  if (!course) {
    const error = new Error("Course/Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check code uniqueness if code is changed
  if (code && code !== course.code) {
    const codeExists = await Course.findOne({ code });
    if (codeExists) {
      const error = new Error(`Course with code '${code}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
    course.code = code;
  }

  // Handle batch change and adjust counts
  if (batchId && batchId.toString() !== course.batch.toString()) {
    const newBatch = await Batch.findById(batchId);
    if (!newBatch) {
      const error = new Error("New referenced batch not found.");
      error.statusCode = 404;
      throw error;
    }

    // Decrement totalSubjects from old batch
    await Batch.findByIdAndUpdate(course.batch, { $inc: { totalSubjects: -1 } });
    // Increment totalSubjects in new batch
    newBatch.totalSubjects = (newBatch.totalSubjects || 0) + 1;
    await newBatch.save();

    course.batch = batchId;
  }

  if (name !== undefined) course.name = name;
  if (description !== undefined) course.description = description;
  if (price !== undefined) course.price = price;
  if (discountPrice !== undefined) course.discountPrice = discountPrice;
  if (sortOrder !== undefined) course.sortOrder = sortOrder;
  if (isActive !== undefined) course.isActive = isActive;

  if (file) {
    // Delete old thumbnail if it exists
    if (course.thumbnail && course.thumbnail.public_id) {
      await deleteFromCloudinary(course.thumbnail.public_id, "image");
    }
    const uploadResult = await uploadToCloudinary(file.buffer, "courses", "image");
    course.thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  await course.save();
  return course;
};

// ==========================================
// DELETE COURSE / SUBJECT Service
// ==========================================
export const deleteCourseService = async (id) => {
  const course = await Course.findById(id);
  if (!course) {
    const error = new Error("Course/Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete thumbnail from Cloudinary if exists
  if (course.thumbnail && course.thumbnail.public_id) {
    await deleteFromCloudinary(course.thumbnail.public_id, "image");
  }

  const batchId = course.batch;

  await Course.findByIdAndDelete(id);

  // Decrement totalSubjects count in the corresponding batch
  if (batchId) {
    await Batch.findByIdAndUpdate(batchId, { $inc: { totalSubjects: -1 } });
  }

  return true;
};

// ==========================================
// GET ACTIVE COURSES / SUBJECTS Service
// ==========================================
export const getCoursesService = async (queryBatch) => {
  const filter = { isActive: true };

  if (queryBatch) {
    filter.batch = queryBatch;
  }

  const courses = await Course.find(filter)
    .populate("batch", "name classNumber description")
    .sort({ sortOrder: 1 });

  return courses;
};

// ==========================================
// GET ALL COURSES (Admin) Service
// ==========================================
export const getAdminCoursesService = async (queryBatch) => {
  const filter = {};

  if (queryBatch) {
    filter.batch = queryBatch;
  }

  const courses = await Course.find(filter)
    .populate("batch", "name classNumber description")
    .sort({ sortOrder: 1 });

  return courses;
};

// ==========================================
// GET COURSE BY ID Service
// ==========================================
export const getCourseByIdService = async (id) => {
  const course = await Course.findById(id).populate("batch", "name classNumber description");
  if (!course) {
    const error = new Error("Course/Subject not found.");
    error.statusCode = 404;
    throw error;
  }
  return course;
};
