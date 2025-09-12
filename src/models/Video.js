import mongoose from "mongoose";

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  videoUrl: String,       // S3 HLS manifest (.m3u8)
  thumbnailUrl: String,   // S3 image
  uploadedBy: String,     // Auth0 user id
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Video", videoSchema);