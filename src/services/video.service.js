// src/services/video.service.js
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { splitVideoIntoChunks } from '../utils/ffmpegHelper.js';

/**
 * Process an uploaded video file: generate UUID filename (already set by multer),
 * split into chunks, and return info.
 * @param {string} filePath - absolute path to the uploaded video file
 * @param {number} [chunkDuration=10] - duration of each chunk in seconds
 * @returns {Promise<{uuid: string, outputDir: string}>}
 */
export const processUploadedVideo = async (filePath, chunkDuration = 8) => {
  if (!fs.existsSync(filePath)) {
    throw new Error('Uploaded video file not found');
  }
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const uuid = baseName; // assume multer stored file as <uuid><ext>
  const outputDir = path.join(path.dirname(filePath), `${uuid}_chunks`);
  const { outputDir: generatedDir, duration } = await splitVideoIntoChunks(filePath, outputDir, chunkDuration);
  return { uuid, outputDir: generatedDir, duration };
};
