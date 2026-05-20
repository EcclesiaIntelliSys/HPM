const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Voucher = require("../models/Voucher");
const Clockify = require("../models/Clockify");
const buildPaymentEmail = require("../emails/paymentConfirmation");

const transporter = require("../utils/mailer");
const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Mp3 file upload dependencies
const upload = require("../middleware/audioUpload");
const convertToMp3 = require("../utils/convertToMp3");
const r2 = require("../utils/r2");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

// simple email validator
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

/* ------------------ HELPERS ------------------ */
// Emit updated lyricist queue to all clients
const emitLyricistQueue = async (req) => {
  try {
    const io = req.app.get("io");
    const count = await Project.countDocuments({
      status: "Queued for Lyricist",
    });
    io.emit("lyricistQueueUpdated", { count });
  } catch (err) {
    console.error("emitLyricistQueue error:", err.message);
  }
};

const emitSAQueue = async (req) => {
  try {
    const io = req.app.get("io");
    const count = await Project.countDocuments({
      status: "Queued for Song Artist",
    });
    io.emit("saQueueUpdated", { count });
  } catch (err) {
    console.error("emitSAQueue error:", err.message);
  }
};

const emitQAQueue = async (req) => {
  try {
    const io = req.app.get("io");
    const count = await Project.countDocuments({
      status: "Queued for Quality Assurance",
    });
    io.emit("qaQueueUpdated", { count });
  } catch (err) {
    console.error("emitQAQueue error:", err.message);
  }
};

const emitPendingQueue = async (req) => {
  try {
    const io = req.app.get("io");

    const sockets = await io.fetchSockets();
    const usernames = new Set();

    sockets.forEach((socket) => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          usernames.add(room);
        }
      });
    });

    for (const username of usernames) {
      const [count, countClockify, countClockifyPaid] = await Promise.all([
        Project.countDocuments({
          "lock.user": username,
          status: / - WIP$/i,
        }),
        Clockify.countDocuments({
          resource: username,
        }),
        Clockify.countDocuments({
          resource: username,
          payflag: true,
        }),
      ]);

      io.to(username).emit("pendingQueueUpdated", {
        count,
        countClockify,
        countClockifyPaid,
      });
    }
  } catch (err) {
    console.error("emitPendingQueue error:", err.message);
  }
};

/* ------------------ ROUTES ------------------ */
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

    const targetdate = new Date(new Date().setDate(new Date().getDate() + 7));
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
      targetdate,
    });

    await project.save();

    res
      .status(201)
      .json({ message: "Saved", id: project._id, songcode: project.songcode });
  } catch (err) {
    console.error("POST /api/projects error", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/mark-free", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    if (project.paymentStatus === "paid") {
      return res.status(400).json({
        error: "Project already paid",
      });
    }

    const actor = "SYSTEM";
    const timestamp = new Date();
    const message = "Free order confirmed. Queuing for Lyricist Action.";

    project.paymentStatus = "free";
    project.status = "Queued for Lyricist";

    project.logs.push({
      timestamp,
      actor,
      message,
    });

    await project.save();

    // voucher claiming
    if (project.voucherNo) {
      await Voucher.findOneAndUpdate(
        { vouchercode: project.voucherNo },
        {
          valid: false,
          claimed: true,
          claimedby: project.email,
          claimdate: new Date(),
        },
      );
    }

    // confirmation email
    await transporter.sendMail({
      from: process.env.TITAN_FROM,
      to: project.email,
      subject: "Your Heart’s Prayer Is Being Crafted Into a Song",
      html: buildPaymentEmail(project),
    });

    // realtime artist dashboard refresh
    await emitLyricistQueue(req);

    res.json({
      success: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Server error",
    });
  }
});

// GET /api/projects - with provision for filters specified in React component
router.get("/", async (req, res) => {
  try {
    const {
      status,
      songartist,
      assessor,
      lyricist,
      songcode,
      fromDate,
      toDate,
      status_contains,
    } = req.query;

    const lockUser = req.query["lock.user"];

    let filter = {};

    if (status && !status_contains) filter.status = status;

    if (status_contains) {
      filter.status = { $regex: status_contains, $options: "i" };
    }

    if (lockUser) filter["lock.user"] = lockUser;
    if (songartist) filter.songartist = songartist;
    if (assessor) filter.assessor = assessor;
    if (lyricist) filter.lyricist = lyricist;
    if (songcode) filter.songcode = songcode;

    // Date range filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    console.error("GET /api/projects error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects count by status
router.get("/count", async (req, res) => {
  try {
    const { status } = req.query;
    const count = await Project.countDocuments({ status });
    res.json({ count });
  } catch (err) {
    console.error("Count error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects count pending by user
router.get("/countPendingByuser", async (req, res) => {
  try {
    const lockUser = req.query["lock.user"];
    const statusContains = req.query.status_contains;

    const query = {};

    if (lockUser) {
      query["lock.user"] = lockUser;
    }

    if (statusContains) {
      query.status = {
        $regex: ` - ${statusContains}$`, // ensures it ends with " - WIP"
        $options: "i",
      };
    }

    const [count, countAdmin, countClockify, countClockifyPaid] =
      await Promise.all([
        Project.countDocuments(query),
        Project.countDocuments({
          status: "Queued for Admin Review and Action",
        }),
        Clockify.countDocuments({
          resource: lockUser,
        }),
        Clockify.countDocuments({
          resource: lockUser,
          payflag: true,
        }),
      ]);

    res.json({ count, countAdmin, countClockify, countClockifyPaid });
  } catch (err) {
    console.error("Count error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/songcode/:songcode
router.get("/songcode/:songcode", async (req, res) => {
  try {
    const project = await Project.findOne({
      songcode: req.params.songcode,
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("GET /api/projects/songcode error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/projects/tracker

router.get("/tracker", async (req, res) => {
  try {
    let { email, songCode } = req.query;

    if (!email || !songCode) {
      return res
        .status(400)
        .json({ error: "Email and song code are required" });
    }

    email = email.toLowerCase().trim();
    songCode = songCode.trim();

    const project = await Project.findOne({
      email,
      songcode: songCode,
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("GET /api/projects/tracker error", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/projects/:id

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      songtitle,
      lyrics,
      lyricist,
      lyricist_end,
      songtitlerev,
      lyricsrev,
      songartist,
      songartist_end,
      dispo,
      dispo_remarks,
      assessor,
      assessor_end,
      status,
      clearLock,
      ...otherUpdates
    } = req.body;

    // Build update object
    const updates = {
      ...otherUpdates,
    };

    // Only clear lock on submit
    if (clearLock) {
      updates.lock = {
        _id: null,
        user: null,
        timestamp: null,
      };
    }

    if (songtitle !== undefined) updates.songtitle = songtitle;
    if (lyrics !== undefined) updates.lyrics = lyrics;
    if (lyricist !== undefined) updates.lyricist = lyricist;
    if (lyricist_end !== undefined) updates.lyricist_end = lyricist_end;
    if (songtitlerev !== undefined) updates.songtitlerev = songtitlerev;
    if (lyricsrev !== undefined) updates.lyricsrev = lyricsrev;
    if (songartist !== undefined) updates.songartist = songartist;
    if (songartist_end !== undefined) updates.songartist_end = songartist_end;
    if (dispo !== undefined) updates.dispo = dispo;
    if (dispo_remarks !== undefined) updates.dispo_remarks = dispo_remarks;
    if (assessor !== undefined) updates.assessor = assessor;
    if (assessor_end !== undefined) updates.assessor_end = assessor_end;
    if (status !== undefined) updates.status = status;

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true },
    );

    // Send email to customer if status is Project Completed

    if (status === "Project Completed") {
      const link = `${process.env.FRONTEND_URL}/hpmPlayer/${project.publicId}`;
      await transporter.sendMail({
        from: process.env.TITAN_FROM,
        to: project.email,
        subject: "Your Heart’s Prayer Song is Ready!",
        html: ` <p>Thank you again for trusting HeartPrayerMusic to bring your heart’s prayer to life. It has been a privilege to create something so personal and meaningful for you.</p>
              <p>Our artists have carefully and prayerfully completed your song, giving thoughtful attention to every detail so it truly reflects your intention and message.</p>
              <p>You can now listen to your completed song using the link below:</p>
              <p>${link}</p>
          <br></br>
              <p>This link will play your song directly in our audio player so you can listen and share the experience with your dedicatee using any device.<p>
              <p>We hope this song becomes a beautiful and lasting expression of your heart.</p>
              <p>If you have any questions or need any assistance, feel free to reply to this email—we’re here for you.</p>
              <br></br>
              <p>With gratitude,</p>
              <br/>
              <p><strong>HeartPrayerMusic Creatives Team</strong></p>
          `,
      });
    }

    if (!project) return res.status(404).json({ error: "Project not found" });

    await emitLyricistQueue(req);
    await emitSAQueue(req);
    await emitQAQueue(req);
    await emitPendingQueue(req);

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
    await emitLyricistQueue(req);
    await emitSAQueue(req);
    await emitQAQueue(req);
    await emitPendingQueue(req);
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /api/projects/:id error", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/audioplayer/:publicId", async (req, res) => {
  try {
    const project = await Project.findOne({
      publicId: req.params.publicId,
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // OPTIONAL: only return what the player needs
    res.json({
      filename: project.filename,
      recipient: project.recipient,
      genre: project.genre,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// START - LYRICIST ROUTES
router.post("/assign-lyricist", async (req, res) => {
  const { username } = req.body;
  const project = await Project.findOne({ status: "Queued for Lyricist" }).sort(
    { createdAt: 1 },
  );

  if (!project) return res.status(404).json({ error: "No projects in queue" });
  // emit updated queue immediately after assignment

  res.json({ project });
});

router.post("/:id/lyricistclaim", async (req, res) => {
  // console.log("Lyricist claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      status: "Queued for Lyricist",
      $or: [
        {
          $or: [
            { lyricist: null },
            { lyricist: "" },
            { lyricist: { $exists: false } },
          ], //if untouched by any lyricist
        },
        { lyricist: username }, //if last touch is user himself
        { "lock.timestamp": { $lt: expired } }, //regardless of lyricist... so long as lock has lapsed
      ],
    },
    [
      {
        $set: {
          lyricist: username,
          status: "Lyricist - WIP",
          lock: {
            user: username,
            timestamp: new Date(),
          },

          lyricist_start: { $ifNull: ["$lyricist_start", new Date()] },

          logs: {
            $cond: [
              { $ne: ["$lyricist", username] },
              {
                $concatArrays: [
                  { $ifNull: ["$logs", []] },
                  [
                    {
                      timestamp: new Date(),
                      actor: username,
                      message: "Accepted by Lyricist",
                    },
                  ],
                ],
              },
              "$logs",
            ],
          },
        },
      },
    ],
    { new: true },
  );

  if (!project) {
    const lockedProject = await Project.findById(id);
    // console.log("Didnt find project");

    return res.status(409).json({
      message: "Project locked",
      lockUser: lockedProject.lock.user,
      lockTimestamp: lockedProject.lock.timestamp,
    });
  }
  // emit updated queue after claim
  await emitLyricistQueue(req);
  await emitPendingQueue(req);
  res.json(project);
});

// END - LYRICIST ROUTES

// START - SONG ARTIST ROUTES
router.post("/assign-sa", async (req, res) => {
  const { username } = req.body;
  const project = await Project.findOne({
    status: "Queued for Song Artist",
  }).sort({ createdAt: 1 });

  if (!project) return res.status(404).json({ error: "No projects in queue" });
  // emit updated queue immediately after assignment

  res.json({ project });
});

router.post("/:id/saclaim", async (req, res) => {
  // console.log("Song Artist claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      status: "Queued for Song Artist",
      $or: [
        {
          $or: [
            { songartist: null },
            { songartist: "" },
            { songartist: { $exists: false } },
          ],
        },
        { songartist: username },
        { "lock.timestamp": { $lt: expired } },
      ],
    },
    [
      {
        $set: {
          songartist: username,
          status: "Song Artist - WIP",
          lock: {
            user: username,
            timestamp: new Date(),
          },

          songartist_start: { $ifNull: ["$songartist_start", new Date()] },

          logs: {
            $cond: [
              { $ne: ["$songartist", username] },
              {
                $concatArrays: [
                  { $ifNull: ["$logs", []] },
                  [
                    {
                      timestamp: new Date(),
                      actor: username,
                      message: "Accepted by Song Artist",
                    },
                  ],
                ],
              },
              "$logs",
            ],
          },
        },
      },
    ],
    { new: true },
  );

  if (!project) {
    const lockedProject = await Project.findById(id);
    // console.log("Didnt find project");

    return res.status(409).json({
      message: "Project locked",
      lockUser: lockedProject.lock.user,
      lockTimestamp: lockedProject.lock.timestamp,
    });
  }
  // emit updated queue after claim
  await emitSAQueue(req);
  await emitPendingQueue(req);
  res.json(project);
});

router.post("/:id/upload-audio", upload.single("audio"), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let audioBuffer = req.file.buffer;

    // Convert if not mp3
    if (req.file.mimetype !== "audio/mpeg") {
      audioBuffer = await convertToMp3(audioBuffer);
    }

    const title =
      req.body.songtitlerev ||
      project.songtitlerev ||
      project.songtitle ||
      "Song";

    const filename = `${title} - ${project.songcode}.mp3`.replace(
      /[^\w\s\-\.]/g,
      "",
    );
    // .replace(/\s+/g, "_")
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: filename,
        Body: audioBuffer,
        ContentType: "audio/mpeg",
      }),
    );

    project.filename = filename;
    await project.save();

    res.json({ filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// END - SONG ARTIST ROUTES

// START - QUALITY ASSURANCE ROUTES
router.post("/assign-qa", async (req, res) => {
  const { username } = req.body;
  const project = await Project.findOne({
    status: "Queued for Quality Assurance",
  }).sort({ createdAt: 1 });

  if (!project) return res.status(404).json({ error: "No projects in queue" });
  // emit updated queue immediately after assignment

  res.json({ project });
});

router.post("/:id/qaclaim", async (req, res) => {
  // console.log("Assessor claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      status: "Queued for Quality Assurance",
      $or: [
        {
          $or: [
            { assessor: null },
            { assessor: "" },
            { assessor: { $exists: false } },
          ],
        },
        { assessor: username },
        { "lock.timestamp": { $lt: expired } },
      ],
    },
    [
      {
        $set: {
          assessor: username,
          status: "Quality Assurance - WIP",
          lock: {
            user: username,
            timestamp: new Date(),
          },

          assessor_start: { $ifNull: ["$assessor_start", new Date()] },
          logs: {
            $cond: [
              { $ne: ["$assessor", username] },
              {
                $concatArrays: [
                  { $ifNull: ["$logs", []] },
                  [
                    {
                      timestamp: new Date(),
                      actor: username,
                      message: "Accepted by QA Assessor",
                    },
                  ],
                ],
              },
              "$logs",
            ],
          },
        },
      },
    ],
    { new: true },
  );

  if (!project) {
    const lockedProject = await Project.findById(id);
    // console.log("Didnt find project");

    return res.status(409).json({
      message: "Project locked",
      lockUser: lockedProject.lock.user,
      lockTimestamp: lockedProject.lock.timestamp,
    });
  }
  // emit updated queue after claim
  await emitQAQueue(req);
  await emitPendingQueue(req);
  res.json(project);
});

// END - QUALITY ASSURANCE ROUTES

//Add a log entry to a project
router.post("/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp, actor, message } = req.body;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    project.logs.push({ timestamp, actor, message });
    await project.save();
    res.json(project);
  } catch (err) {
    console.error("Error adding log:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/:id/heartbeat", async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;
  // console.log("heartbeat...");

  await Project.updateOne(
    {
      _id: id,
      "lock.user": username,
    },
    {
      $set: {
        "lock.timestamp": new Date(),
      },
    },
  );

  res.json({ ok: true });
});

router.get("/:id/status", async (req, res) => {
  const project = await Project.findById(req.params.id);
  res.json({ status: project.paymentStatus });
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
module.exports = router;
