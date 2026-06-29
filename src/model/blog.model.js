import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Blog description is required"],
    },
    imageUrl: {
      type: String,
      required: [true, "Blog image is required"],
    },
    imagePublicId: {
      type: String,
      required: [true, "Blog image public ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

const BlogModel = mongoose.model("Blog", blogSchema);
export default BlogModel;
