# video upload processing pipeline 

- Backend server role (minimal)

- Accept metadata (title, description).

- Accept file upload and immediately forward to S3 (don’t even keep it on disk).and expose mongodb endpoints for fetching videos and also storing metadata o uploaded videos once processed

- Respond quickly: “Upload received, processing.”

- S3 event trigger

- When a new video lands in S3 (say in raw-videos/), S3 can fire an event notification using sqs that triggers a Fargate job

- It pulls the raw video from S3 → processes with ffmpeg → pushes results into processed-videos/{id}/hls/… and thumbnails/{id}.png and updates MongoDB using server mongodb endpoints

- for clean up auto-expire raw-videos/ with S3 lifecycle policies (delete after 1 day coz we aint youtube).

## env.example

```bash
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET_NAME=doc-agent-files
SQS_QUEUE_URL=https://sqs.ap-south-1.amazonaws.com/1234567890/video-processing
MONGO_URI=mongodb+srv://...
BACKEND_URL=http://your-backend-service
```

```bash
 curl -X POST http://localhost:5000/api/videos/upload   -H "Content-Type: multipart/form-data"   -F "title=Test Video"   -F "description=My first upload"   -F "video=@./sample3.mp4"
```
