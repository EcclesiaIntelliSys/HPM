const mongoose = require("mongoose");

const opsconfigSchema = new mongoose.Schema(
  {
    accessTokenAge: String,
    refreshTokenAge: String,
    projectMinLimit: Number,
    heartBeatMin: Number,
    lyricistClaimMin: Number,
    songartistClaimMin: Number,
    qaClaimMin: Number,
    songPrice: Number,
    introDiscount: Number,
  },
  { timestamps: true },
  { collection: "opsconfigs" },
);

module.exports = mongoose.model("opsconfig", opsconfigSchema);
