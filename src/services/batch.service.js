import Batch from "../model/appModel/batch.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../config/cloudinary.config.js";

// ==========================================
// CREATE BATCH Service
// ==========================================
export const createBatchService = async (data, file) => {
  const { name, classNumber, description, price, discountPrice, sortOrder } = data;

  if (!name || !classNumber || price === undefined) {
    const error = new Error("Name, classNumber, and price are required fields.");
    error.statusCode = 400;
    throw error;
  }

  // Check if batch name or classNumber already exists
  const nameExists = await Batch.findOne({ name });
  if (nameExists) {
    const error = new Error(`Batch name '${name}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  const classExists = await Batch.findOne({ classNumber });
  if (classExists) {
    const error = new Error(`Batch for Class ${classNumber} already exists.`);
    error.statusCode = 400;
    throw error;
  }

  let thumbnail = { public_id: "", url: "" };

  if (file) {
    const uploadResult = await uploadToCloudinary(file.buffer, "batches", "image");
    thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  const batch = await Batch.create({
    name,
    classNumber,
    description: description || "",
    price,
    discountPrice: discountPrice || 0,
    sortOrder: sortOrder || 0,
    thumbnail,
  });

  return batch;
};

// ==========================================
// UPDATE BATCH Service
// ==========================================
export const updateBatchService = async (id, data, file) => {
  const { name, classNumber, description, price, discountPrice, sortOrder, isActive } = data;

  const batch = await Batch.findById(id);
  if (!batch) {
    const error = new Error("Batch not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check uniqueness if name is changed
  if (name && name !== batch.name) {
    const nameExists = await Batch.findOne({ name });
    if (nameExists) {
      const error = new Error(`Batch name '${name}' already exists.`);
      error.statusCode = 400;
      throw error;
    }
    batch.name = name;
  }

  // Check uniqueness if classNumber is changed
  if (classNumber && Number(classNumber) !== batch.classNumber) {
    const classExists = await Batch.findOne({ classNumber });
    if (classExists) {
      const error = new Error(`Batch for Class ${classNumber} already exists.`);
      error.statusCode = 400;
      throw error;
    }
    batch.classNumber = classNumber;
  }

  if (description !== undefined) batch.description = description;
  if (price !== undefined) batch.price = price;
  if (discountPrice !== undefined) batch.discountPrice = discountPrice;
  if (sortOrder !== undefined) batch.sortOrder = sortOrder;
  if (isActive !== undefined) batch.isActive = isActive;

  if (file) {
    // Delete old thumbnail if it exists
    if (batch.thumbnail && batch.thumbnail.public_id) {
      await deleteFromCloudinary(batch.thumbnail.public_id, "image");
    }
    const uploadResult = await uploadToCloudinary(file.buffer, "batches", "image");
    batch.thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  await batch.save();
  return batch;
};

// ==========================================
// DELETE BATCH Service
// ==========================================
export const deleteBatchService = async (id) => {
  const batch = await Batch.findById(id);
  if (!batch) {
    const error = new Error("Batch not found.");
    error.statusCode = 404;
    throw error;
  }

  // Delete thumbnail from Cloudinary if exists
  if (batch.thumbnail && batch.thumbnail.public_id) {
    await deleteFromCloudinary(batch.thumbnail.public_id, "image");
  }

  await Batch.findByIdAndDelete(id);
  return true;
};

// ==========================================
// GET ACTIVE BATCHES Service
// ==========================================
export const getBatchesService = async () => {
  const batches = await Batch.find({ isActive: true }).sort({ sortOrder: 1 });
  return batches;
};

// ==========================================
// GET ALL BATCHES (Admin) Service
// ==========================================
export const getAdminBatchesService = async () => {
  const batches = await Batch.find().sort({ sortOrder: 1 });
  return batches;
};

// ==========================================
// GET BATCH BY ID Service
// ==========================================
export const getBatchByIdService = async (id) => {
  const batch = await Batch.findById(id);
  if (!batch) {
    const error = new Error("Batch not found.");
    error.statusCode = 404;
    throw error;
  }
  return batch;
};
