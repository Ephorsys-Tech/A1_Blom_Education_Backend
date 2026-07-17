import Subject from "../model/appModel/subjects.model.js";
import Classes from "../model/appModel/classes.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.config.js";

// ==========================================
// CREATE SUBJECT Service
// ==========================================
export const createSubjectService = async (data) => {
  const {
    name,
    description,
    price,
    discountPercent,
    classes: classesId,
    sortOrder,
  } = data;

  if (!name || !classesId || price === undefined) {
    const error = new Error(
      "Name, class reference, and price are required fields.",
    );
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

  const percent = Number(discountPercent) || 0;
  const finalPrice = price - (price * percent) / 100;

  const subject = await Subject.create({
    name,
    description: description || "",
    price,
    discountPercent,
    discountPrice: finalPrice || 0,
    classes: classesId,
    sortOrder: sortOrder || 0,
  });

  targetClass.subjects.push(subject._id);
  await targetClass.save();

  return subject;
};

export const updateSubjectService = async (idF, data) => {
  const { name, description, price, discountPercent, sortOrder } = data;

  const subject = await Subject.findById(id);
  if (!subject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check code uniqueness if code is changed
  if (name && name !== subject.name) {
    const nameExists = await Subject.findOne({ name, _id: { $ne: id } });
    if (nameExists) {
      const error = new Error(`Subject with name '${name}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
    subject.name = name;
  }
  if (description !== undefined) subject.description = description;
  if (price !== undefined) subject.price = price;
  if (sortOrder !== undefined) subject.sortOrder = sortOrder;
  const pct = Number(discountPercent ?? subject.discountPercent ?? 0);

  // update values
  if (discountPercent !== undefined) subject.discountPercent = pct;

  // always recalculate price
  subject.discountPrice = subject.price - (subject.price * pct) / 100;

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
// GET SUBJECT BY ID Service
// ==========================================
export const getSubjectByIdService = async (id) => {
  const subject = await Subject.findById(id).populate(
    "classes",
    "name classNumber description",
  );
  if (!subject) {
    const error = new Error("Subject not found.");
    error.statusCode = 404;
    throw error;
  }
  return subject;
};
