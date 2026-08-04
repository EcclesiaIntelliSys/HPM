const mongoose = require("mongoose");

const opsconfigSchema = new mongoose.Schema(
  {
    accessTokenAge: String,
    refreshTokenAge: String,
    projectMinLimit: Number,
    heartBeatMin: Number,
    lyricistWorkMin: Number,
    saWorkMin: Number,
    qaWorkMin: Number,
    lyricistClaimMin: Number,
    songartistClaimMin: Number,
    qaClaimMin: Number,
    songPrice: Number,
    introDiscount: Number,
    fastTrackPrice: Number,
    fastTrackDays: Number,
    nextDayPrice: Number,
    nextDayDays: Number,
    lyricVideoPrice: Number,
    lyricVideoDays: Number,
    commercialRightsPrice: Number,
  },
  { timestamps: true, collection: "opsconfigs" },
);

module.exports =
  mongoose.models.opsconfig || mongoose.model("opsconfig", opsconfigSchema);
