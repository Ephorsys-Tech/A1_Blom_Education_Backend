// src/routes/web-route/video.routes.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { processUploadedVideo } from '../../services/video.service.js';

const router = express.Router();

// Directory to store original uploaded videos
const videoStoragePath = path.resolve('videos'); // project root/videos

// Ensure directory exists (will be created by multer storage callback if missing)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videoStoragePath);
  },
  filename: (req, file, cb) => {
    // Generate UUID and preserve original extension
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

/**
 * POST /videos/upload
 * Accepts a single video file (field name "video").
 * Optional query param `chunkDuration` in seconds (default 10).
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }
    const chunkDuration = Number(req.query.chunkDuration) || 10;
    const result = await processUploadedVideo(req.file.path, chunkDuration);
    res.json({ success: true, uuid: result.uuid, chunks: result.chunks });
  } catch (err) {
    console.error('Video upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
