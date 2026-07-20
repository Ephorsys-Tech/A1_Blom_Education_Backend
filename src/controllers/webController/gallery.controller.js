import GalleryModel from "../../model/webModel/gallery.model.js";
import { uploadBufferToS3, deleteFileFromS3 } from "../../utils/s3Helper.js";
import path from "path";

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

    // Upload image to S3
    const ext = path.extname(req.file.originalname || "") || ".jpg";
    const s3Key = `gallery/image-${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const uploadResult = await uploadBufferToS3(req.file.buffer, s3Key, req.file.mimetype || "image/jpeg");

    const galleryItem = await GalleryModel.create({
      imageUrl: uploadResult.url,
      imagePublicId: uploadResult.key,
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

    // Delete image from S3
    if (galleryItem.imagePublicId || galleryItem.imageUrl) {
      await deleteFileFromS3(galleryItem.imagePublicId || galleryItem.imageUrl);
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
