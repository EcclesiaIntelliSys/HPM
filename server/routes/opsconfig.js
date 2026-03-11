const express = require("express");
const router = express.Router();
const Config = require("../models/opsconfig");

router.get("/client-config", async (req, res) => {
  const config = await Config.findOne({});
  console.log("Im hitted");
  res.json({
    // accessTokenAge: config.accessTokenAge,
    // refreshTokenAge: config.refreshTokenAge,
    projectMinLimit: config.projectMinLimit,
    heartBeatMin: config.heartBeatMin,
    lyricistClaimMin: config.lyricistClaimMin,
    songartistClaimMin: config.songartistClaimMin,
    qaClaimMin: config.qaClaimMin,
    songPrice: config.songPrice,
    introDiscount: config.introDiscount,
  });
});

module.exports = router;
