const mongoose = require("mongoose");

const clockifySchema = new mongoose.Schema(
  {
    resource: String,
    service: String,
    songcode: String,
    start: Date,
    end: Date,
    hours_rendered: Number,
    txnref: String,
    payflag: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Clockify", clockifySchema);
