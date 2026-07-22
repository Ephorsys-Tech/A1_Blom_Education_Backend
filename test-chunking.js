
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createLectureService } from "./src/services/lecture.service.js";
import Chapter from "./src/model/appModel/chapter.model.js";
import dns from "dns";

dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const runTest = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/blomedu");
    console.log("Connected successfully.");

    // Retrieve or create a dummy chapter
    let chapter = await Chapter.findOne();
    if (!chapter) {
      console.log("Creating dummy chapter...");
      chapter = await Chapter.create({
        name: "Test Chapter",
        chapterNumber: 1,
        subject: new mongoose.Types.ObjectId(),
      });
    }

    // Use a real video file (check root directory or videos folder)
    let testVideoPath = path.resolve("test.mp4");
    if (!fs.existsSync(testVideoPath)) {
      testVideoPath = path.resolve("videos", "test.mp4");
    }
    if (!fs.existsSync(testVideoPath)) {
      console.log("Real video not found at " + testVideoPath);
      return;
    }

    const mockFile = {
      path: testVideoPath,
      filename: "test.mp4",
    };

    console.log("Simulating lecture creation service call...");
    try {
      const lecture = await createLectureService(
        {
          title: "Test Lecture video",
          chapter: chapter._id.toString(),
          chunkDuration: 8,
        },
        mockFile
      );
      console.log("Success! Lecture created:", lecture);
    } catch (err) {
      console.error("Service error (Expected if ffmpeg failed on dummy video file):", err.message);
      console.log("Please make sure you have a real video file at test-video.mp4 and ffmpeg installed.");
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

runTest();
