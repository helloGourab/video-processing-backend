import express from "express";
import multer from "multer";
import { uploadRawVideo, saveMetadata, getVideos, getVideoById } from "../controllers/videoController.js";

const router = express.Router();

// Use multer memory storage (buffer in memory, not disk)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("video"), uploadRawVideo); // Upload directly to S3
router.post("/metadata", saveMetadata); // Save processed video metadata
router.get("/", getVideos); // Fetch all videos
router.get("/:id", getVideoById); // Fetch video by ID

export default router;
