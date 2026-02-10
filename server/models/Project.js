const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, default: "SYSTEM" },
  message: { type: String, default: "Order Received. Queued for Lyricist." },
});

function generateDateCode() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${day}${month}${hours}${minutes}${seconds}`;
}

const ProjectSchema = new mongoose.Schema(
  {
    relation: { type: String, required: true },
    recipient: { type: String, required: true },
    agegroup: { type: String, required: true },
    qualities: { type: String, required: true },
    moment: { type: String, required: true },
    specialmsg: { type: String, required: true },
    genre: { type: String, required: true },
    voice: { type: String, required: true },
    email: { type: String, required: true },
    ack: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, default: "Queued for Lyricist" },
    logs: {
      type: [LogSchema],
      default: () => [
        {
          timestamp: Date.now(),
          actor: "SYSTEM",
          message: "Order Received. Queued for Lyricist.",
        },
      ],
    },
    songcode: { type: String },
    lyricist: { type: String },
    lyricist_start: { type: Date },
    lyricist_end: { type: Date },
    songartist: { type: String },
    songartist_start: { type: Date },
    songartist_end: { type: Date },
    assessor: { type: String },
    assessor_start: { type: Date },
    assessor_end: { type: Date },
    voucherNo: { type: String },
  },
  { collection: "projects" },
);

ProjectSchema.pre("save", function (next) {
  if (this.isNew && !this.songcode) {
    this.songcode = generateDateCode();
  }
  next();
});

module.exports = mongoose.model("Project", ProjectSchema);
