import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    imagePublicId: {
      type: String,
      required: [true, "Image public ID is required"],
    },
    title: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const GalleryModel = mongoose.model("Gallery", gallerySchema);
export default GalleryModel;
