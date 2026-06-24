import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

export const uploadVideoOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    
    // Upload the video on cloudinary in chunks for large files
    const response = await cloudinary.uploader.upload_large(localFilePath, {
      resource_type: "video",
      folder: "videos",
      chunk_size: 6000000 // 6MB chunks, Cloudinary handles up to 100MB by default, but upload_large chunks it.
    });
    
    // File has been uploaded successfully, remove from local storage
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error) {
    // Remove the locally saved temporary file as the upload operation failed
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
    console.error("Cloudinary video upload error:", error);
    return null;
  }
};

export const deleteVideoFromCloudinary = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video"
    });
    return response;
  } catch (error) {
    console.error("Cloudinary video delete error:", error);
    return null;
  }
};
