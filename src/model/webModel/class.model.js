import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      unique: true,
      trim: true,
    },
    numericValue: {
      type: Number,
      required: [true, "Numeric value of the class is required"],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ClassModel = mongoose.model("WebClass", classSchema);
export default ClassModel;
