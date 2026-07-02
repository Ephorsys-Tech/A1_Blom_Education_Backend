import Batch from "../../model/StudentModel/batch.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.config.js";

// ==========================================
// CREATE BATCH (Admin Only)
// ==========================================
export const createBatch = async (req, res) => {
  try {
    const { name, classNumber, description, price, discountPrice, sortOrder } = req.body;

    if (!name || !classNumber || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, classNumber, and price are required fields.",
      });
    }

    // Check if batch name or classNumber already exists
    const nameExists = await Batch.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        success: false,
        message: `Batch name '${name}' already exists.`,
      });
    }

    const classExists = await Batch.findOne({ classNumber });
    if (classExists) {
      return res.status(400).json({
        success: false,
        message: `Batch for Class ${classNumber} already exists.`,
      });
    }

    let thumbnail = { public_id: "", url: "" };

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "batches", "image");
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

    return res.status(201).json({
      success: true,
      message: "Batch created successfully.",
      data: batch,
    });
  } catch (error) {
    console.error("Create Batch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating batch.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE BATCH (Admin Only)
// ==========================================
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, classNumber, description, price, discountPrice, sortOrder, isActive } = req.body;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    // Check uniqueness if name is changed
    if (name && name !== batch.name) {
      const nameExists = await Batch.findOne({ name });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: `Batch name '${name}' already exists.`,
        });
      }
      batch.name = name;
    }

    // Check uniqueness if classNumber is changed
    if (classNumber && Number(classNumber) !== batch.classNumber) {
      const classExists = await Batch.findOne({ classNumber });
      if (classExists) {
        return res.status(400).json({
          success: false,
          message: `Batch for Class ${classNumber} already exists.`,
        });
      }
      batch.classNumber = classNumber;
    }

    if (description !== undefined) batch.description = description;
    if (price !== undefined) batch.price = price;
    if (discountPrice !== undefined) batch.discountPrice = discountPrice;
    if (sortOrder !== undefined) batch.sortOrder = sortOrder;
    if (isActive !== undefined) batch.isActive = isActive;

    if (req.file) {
      // Delete old thumbnail if it exists
      if (batch.thumbnail && batch.thumbnail.public_id) {
        await deleteFromCloudinary(batch.thumbnail.public_id, "image");
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, "batches", "image");
      batch.thumbnail = {
        public_id: uploadResult.publicId,
        url: uploadResult.url,
      };
    }

    await batch.save();

    return res.status(200).json({
      success: true,
      message: "Batch updated successfully.",
      data: batch,
    });
  } catch (error) {
    console.error("Update Batch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating batch.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE BATCH (Admin Only)
// ==========================================
export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    // Delete thumbnail from Cloudinary if exists
    if (batch.thumbnail && batch.thumbnail.public_id) {
      await deleteFromCloudinary(batch.thumbnail.public_id, "image");
    }

    await Batch.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Batch deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Batch Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting batch.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ACTIVE BATCHES (Public / Students)
// ==========================================
export const getBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ isActive: true }).sort({ sortOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "Batches fetched successfully.",
      data: batches,
    });
  } catch (error) {
    console.error("Get Batches Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching batches.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL BATCHES (Admin Only)
// ==========================================
export const getAdminBatches = async (req, res) => {
  try {
    const batches = await Batch.find().sort({ sortOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "All batches fetched successfully.",
      data: batches,
    });
  } catch (error) {
    console.error("Get Admin Batches Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching admin batches.",
      error: error.message,
    });
  }
};

// ==========================================
// GET BATCH BY ID (Public / Students)
// ==========================================
export const getBatchById = async (req, res) => {
  try {
    const { id } = req.params;

    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Batch fetched successfully.",
      data: batch,
    });
  } catch (error) {
    console.error("Get Batch By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching batch details.",
      error: error.message,
    });
  }
};
