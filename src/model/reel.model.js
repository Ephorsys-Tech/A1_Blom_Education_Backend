import mongoose from "mongoose";

const reelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Reel title is required"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    videoPublicId: {
      type: String,
      required: [true, "Video public ID is required"],
    },
    duration: {
      type: Number,
      required: [true, "Video duration is required"],
    },
  },
  {
    timestamps: true,
  }
);

const ReelModel = mongoose.model("Reel", reelSchema);
export default ReelModel;
