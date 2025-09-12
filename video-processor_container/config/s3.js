import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const s3 = new AWS.S3({
    region: process.env.AWS_REGION,
});

export default s3;
