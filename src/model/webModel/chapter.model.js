import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WebSubject",
      required: [true, "Subject reference is required"],
    },
    title: {
      type: String,
      required: [true, "Chapter title is required"],
      trim: true,
    },
    notes: {
      type: String,
      default: "",
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

chapterSchema.index({ subjectId: 1, title: 1 }, { unique: true });

const ChapterModel = mongoose.model("WebChapter", chapterSchema);
export default ChapterModel;
