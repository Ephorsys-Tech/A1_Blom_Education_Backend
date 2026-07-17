import ClassModel from "../../model/webModel/class.model.js";
import SubjectModel from "../../model/webModel/subject.model.js";
import ChapterModel from "../../model/webModel/chapter.model.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../../config/cloudinary.config.js";
import { z } from "zod";

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

const CreateClassSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  numericValue: z.preprocess((val) => Number(val), z.number().min(6).max(10)),
  isPublished: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
  order: z.preprocess((val) => Number(val), z.number()).optional(),
});

const UpdateClassSchema = CreateClassSchema.partial();

const CreateSubjectSchema = z.object({
  classId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Class ID"),
  name: z.string().min(2, "Subject name must be at least 2 characters"),
  isPublished: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
  order: z.preprocess((val) => Number(val), z.number()).optional(),
});

const UpdateSubjectSchema = CreateSubjectSchema.omit({
  classId: true,
}).partial();

const CreateChapterSchema = z.object({
  subjectId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Subject ID"),
  title: z.string().min(2, "Chapter title must be at least 2 characters"),
  notes: z.string().optional(),
  isPublished: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .optional(),
  order: z.preprocess((val) => Number(val), z.number()).optional(),
});

const UpdateChapterSchema = CreateChapterSchema.omit({
  subjectId: true,
}).partial();

// ==========================================
// CLASS CONTROLLERS
// ==========================================

// Create Class
export const createClass = async (req, res) => {
  try {
    const result = CreateClassSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const { name, numericValue, isPublished, order } = result.data;

    // Check duplicate
    const existingClass = await ClassModel.findOne({ name });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: `Class with name "${name}" already exists`,
      });
    }

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "classes",
        "auto",
      );
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.publicId;
    }

    const newClass = await ClassModel.create({
      name,
      numericValue,
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order || 0,
      imageUrl,
      imagePublicId,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    console.error("Create Class Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating class",
      error: error.message,
    });
  }
};

// Get All Classes (Admin with pagination/search/sort)
export const getAllClasses = async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      sortBy = "order",
      sortOrder = "asc",
    } = req.query;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await ClassModel.countDocuments(query);
    const classes = await ClassModel.find(query)
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: classes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Classes Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching classes",
      error: error.message,
    });
  }
};

// Get Class By ID
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await ClassModel.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Get Class By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching class details",
      error: error.message,
    });
  }
};

// Update Class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const result = UpdateClassSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const classData = await ClassModel.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check duplicate name
    if (result.data.name && result.data.name !== classData.name) {
      const duplicate = await ClassModel.findOne({ name: result.data.name });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Class with name "${result.data.name}" already exists`,
        });
      }
    }

    // Handle Class cover image upload/replacement
    if (req.file) {
      // Delete old image if exists
      if (classData.imagePublicId) {
        try {
          await deleteFromCloudinary(classData.imagePublicId, "image");
        } catch (cloudinaryErr) {
          console.error("Error deleting old class image:", cloudinaryErr);
        }
      }

      // Upload new image
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "classes",
        "auto",
      );
      classData.imageUrl = uploadResult.url;
      classData.imagePublicId = uploadResult.publicId;
    }

    Object.assign(classData, result.data);
    await classData.save();

    return res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: classData,
    });
  } catch (error) {
    console.error("Update Class Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating class",
      error: error.message,
    });
  }
};

// Delete Class (Cascade delete)
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classData = await ClassModel.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Delete class cover image from Cloudinary if exists
    if (classData.imagePublicId) {
      try {
        await deleteFromCloudinary(classData.imagePublicId, "image");
      } catch (cloudinaryErr) {
        console.error(
          "Error deleting class image from Cloudinary:",
          cloudinaryErr,
        );
      }
    }

    // Find all subjects in this class
    const subjects = await SubjectModel.find({ classId: id });
    for (const subject of subjects) {
      // Delete textbook PDF from Cloudinary if exists
      if (subject.pdfPublicId) {
        try {
          await deleteFromCloudinary(subject.pdfPublicId, "image");
        } catch (cloudinaryErr) {
          console.error(
            "Error deleting subject PDF from Cloudinary:",
            cloudinaryErr,
          );
        }
      }
      // Delete chapters of this subject
      await ChapterModel.deleteMany({ subjectId: subject._id });
    }

    // Delete all subjects
    await SubjectModel.deleteMany({ classId: id });

    // Delete the class
    await ClassModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Class and all associated subjects, PDFs, and chapters deleted successfully",
    });
  } catch (error) {
    console.error("Delete Class Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting class",
      error: error.message,
    });
  }
};

// ==========================================
// SUBJECT CONTROLLERS
// ==========================================

// Create Subject
export const createSubject = async (req, res) => {
  try {
    const result = CreateSubjectSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const { classId, name, isPublished, order } = result.data;

    // Check if class exists
    const classExists = await ClassModel.findById(classId);

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check duplicate subject name in this class
    const duplicate = await SubjectModel.findOne({
      classId,
      name,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Subject "${name}" already exists in this class`,
      });
    }

    let pdfUrl = null;
    let pdfPublicId = null;

    // Upload PDF to Cloudinary
    if (req.file) {
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are allowed for textbook",
        });
      }

      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "textbooks",
        "raw", // ✅ PDF ke liye raw
      );

      pdfUrl = uploadResult.url;
      pdfPublicId = uploadResult.publicId;
    }

    const subject = await SubjectModel.create({
      classId,
      name,
      pdfUrl,
      pdfPublicId,
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Create Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating subject",
      error: error.message,
    });
  }
};

// Get All Subjects (Admin with pagination/search/sort/filter)
export const getAllSubjects = async (req, res) => {
  try {
    const {
      classId,
      search = "",
      page = 1,
      limit = 10,
      sortBy = "order",
      sortOrder = "asc",
    } = req.query;

    const query = {};
    if (classId) {
      query.classId = classId;
    }
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const total = await SubjectModel.countDocuments(query);
    const subjects = await SubjectModel.find(query)
      .populate("classId", "name numericValue")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: subjects,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Subjects Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching subjects",
      error: error.message,
    });
  }
};

// Get Subject By ID
export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await SubjectModel.findById(id).populate(
      "classId",
      "name numericValue",
    );
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: subject,
    });
  } catch (error) {
    console.error("Get Subject By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching subject details",
      error: error.message,
    });
  }
};

// Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const result = UpdateSubjectSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const subject = await SubjectModel.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check duplicate name in same class
    if (result.data.name && result.data.name !== subject.name) {
      const duplicate = await SubjectModel.findOne({
        classId: subject.classId,
        name: result.data.name,
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Subject "${result.data.name}" already exists in this class`,
        });
      }
    }

    // PDF upload / replacement
    if (req.file) {
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are allowed for textbook",
        });
      }

      // Delete old PDF if exists
      if (subject.pdfPublicId) {
        try {
          await deleteFromCloudinary(subject.pdfPublicId, "image");
        } catch (cloudinaryErr) {
          console.error("Error deleting old PDF:", cloudinaryErr);
        }
      }

      // Upload new PDF
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        "textbooks",
        "image",
      );
      subject.pdfUrl = uploadResult.url;
      subject.pdfPublicId = uploadResult.publicId;
    }

    Object.assign(subject, result.data);
    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Update Subject Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating subject",
      error: error.message,
    });
  }
};

// Delete Subject PDF only
export const deleteSubjectPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await SubjectModel.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    if (subject.pdfPublicId) {
      await deleteFromCloudinary(subject.pdfPublicId, "image");
    }

    subject.pdfUrl = null;
    subject.pdfPublicId = null;
    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Textbook PDF deleted successfully",
      data: subject,
    });
  } catch (error) {
    console.error("Delete Subject PDF Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting textbook PDF",
      error: error.message,
    });
  }
};

// Delete Subject (Cascade chapters)
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await SubjectModel.findById(id);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Delete PDF from Cloudinary
    if (subject.pdfPublicId) {
      try {
        await deleteFromCloudinary(subject.pdfPublicId, "image");
      } catch (cloudinaryErr) {
        console.error("Error deleting PDF from Cloudinary:", cloudinaryErr);
      }
    }

    // Delete associated chapters
    await ChapterModel.deleteMany({ subjectId: id });

    // Delete the subject
    await SubjectModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Subject and all associated chapters and textbook PDF deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subject Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting subject",
      error: error.message,
    });
  }
};

// ==========================================
// CHAPTER & NOTES CONTROLLERS
// ==========================================

// Create Chapter
export const createChapter = async (req, res) => {
  try {
    const result = CreateChapterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const { subjectId, title, notes, isPublished, order } = result.data;

    // Check if subject exists
    const subjectExists = await SubjectModel.findById(subjectId);
    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Check duplicate title in same subject
    const duplicate = await ChapterModel.findOne({ subjectId, title });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Chapter "${title}" already exists in this subject`,
      });
    }

    const chapter = await ChapterModel.create({
      subjectId,
      title,
      notes: notes || "",
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Create Chapter Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating chapter",
      error: error.message,
    });
  }
};

// Get All Chapters (Admin with pagination/search/sort/filter)
export const getAllChapters = async (req, res) => {
  try {
    const {
      subjectId,
      search = "",
      page = 1,
      limit = 10,
      sortBy = "order",
      sortOrder = "asc",
    } = req.query;

    const query = {};
    if (subjectId) {
      query.subjectId = subjectId;
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const total = await ChapterModel.countDocuments(query);
    const chapters = await ChapterModel.find(query)
      .populate({
        path: "subjectId",
        select: "name classId",
        populate: {
          path: "classId",
          select: "name",
        },
      })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: chapters,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Chapters Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching chapters",
      error: error.message,
    });
  }
};

// Get Chapter By ID
export const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await ChapterModel.findById(id).populate({
      path: "subjectId",
      select: "name classId",
      populate: {
        path: "classId",
        select: "name",
      },
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    console.error("Get Chapter By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching chapter details",
      error: error.message,
    });
  }
};

// Update Chapter (also handles updating notes)
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const result = UpdateChapterSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const chapter = await ChapterModel.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    // Check duplicate title in same subject
    if (result.data.title && result.data.title !== chapter.title) {
      const duplicate = await ChapterModel.findOne({
        subjectId: chapter.subjectId,
        title: result.data.title,
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `Chapter "${result.data.title}" already exists in this subject`,
        });
      }
    }

    Object.assign(chapter, result.data);
    await chapter.save();

    return res.status(200).json({
      success: true,
      message: "Chapter updated successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Update Chapter Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating chapter",
      error: error.message,
    });
  }
};

// Delete Chapter
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await ChapterModel.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found",
      });
    }

    await ChapterModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error("Delete Chapter Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting chapter",
      error: error.message,
    });
  }
};

// ==========================================
// PUBLIC / STUDENT CONTROLLERS
// ==========================================

// Get Public Classes (only published, sorted by order)
export const getPublicClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find({ isPublished: true }).sort({
      order: 1,
      numericValue: 1,
    });
    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error("Get Public Classes Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching classes",
      error: error.message,
    });
  }
};

// Get Public Subjects by Class ID (only published, sorted by order)
export const getPublicSubjects = async (req, res) => {
  try {
    const { classId } = req.query;
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    const subjects = await SubjectModel.find({
      classId,
      isPublished: true,
    }).sort({ order: 1, name: 1 });
    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error("Get Public Subjects Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching subjects",
      error: error.message,
    });
  }
};

// Get Public Chapters by Subject ID (only published, sorted by order, without heavy notes field to keep list light)
export const getPublicChapters = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: "Subject ID is required",
      });
    }

    const chapters = await ChapterModel.find({ subjectId, isPublished: true })
      .select("-notes")
      .sort({ order: 1, title: 1 });

    return res.status(200).json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    console.error("Get Public Chapters Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching chapters",
      error: error.message,
    });
  }
};

// Get Public Chapter Details (including notes) by Chapter ID
export const getPublicChapterDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await ChapterModel.findOne({
      _id: id,
      isPublished: true,
    }).populate({
      path: "subjectId",
      select: "name pdfUrl classId",
      populate: {
        path: "classId",
        select: "name",
      },
    });

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: "Chapter not found or is unpublished",
      });
    }

    return res.status(200).json({
      success: true,
      data: chapter,
    });
  } catch (error) {
    console.error("Get Public Chapter Detail Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching chapter details",
      error: error.message,
    });
  }
};
