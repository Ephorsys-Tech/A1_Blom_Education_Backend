import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    name: {
      type: String,
      required: [true, "Batch name is required"],
      unique: true,
      trim: true,
      enum: [
        "Class 6",
        "Class 7",
        "Class 8",
        "Class 9",
        "Class 10",
      ],
    },

    classNumber: {
      type: Number,
      required: [true, "Class number is required"],
      unique: true,
      min: 6,
      max: 10,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    thumbnail: {
      public_id: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },

    // ==========================================
    // SETTINGS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "Batch price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: [0, "Discount price cannot be negative"],
    },

    // ==========================================
    // METADATA
    // ==========================================

    totalSubjects: {
      type: Number,
      default: 0,
    },

    totalStudents: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Batch", batchSchema);