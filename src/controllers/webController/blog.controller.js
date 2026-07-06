import BlogModel from "../../model/webModel/blog.model.js";
import {
   uploadToCloudinary,
   deleteFromCloudinary,
 } from "../../config/cloudinary.config.js";
import { z } from "zod";

const CreateBlogData = z.object({
  title: z
    .string()
    .min(2, "Title is required"),
  description: z.string().min(10, "Description is required"),
});

// Create Blog
export const createBlog = async (req, res) => {
  try {
    const result = CreateBlogData.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.format(),
      });
    }

    const { title, description } = result.data;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Blog image file is required",
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      "blogs",
      "image",
    );

    const blog = await BlogModel.create({
      title,
      description,
      imageUrl: uploadResult.url,
      imagePublicId: uploadResult.publicId,
    });

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    console.error("Create Blog Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while creating blog",
      error: error.message,
    });
  }
};

// Delete Blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await BlogModel.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Delete image from Cloudinary
    if (blog.imagePublicId) {
      await deleteFromCloudinary(blog.imagePublicId, "image");
    }

    // Delete from Database
    await BlogModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Delete Blog Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting blog",
      error: error.message,
    });
  }
};

// Get All Blogs
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await BlogModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error("Get All Blogs Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching blogs",
      error: error.message,
    });
  }
};

// Get Blog By ID
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await BlogModel.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Get Blog By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching blog details",
      error: error.message,
    });
  }
};
