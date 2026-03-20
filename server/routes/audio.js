// routes/audio.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const { R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY } = process.env;
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const upload = multer({ dest: "tmp/" });

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

router.post("/:projectId", upload.single("audio"), async (req, res) => {
  try {
    const { file } = req;
    const { projectId } = req.params;
    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const baseName = path.parse(file.originalname).name;
    const mp3FileName = `${baseName}.mp3`;
    const waveformFileName = `${baseName}_waveform.png`;

    const mp3Path = path.join("tmp", mp3FileName);
    const waveformPath = path.join("tmp", waveformFileName);

    // 1️⃣ Convert & normalize audio to MP3
    await new Promise((resolve, reject) => {
      ffmpeg(file.path)
        .audioCodec("libmp3lame")
        .audioFilters("loudnorm") // auto-normalize volume
        .format("mp3")
        .save(mp3Path)
        .on("end", resolve)
        .on("error", reject);
    });

    // 2️⃣ Generate waveform preview
    await new Promise((resolve, reject) => {
      ffmpeg(mp3Path)
        .complexFilter([
          {
            filter: "aformat",
            options: "channel_layouts=mono",
          },
          {
            filter: "showwavespic",
            options: "s=600x120",
          },
        ])
        .frames(1)
        .save(waveformPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // 3️⃣ Upload MP3 to R2
    const mp3File = fs.readFileSync(mp3Path);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: mp3FileName,
        Body: mp3File,
        ContentType: "audio/mpeg",
      }),
    );

    // 4️⃣ Upload waveform PNG to R2
    const waveformFile = fs.readFileSync(waveformPath);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: waveformFileName,
        Body: waveformFile,
        ContentType: "image/png",
      }),
    );

    // Cleanup temp files
    fs.unlinkSync(file.path);
    fs.unlinkSync(mp3Path);
    fs.unlinkSync(waveformPath);

    const mp3URL = `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${mp3FileName}`;
    const waveformURL = `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${waveformFileName}`;

    res.json({
      filename: mp3FileName,
      mp3URL,
      waveformURL,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Audio processing failed" });
  }
});

module.exports = router;
