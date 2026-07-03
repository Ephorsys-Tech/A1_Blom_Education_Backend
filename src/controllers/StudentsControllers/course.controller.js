import Course from "../../model/StudentModel/course.model.js";
import Batch from "../../model/StudentModel/batch.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.config.js";

// ==========================================
// CREATE COURSE / SUBJECT (Admin Only)
// ==========================================
export const createCourse = async (req, res) => {
  try {
    const { name, code, description, price, discountPrice, batch: batchId, sortOrder } = req.body;

    if (!name || !code || !batchId || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, code, batch reference, and price are required fields.",
      });
    }

    // Verify batch exists
    const targetBatch = await Batch.findById(batchId);
    if (!targetBatch) {
      return res.status(404).json({
        success: false,
        message: "Referenced batch not found.",
      });
    }

    // Check code uniqueness
    const codeExists = await Course.findOne({ code });
    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: `Course with code '${code}' already exists.`,
      });
    }

    let thumbnail = { public_id: "", url: "" };
    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "courses", "image");
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

    return res.status(201).json({
      success: true,
      message: "Course/Subject created successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Create Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating course.",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE COURSE / SUBJECT (Admin Only)
// ==========================================
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, price, discountPrice, batch: batchId, sortOrder, isActive } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course/Subject not found.",
      });
    }

    // Check code uniqueness if code is changed
    if (code && code !== course.code) {
      const codeExists = await Course.findOne({ code });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: `Course with code '${code}' already exists.`,
        });
      }
      course.code = code;
    }

    // Handle batch change and adjust counts
    if (batchId && batchId.toString() !== course.batch.toString()) {
      const newBatch = await Batch.findById(batchId);
      if (!newBatch) {
        return res.status(404).json({
          success: false,
          message: "New referenced batch not found.",
        });
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

    if (req.file) {
      // Delete old thumbnail if it exists
      if (course.thumbnail && course.thumbnail.public_id) {
        await deleteFromCloudinary(course.thumbnail.public_id, "image");
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, "courses", "image");
      course.thumbnail = {
        public_id: uploadResult.publicId,
        url: uploadResult.url,
      };
    }

    await course.save();

    return res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Update Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating course.",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE COURSE / SUBJECT (Admin Only)
// ==========================================
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course/Subject not found.",
      });
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

    return res.status(200).json({
      success: true,
      message: "Course/Subject deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Course Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting course.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ACTIVE COURSES / SUBJECTS (Public / Students)
// ==========================================
export const getCourses = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.batch) {
      filter.batch = req.query.batch;
    }

    const courses = await Course.find(filter)
      .populate("batch", "name classNumber description")
      .sort({ sortOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully.",
      data: courses,
    });
  } catch (error) {
    console.error("Get Courses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching courses.",
      error: error.message,
    });
  }
};

// ==========================================
// GET ALL COURSES (Admin Only)
// ==========================================
export const getAdminCourses = async (req, res) => {
  try {
    const filter = {};

    if (req.query.batch) {
      filter.batch = req.query.batch;
    }

    const courses = await Course.find(filter)
      .populate("batch", "name classNumber description")
      .sort({ sortOrder: 1 });

    return res.status(200).json({
      success: true,
      message: "All courses fetched successfully.",
      data: courses,
    });
  } catch (error) {
    console.error("Get Admin Courses Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching admin courses.",
      error: error.message,
    });
  }
};

// ==========================================
// GET COURSE BY ID (Public / Students)
// ==========================================
export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate("batch", "name classNumber description");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course/Subject not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course fetched successfully.",
      data: course,
    });
  } catch (error) {
    console.error("Get Course By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching course details.",
      error: error.message,
    });
  }
};
