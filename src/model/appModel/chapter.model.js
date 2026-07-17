import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Chapter name is required"],
      trim: true,
    },

    chapterNumber: {
      type: Number,
      required: [true, "Chapter number is required"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject reference is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique chapter number per Subject
chapterSchema.index({ subject: 1, chapterNumber: 1 }, { unique: true });

export default mongoose.model("Chapter", chapterSchema);
