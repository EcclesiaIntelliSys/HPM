const mongoose = require("mongoose");

const clockifySchema = new mongoose.Schema(
  {
    resource: String,
    service: String,
    songcode: String,
    attempt: {
      type: Number,
      default: 1,
    },
    start: Date,
    end: Date,
    hours_rendered: Number,
    hours_rendered_override: Number,
    reviewer: String,
    reviewdate: Date,
    adminaction: String,
    txnref: String,
    payflag: { type: Boolean, default: false },
  },
  { timestamps: true },
);

clockifySchema.index(
  { resource: 1, service: 1, songcode: 1, attempt: 1 },
  { unique: true },
);

module.exports = mongoose.model("Clockify", clockifySchema);
