// src/utils/s3Helper.js
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import fs from 'fs';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
});

/**
 * Get Content-Type based on extension
 */
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.m3u8') return 'application/vnd.apple.mpegurl';
  if (ext === '.ts') return 'video/MP2T';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.pdf') return 'application/pdf';
  return 'application/octet-stream';
};

/**
 * Upload a single file to S3
 */
export const uploadFileToS3 = async (filePath, s3Key) => {
  const fileStream = fs.createReadStream(filePath);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: fileStream,
      ContentType: getContentType(filePath),
    },
  });

  const data = await upload.done();
  return data.Location; // This is the S3 URL
};

/**
 * Upload a memory Buffer to S3
 */
export const uploadBufferToS3 = async (buffer, s3Key, contentType = 'application/octet-stream') => {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  const data = await upload.done();
  return {
    url: data.Location,
    key: s3Key,
  };
};

/**
 * Delete a file from S3 by Key or S3 URL
 */
export const deleteFileFromS3 = async (s3KeyOrUrl) => {
  if (!s3KeyOrUrl) return;
  try {
    let key = s3KeyOrUrl;
    if (s3KeyOrUrl.startsWith('http://') || s3KeyOrUrl.startsWith('https://')) {
      const url = new URL(s3KeyOrUrl);
      key = decodeURIComponent(url.pathname.substring(1));
    }
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error(`Failed to delete object from S3 (${s3KeyOrUrl}):`, error.message);
  }
};

/**
 * Recursively upload a directory to S3
 * @param {string} dirPath - Local path to the directory
 * @param {string} s3Prefix - S3 prefix (folder path) where files should go
 * @returns {Promise<string[]>} - Array of uploaded S3 URLs
 */
export const uploadDirectoryToS3 = async (dirPath, s3Prefix = '') => {
  const results = [];
  
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory ${dirPath} does not exist`);
  }

  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    // Construct the S3 Key. Normalize slashes for S3.
    // Replace backslashes with forward slashes for S3 object keys
    let s3Key = `${s3Prefix}/${file}`.replace(/^\//, ''); // Remove leading slash if any
    
    if (stat.isDirectory()) {
      // Recursively upload subdirectories
      const subResults = await uploadDirectoryToS3(fullPath, s3Key);
      results.push(...subResults);
    } else {
      // Upload file
      const location = await uploadFileToS3(fullPath, s3Key);
      results.push(location);
    }
  }

  return results;
};
 