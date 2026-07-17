import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer
 * @param {string} folder
 * @param {string} mimeType
 * @returns {Promise}
 */
export const uploadToCloudinary = (
  fileBuffer,
  folder = "A1",
  mimeType = "",
) => {
  return new Promise((resolve, reject) => {
    let resourceType = "auto";

    // PDF ke liye raw use karo
    if (mimeType === "application/pdf") {
      resourceType = "raw";
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration,
          resourceType: result.resource_type,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 */
export const deleteFromCloudinary = async (
  publicId,
  resourceType = "image",
) => {
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
};

export default cloudinary;
