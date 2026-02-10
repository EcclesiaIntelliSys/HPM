const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Voucher = require("../models/Voucher"); // ✅ import Voucher model

// simple email validator
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

// POST /api/projects
router.post("/", async (req, res) => {
  try {
    const {
      relation,
      recipient,
      agegroup,
      qualities,
      moment,
      specialmsg,
      genre,
      voice,
      email,
      ack,
      voucherNo,
    } = req.body;

    // Validate presence
    if (
      !relation ||
      !recipient ||
      !agegroup ||
      !qualities ||
      !moment ||
      !specialmsg ||
      !genre ||
      !voice ||
      !email ||
      !ack
    ) {
      return res
        .status(400)
        .json({ error: "Some required fields are empty!!" });
    }

    // Validate types
    if (
      [
        relation,
        recipient,
        agegroup,
        qualities,
        moment,
        specialmsg,
        genre,
        voice,
        email,
      ].some((f) => typeof f !== "string") ||
      typeof ack !== "boolean"
    ) {
      return res.status(400).json({ error: "Invalid field types" });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const project = new Project({
      relation,
      recipient,
      agegroup,
      qualities,
      moment,
      specialmsg,
      genre,
      voice,
      email,
      ack,
      voucherNo,
    });

    await project.save();

    // ✅ Update voucher if voucherNo provided
    if (voucherNo) {
      await Voucher.findOneAndUpdate(
        { vouchercode: voucherNo },
        {
          valid: false,
          claimed: true,
          claimedby: email,
          claimdate: new Date(),
        },
        { new: true },
      );
    }

    return res
      .status(201)
      .json({ message: "Saved", id: project._id, songcode: project.songcode });
  } catch (err) {
    console.error("POST /api/projects error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error("GET /api/projects error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/:id
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error("GET /api/projects/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/projects/:id
router.put("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (err) {
    console.error("PUT /api/projects/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/projects/:id
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /api/projects/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
