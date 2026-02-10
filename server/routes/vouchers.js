const express = require("express");
const Voucher = require("../models/Voucher");

const router = express.Router();

// CREATE a voucher
router.post("/", async (req, res) => {
  try {
    const { discount } = req.body;
    // Pre-validation check if (discount < 0 || discount > 100)
    if (discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ error: "Discount must be between 0 and 100" });
    }

    const voucher = await Voucher.create(req.body);
    res.status(201).json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all vouchers
router.get("/", async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ one voucher by ID
router.get("/:id", async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a voucher by ID
router.put("/:id", async (req, res) => {
  try {
    const { discount } = req.body;
    // Pre-validation check if (discount !== undefined && (discount < 0 || discount > 100))
    if (discount < 0 || discount > 100) {
      return res
        .status(400)
        .json({ error: "Discount must be between 0 and 100" });
    }
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      // ensures schema validators (min/max) are applied
    });
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE a voucher by ID
router.delete("/:id", async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ message: "Voucher not found" });
    res.json({ message: "Voucher deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
