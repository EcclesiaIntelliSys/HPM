const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    songcode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    feedback: {
      type: String,
      required: true,
      maxlength: 3000,
    },

    mediaUrl: {
      type: String,
      default: "",
    },

    mediaType: {
      type: String,
      enum: ["image", "audio", "video", ""],
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "published", "unpublished"],
      default: "pending",
    },

    profilePhotoUrl: {
      type: String,
      default: "",
    },

    profilePhotoType: {
      type: String,
      default: "image",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
