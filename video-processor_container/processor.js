import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import axios from "axios";
import s3 from "./config/s3.js";
import connectDB from "./config/mongo.js";
import { convertToHLS, generateThumbnail } from "./utils/ffmpeg.js";
import dotenv from "dotenv";

dotenv.config();
connectDB();

const sqs = new AWS.SQS({ region: process.env.AWS_REGION });

const QUEUE_URL = process.env.SQS_QUEUE_URL;

const processMessage = async (message) => {
  let rawFilePath, outputDir, hlsDir, thumbnailPath;
  try {
    const body = JSON.parse(message.Body);

    // --- Ignore non-upload messages ---
    if (
      !body.Records ||
      !body.Records[0].s3 ||
      !body.Records[0].s3.object.key ||
      !body.Records[0].eventName.startsWith("ObjectCreated")
    ) {
      console.log("Ignoring non-upload SQS message:", body);
      return;
    }

    // --- Extract info ---
    const s3Key = body.Records[0].s3.object.key;
    const bucket = body.Records[0].s3.bucket.name;
    const title = body.Records[0].s3.object.key.split("/").pop(); // fallback if no title
    const description = "Uploaded via S3"; // fallback
    const uploadedBy = "anonymous"; // fallback

    rawFilePath = path.join("/tmp", path.basename(s3Key));
    const rawFile = fs.createWriteStream(rawFilePath);

    // 1. Download raw video from S3
    await new Promise((resolve, reject) => {
      s3.getObject({ Bucket: bucket, Key: s3Key })
        .createReadStream()
        .pipe(rawFile)
        .on("finish", resolve)
        .on("error", reject);
    });

    // 2. Process into HLS + thumbnail
    outputDir = path.join("/tmp", Date.now().toString());
    hlsDir = await convertToHLS(rawFilePath, outputDir);
    thumbnailPath = await generateThumbnail(rawFilePath, outputDir);

    // 3. Upload processed files to S3
    const hlsFiles = fs.readdirSync(hlsDir);
    const s3Folder = `processed-videos/${Date.now()}`;
    const hlsUploads = await Promise.all(
      hlsFiles
        .filter((filename) => !filename.endsWith(".png")) // Exclude .png files
        .map((filename) => {
          const filePath = path.join(hlsDir, filename);
          return s3
            .upload({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: `${s3Folder}/hls/${filename}`,
              Body: fs.createReadStream(filePath),
              ContentType: filename.endsWith(".m3u8")
                ? "application/vnd.apple.mpegurl"
                : "video/MP2T",
            })
            .promise();
        })
    );

    const videoUrl = hlsUploads.find((f) => f.Key.endsWith(".m3u8")).Location;

    const thumbUpload = await s3
      .upload({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${s3Folder}/thumbnail.png`,
        Body: fs.createReadStream(thumbnailPath),
        ContentType: "image/png",
      })
      .promise();

    // 4. Save metadata to backend
    await axios.post(`${process.env.BACKEND_URL}/api/videos/metadata`, {
      title,
      description,
      videoUrl,
      thumbnailUrl: thumbUpload.Location,
      uploadedBy,
    });

    console.log("Processing complete:", videoUrl);

    // 5. Delete message from SQS
    await sqs
      .deleteMessage({
        QueueUrl: QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle,
      })
      .promise();
  } catch (err) {
    console.error("Processing failed", err);
  } finally {
    // Cleanup tmp files and folders
    try {
      if (rawFilePath && fs.existsSync(rawFilePath)) {
        fs.unlinkSync(rawFilePath);
      }
      if (outputDir && fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
      }
    } catch (cleanupErr) {
      console.error("Cleanup failed", cleanupErr);
    }
  }
};


const pollQueue = async () => {
  const params = {
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  };

  while (true) {
    try {
      const data = await sqs.receiveMessage(params).promise();
      if (data.Messages) {
        for (const message of data.Messages) {
          await processMessage(message);
        }
      }
    } catch (err) {
      console.error("Error polling queue", err);
    }
  }
};

pollQueue();
