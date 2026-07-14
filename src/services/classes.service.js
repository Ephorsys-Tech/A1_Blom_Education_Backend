import Classes from "../model/appModel/classes.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../config/cloudinary.config.js";

// CREATE CLASS Service
export const createClassService = async (data, file) => {
  const { classNumber, description, price, discountPercent, sortOrder } = data;

  if (classNumber === undefined || price === undefined) {
    const error = new Error(
      "classNumber, description, and price are required fields.",
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if class classNumber already exists
  const classnumberExists = await Classes.findOne({ classNumber });
  if (classnumberExists) {
    const error = new Error(`Class number '${classNumber}' already exists.`);
    error.statusCode = 400;
    throw error;
  }

  let thumbnail = { public_id: "", url: "" };

  if (file) {
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      "classes",
      "image",
    );
    thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  const finalPrice = price - (price * (discountPercent || 0)) / 100;

  const classes = await Classes.create({
    classNumber,
    description: description || "",
    price,
    discountPercent,
    discountPrice: finalPrice || 0,
    sortOrder: sortOrder || 0,
    thumbnail,
  });

  return classes;
};

// UPDATE CLASS Service
export const updateClassService = async (id, data, file) => {
  const {
    classNumber,
    description,
    price,
    discountPercent,
    sortOrder,
  } = data;

  const classes = await Classes.findById(id);
  if (!classes) {
    const error = new Error("Class not found.");
    error.statusCode = 404;
    throw error;
  }

  // Check uniqueness if classNumber is changed
  if (classNumber && classNumber !== classes.classNumber) {
    const nameExists = await Classes.findOne({ classNumber });
    if (nameExists) {
      const error = new Error(
        `Class classNumber '${classNumber}' already exists.`,
      );
      error.statusCode = 400;
      throw error;
    }
    classes.classNumber = classNumber;
  }

  if (description !== undefined) classes.description = description;
  if (price !== undefined) classes.price = price;
  if (sortOrder !== undefined) classes.sortOrder = sortOrder;
  if (discountPercent !== undefined) {
    classes.discountPercent = discountPercent;
    classes.discountPrice =
      classes.price - (classes.price * discountPercent || 0) / 100;
  }

  if (file) {
    // Delete old thumbnail if it exists
    if (classes.thumbnail && classes.thumbnail.public_id) {
      await deleteFromCloudinary(classes.thumbnail.public_id, "image");
    }
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      "classes",
      "image",
    );
    classes.thumbnail = {
      public_id: uploadResult.publicId,
      url: uploadResult.url,
    };
  }

  await classes.save();
  return classes;
};

// DELETE CLASS Service
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

// GET ACTIVE CLASSES Service
export const getClassesService = async () => {
  const classesList = await Classes.find({ isActive: true }).sort({
    sortOrder: 1,
  });
  return classesList;
};


// GET CLASS BY ID Service
export const getClassByIdService = async (id) => {
  const classes = await Classes.findById(id);
  if (!classes) {
    const error = new Error("Class not found.");
    error.statusCode = 404;
    throw error;
  }
  return classes;
};
