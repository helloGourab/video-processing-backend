import s3 from "../config/s3.js";
import Video from "../models/Video.js";

/**
 * Upload raw video to S3 (raw-videos/)
 */
export const uploadRawVideo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const key = `raw-videos/${Date.now()}-${req.file.originalname}`;
        await s3
            .upload({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: key,
                Body: req.file.buffer,
                ContentType: req.file.mimetype,
            })
            .promise();

        res.status(202).json({
            message: "Upload received, processing will start shortly.",
            s3Key: key,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
};

/**
 * Save metadata after processing
 */
export const saveMetadata = async (req, res) => {
    try {
        const { title, description, videoUrl, thumbnailUrl, uploadedBy } = req.body;

        if (!title || !videoUrl || !thumbnailUrl) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const video = await Video.create({
            title,
            description,
            videoUrl,
            thumbnailUrl,
            uploadedBy: uploadedBy || "anonymous",
        });

        res.status(201).json(video);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to save metadata" });
    }
};

/**
 * Get all videos
 */
export const getVideos = async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch videos" });
    }
};

/**
 * Get video by ID
 */
export const getVideoById = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: "Video not found" });
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch video" });
    }
};
