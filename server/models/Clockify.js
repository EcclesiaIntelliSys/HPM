const mongoose = require("mongoose");

const clockifySchema = new mongoose.Schema(
  {
    resource: String,
    service: String,
    songcode: String,
    start: Date,
    end: Date,
    hours_rendered: Number,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Clockify", clockifySchema);
