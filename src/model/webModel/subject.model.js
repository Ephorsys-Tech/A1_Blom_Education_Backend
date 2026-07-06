import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WebClass",
      required: [true, "Class reference is required"],
    },
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    pdfPublicId: {
      type: String,
      default: null,
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

// Ensure subject name is unique per class
subjectSchema.index({ classId: 1, name: 1 }, { unique: true });

const SubjectModel = mongoose.model("WebSubject", subjectSchema);
export default SubjectModel;
