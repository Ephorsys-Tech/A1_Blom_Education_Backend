import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

/**
 * Uploads a file buffer directly to Cloudinary
 * @param {Buffer} fileBuffer 
 * @param {string} folder 
 * @param {string} resourceType - "image", "video", "raw", or "auto"
 * @returns {Promise<{url: string, publicId: string, duration: number|undefined}>}
 */
export const uploadToCloudinary = (fileBuffer, folder = "savera", resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration, // Cloudinary returns video duration in seconds
        });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Deletes a resource from Cloudinary
 * @param {string} publicId 
 * @param {string} resourceType - "image", "video", "raw"
 * @returns {Promise<any>}
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
    throw error;
  }
};

export default cloudinary;
