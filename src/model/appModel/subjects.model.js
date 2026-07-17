import mongoose from "mongoose";
import { required } from "zod/mini";

const subjectsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    
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
      required: [true, "Class price is required"],
      min: [0, "Price cannot be negative"],
    },

    discountPrice: {
      type: Number,
      min: 0,
    },
    
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    classes: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classes",
      required: [true, "Class reference is required"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Subject", subjectsSchema);
