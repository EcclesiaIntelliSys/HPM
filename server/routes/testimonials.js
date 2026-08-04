const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const Project = require("../models/Project");
const Testimonial = require("../models/Testimonial");

const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const { R2_BUCKET, R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY } = process.env;
const s3Client = require("../utils/r2");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "video/mp4",
      "video/quicktime",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    cb(null, true);
  },
});

const emitPendingTestimonial = async (req) => {
  try {
    const io = req.app.get("io");
    const count = await Testimonial.countDocuments({
      status: "pending",
    });
    io.emit("pendingTestimonialUpdated", { count });
  } catch (err) {
    console.error("emitPendingTestimonial error:", err.message);
  }
};

router.post(
  "/",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "media", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const project = await Project.findOne({
        songcode: req.body.songcode.trim().toUpperCase(),
      });

      if (!project) {
        return res.status(400).json({
          error: "Invalid Song Code.",
        });
      }

      const profilePhoto = req.files?.profilePhoto?.[0];
      const media = req.files?.media?.[0];

      let profilePhotoUrl = "";
      let mediaUrl = "";
      let mediaType = "";

      if (media) {
        let folder = "other";

        if (media.mimetype.startsWith("image/")) {
          folder = "images";
          mediaType = "image";
        } else if (media.mimetype.startsWith("audio/")) {
          folder = "audio";
          mediaType = "audio";
        } else if (media.mimetype.startsWith("video/")) {
          folder = "videos";
          mediaType = "video";
        }

        const unique = crypto.randomBytes(8).toString("hex");

        const ext = path.extname(media.originalname);

        const r2FileName = `testimonials/${folder}/${Date.now()}-${unique}${ext}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: r2FileName,
            Body: media.buffer,
            ContentType: media.mimetype,
          }),
        );

        mediaUrl = r2FileName;
      }

      if (profilePhoto) {
        const unique = crypto.randomBytes(8).toString("hex");

        const ext = path.extname(profilePhoto.originalname);

        profilePhotoUrl = `testimonials/profile-photos/${Date.now()}-${unique}${ext}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: profilePhotoUrl,
            Body: profilePhoto.buffer,
            ContentType: profilePhoto.mimetype,
          }),
        );
      }

      const testimonial = await Testimonial.create({
        rating: Number(req.body.rating),
        name: req.body.name.trim(),
        email: req.body.email.trim(),
        songcode: req.body.songcode.trim(),
        feedback: req.body.feedback.trim(),

        profilePhotoUrl,

        mediaUrl,
        mediaType,
      });

      res.status(201).json({
        success: true,
        testimonial,
      });

      await emitPendingTestimonial(req);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message || "Failed to submit testimonial.",
      });
    }
  },
);

router.get("/manage", async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({
      createdAt: -1,
    });

    res.json(testimonials);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch testimonials.",
    });
  }
});

router.put(
  "/:id",
  upload.fields([
    { name: "profilePhoto", maxCount: 1 },
    { name: "media", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const testimonial = await Testimonial.findById(req.params.id);

      if (!testimonial) {
        return res.status(404).json({
          error: "Testimonial not found.",
        });
      }

      const media = req.files?.media?.[0];
      const profilePhoto = req.files?.profilePhoto?.[0];

      const oldMediaUrl = testimonial.mediaUrl;
      const oldProfilePhotoUrl = testimonial.profilePhotoUrl;

      let mediaUrl = testimonial.mediaUrl;
      let mediaType = testimonial.mediaType;

      let profilePhotoUrl = testimonial.profilePhotoUrl;

      // Upload replacement if one was provided
      if (media) {
        let folder = "other";

        if (media.mimetype.startsWith("image/")) {
          folder = "images";
          mediaType = "image";
        } else if (media.mimetype.startsWith("audio/")) {
          folder = "audio";
          mediaType = "audio";
        } else if (media.mimetype.startsWith("video/")) {
          folder = "videos";
          mediaType = "video";
        }

        const unique = crypto.randomBytes(8).toString("hex");
        const ext = path.extname(media.originalname);

        mediaUrl = `testimonials/${folder}/${Date.now()}-${unique}${ext}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: mediaUrl,
            Body: media.buffer,
            ContentType: media.mimetype,
          }),
        );
      }
      if (media) {
        // upload replacement
      } else if (req.body.deleteMedia === "true") {
        mediaUrl = "";
        mediaType = "";
      }
      if (profilePhoto) {
        const unique = crypto.randomBytes(8).toString("hex");
        const ext = path.extname(profilePhoto.originalname);

        profilePhotoUrl = `testimonials/profile-photos/${Date.now()}-${unique}${ext}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: profilePhotoUrl,
            Body: profilePhoto.buffer,
            ContentType: profilePhoto.mimetype,
          }),
        );
      } else if (req.body.deleteProfilePhoto === "true") {
        profilePhotoUrl = "";
      }
      // Update testimonial
      testimonial.rating = Number(req.body.rating);
      testimonial.status = req.body.status;
      testimonial.feedback = req.body.feedback;

      testimonial.mediaUrl = mediaUrl;
      testimonial.mediaType = mediaType;
      testimonial.profilePhotoUrl = profilePhotoUrl;

      // Save to MongoDB
      await testimonial.save();

      // Delete old attachment AFTER successful save

      // Delete old attachment if replaced or removed
      if (oldMediaUrl && oldMediaUrl !== mediaUrl) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET,
              Key: oldMediaUrl,
            }),
          );
        } catch (err) {
          console.error("Failed deleting old attachment:", err);
        }
      }

      // Delete old profile photo if replaced or removed
      if (oldProfilePhotoUrl && oldProfilePhotoUrl !== profilePhotoUrl) {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET,
              Key: oldProfilePhotoUrl,
            }),
          );
        } catch (err) {
          console.error("Failed deleting old profile photo:", err);
        }
      }
      await emitPendingTestimonial(req);
      res.json(testimonial);
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: err.message || "Failed to update testimonial.",
      });
    }
  },
);

router.get("/published", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      status: "published",
    }).sort({
      createdAt: -1,
    });

    res.json(testimonials);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to fetch published testimonials.",
    });
  }
});

module.exports = router;
