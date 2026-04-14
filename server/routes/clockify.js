// routes/clockify.js
const express = require("express");
const router = express.Router();
const Clockify = require("../models/Clockify");

// Add a clockify record
router.post("/", async (req, res) => {
  try {
    const { resource, service, songcode, start, end, hours_rendered } =
      req.body;

    // Find the latest existing record for this combination
    const lastRecord = await Clockify.findOne({
      resource,
      service,
      songcode,
    }).sort({ attempt: -1 }); // highest attempt first

    // Determine next attempt number
    const nextAttempt = lastRecord ? lastRecord.attempt + 1 : 1;

    const record = new Clockify({
      resource,
      service,
      songcode,
      start,
      end,
      hours_rendered,
      attempt: nextAttempt,
    });

    await record.save();
    res.json(record);
  } catch (err) {
    console.error("Error saving clockify record:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/clockify - with provision for filters specified in React component
router.get("/", async (req, res) => {
  try {
    const { resource, service, songcode, fromDate, toDate, payflag, txnref } =
      req.query;

    let filter = {};

    if (payflag) filter.payflag = payflag;
    if (resource) filter.resource = resource;
    if (songcode) filter.songcode = songcode;
    if (service) filter.service = service;
    if (txnref) filter.txnref = txnref;

    // Date range filter
    if (fromDate || toDate) {
      filter.end = {};
      if (fromDate) filter.end.$gte = new Date(fromDate);
      if (toDate) filter.end.$lte = new Date(toDate);
      if (Object.keys(filter.end).length === 0) delete filter.end;
    }

    const clockifyItems = await Clockify.find(filter).sort({ end: -1 });

    res.json(clockifyItems);
  } catch (err) {
    console.error("GET /api/clockify error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE a clockify record (by filters)
router.put("/override", async (req, res) => {
  try {
    const {
      resource,
      service,
      songcode,
      hours_rendered_override,
      reviewer,
      reviewdate,
    } = req.body;

    // 🔍 Find the record with the highest attempt
    const updated = await Clockify.findOneAndUpdate(
      { resource, service, songcode }, // match filter
      { hours_rendered_override, reviewer, reviewdate }, // fields to update
      { sort: { attempt: -1 }, new: true }, // pick highest attempt & return updated doc
    );

    if (!updated) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/clockify/override error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
