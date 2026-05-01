const crypto = require("crypto");
const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
  date: { type: String }, // store YYYYMMDD
});

const Counter = mongoose.model("Counter", CounterSchema);

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, default: "SYSTEM" },
  message: { type: String, default: "Order Received. Queued for Lyricist." },
});

function generateDateCode() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = String(now.getFullYear()).slice(-2); // last two digits
  return `${day}${month}${year}`;
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
    targetdate: { type: Date },
    deliverydate: { type: Date },
    status: { type: String, default: "Awaiting Payment" },
    logs: {
      type: [LogSchema],
      default: () => [
        {
          timestamp: Date.now(),
          actor: "SYSTEM",
          message: "Order Details Received. Awaiting Payment.",
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
    admin: { type: String },
    admin_action: { type: String },
    admin_action_date: { type: Date },
    voucherNo: { type: String },
    songtitle: { type: String },
    lyrics: { type: String },
    songtitlerev: { type: String },
    lyricsrev: { type: String },
    dispo: { type: String },
    dispo_remarks: { type: String },
    admin_remarks: { type: String },
    lock: {
      user: String,
      timestamp: Date,
    },
    filename: { type: String },
    publicId: {
      type: String,
      unique: true,
      index: true,
    },
    paymentIntentId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    amount: { type: Number }, // store in cents
    promoDisc: { type: Number }, // store in cents
    voucherDiscount: { type: Number }, // store in cents
    basePrice: { type: Number }, // store in cents
    currency: { type: String, default: "usd" },
  },

  { collection: "projects" },
);

// Add index here
ProjectSchema.index({
  status: 1,
  "lock.timestamp": 1,
});

// Pre-save hook to generate songcode with padded sequence
ProjectSchema.pre("save", async function (next) {
  try {
    if (this.isNew && !this.publicId) {
      this.publicId = crypto.randomBytes(16).toString("hex");
    }

    if (this.isNew && !this.songcode) {
      const now = new Date();
      const today = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
        2,
        "0",
      )}${String(now.getDate()).padStart(2, "0")}`;

      let counter = await Counter.findOne({ name: "project_seq" });

      if (!counter || counter.date !== today) {
        counter = await Counter.findOneAndUpdate(
          { name: "project_seq" },
          { seq: 49, date: today },
          { new: true, upsert: true },
        );
      } else {
        counter = await Counter.findOneAndUpdate(
          { name: "project_seq" },
          { $inc: { seq: 2 } },
          { new: true },
        );
      }

      const paddedSeq = String(counter.seq).padStart(4, "0");
      this.songcode = `${generateDateCode()}-${paddedSeq}`;
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Project", ProjectSchema);
