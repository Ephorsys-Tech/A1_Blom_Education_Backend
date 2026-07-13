import Classes from "../model/appModel/classes.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// CREATE CLASS Service
// ==========================================
export const createClassService = async (data, file) => {
  const { name, classNumber, description, price, discountPrice, sortOrder } = data;

  if (!name || !classNumber || price === undefined) {
    const error = new Error("Name, classNumber, and price are required fields.");
    error.statusCode = 400;
    throw error;
  }

  // Check if class name or classNumber already exists
  const nameExists = await Classes.findOne({ name });
  if (nameExists) {
    const error = new Error(`Class name '${name}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  const classExists = await Classes.findOne({ classNumber });
  if (classExists) {
    const error = new Error(`Class ${classNumber} already exists.`);
    error.statusCode = 400;
    throw error;
  }

  let thumbnail = { public_id: "", url: "" };

  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, "classes", "image");
    thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  const classes = await Classes.create({
    name,
    classNumber,
    description: description || "",
    price,
    discountPrice: discountPrice || 0,
    sortOrder: sortOrder || 0,
    thumbnail,
  });

  return classes;
};

// ==========================================
// UPDATE CLASS Service
// ==========================================
export const updateClassService = async (id, data, file) => {
  const { name, classNumber, description, price, discountPrice, sortOrder, isActive } = data;

  const classes = await Classes.findById(id);
  if (!classes) {
    const error = new Error("Class not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check uniqueness if name is changed
  if (name && name !== classes.name) {
    const nameExists = await Classes.findOne({ name });
    if (nameExists) {
      const error = new Error(`Class name '${name}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
    classes.name = name;
  }

  // Check uniqueness if classNumber is changed
  if (classNumber && Number(classNumber) !== classes.classNumber) {
    const classExists = await Classes.findOne({ classNumber });
    if (classExists) {
      const error = new Error(`Class ${classNumber} already exists.`);
      error.statusCode = 400;
      throw error;
    }
    classes.classNumber = classNumber;
  }

  if (description !== undefined) classes.description = description;
  if (price !== undefined) classes.price = price;
  if (discountPrice !== undefined) classes.discountPrice = discountPrice;
  if (sortOrder !== undefined) classes.sortOrder = sortOrder;
  if (isActive !== undefined) classes.isActive = isActive;

  if (file) {
    // Delete old thumbnail if it exists
    if (classes.thumbnail && classes.thumbnail.public_id) {
      await deleteFromCloudinary(classes.thumbnail.public_id, "image");
    }
    const uploadResult = await uploadToCloudinary(file.buffer, "classes", "image");
    classes.thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  await classes.save();
  return classes;
};

// ==========================================
// DELETE CLASS Service
// ==========================================
export const deleteClassService = async (id) => {
  const classes = await Classes.findById(id);
  if (!classes) {
    const error = new Error("Class not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete thumbnail from Cloudinary if exists
  if (classes.thumbnail && classes.thumbnail.public_id) {
    await deleteFromCloudinary(classes.thumbnail.public_id, "image");
  }

  await Classes.findByIdAndDelete(id);
  return true;
};

// ==========================================
// GET ACTIVE CLASSES Service
// ==========================================
export const getClassesService = async () => {
  const classesList = await Classes.find({ isActive: true }).sort({ sortOrder: 1 });
  return classesList;
};

// ==========================================
// GET ALL CLASSES (Admin) Service
// ==========================================
export const getAdminClassesService = async () => {
  const classesList = await Classes.find().sort({ sortOrder: 1 });
  return classesList;
};

// ==========================================
// GET CLASS BY ID Service
// ==========================================
export const getClassByIdService = async (id) => {
  const classes = await Classes.findById(id);
  if (!classes) {
    const error = new Error("Class not found.");
    error.statusCode = 404;
    throw error;
  }
  return classes;
};
