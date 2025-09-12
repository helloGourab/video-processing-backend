import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

export const convertToHLS = (inputPath, outputDir) => {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(outputDir, { recursive: true });

        ffmpeg(inputPath)
            .outputOptions([
                "-profile:v baseline",
                "-level 3.0",
                "-start_number 0",
                "-hls_time 10",
                "-hls_list_size 0",
                "-f hls",
            ])
            .output(path.join(outputDir, "index.m3u8"))
            .on("end", () => resolve(outputDir))
            .on("error", reject)
            .run();
    });
};

export const generateThumbnail = (inputPath, outputDir) => {
    return new Promise((resolve, reject) => {
        const thumbnailPath = path.join(outputDir, "thumbnail.png");

        ffmpeg(inputPath)
            .screenshots({
                timestamps: ["50%"],
                filename: "thumbnail.png",
                folder: outputDir,
                size: "320x240",
            })
            .on("end", () => resolve(thumbnailPath))
            .on("error", reject);
    });
};
