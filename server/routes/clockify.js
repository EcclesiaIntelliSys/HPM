// routes/clockify.js
const express = require("express");
const router = express.Router();
const Clockify = require("../models/Clockify");

// Add a clockify record
router.post("/", async (req, res) => {
  try {
    const { resource, service, songcode, start, end, hours_rendered } =
      req.body;

    const record = new Clockify({
      resource,
      service,
      songcode,
      start,
      end,
      hours_rendered,
    });

    await record.save();
    res.json(record);
  } catch (err) {
    console.error("Error saving clockify record:", err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
