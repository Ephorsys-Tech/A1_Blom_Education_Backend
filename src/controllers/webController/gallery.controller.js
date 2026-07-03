import GalleryModel from "../../model/webModel/gallery.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../config/cloudinary.config.js";

// Upload Gallery Image
export const uploadImage = async (req, res) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file.buffer, "gallery", "image");

    const galleryItem = await GalleryModel.create({
      imageUrl: uploadResult.url,
      imagePublicId: uploadResult.publicId,
      title: title || "",
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded to gallery successfully",
      data: galleryItem,
    });
  } catch (error) {
    console.error("Upload Gallery Image Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while uploading gallery image",
      error: error.message,
    });
  }
};

// Delete Gallery Image
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const galleryItem = await GalleryModel.findById(id);
    if (!galleryItem) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    // Delete image from Cloudinary
    if (galleryItem.imagePublicId) {
      await deleteFromCloudinary(galleryItem.imagePublicId, "image");
    }

    // Delete from Database
    await GalleryModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.error("Delete Gallery Image Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting gallery image",
      error: error.message,
    });
  }
};

// Get Gallery Images
export const getGallery = async (req, res) => {
  try {
    const galleryItems = await GalleryModel.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: galleryItems,
    });
  } catch (error) {
    console.error("Get Gallery Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching gallery images",
      error: error.message,
    });
  }
};
