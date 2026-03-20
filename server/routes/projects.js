const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Voucher = require("../models/Voucher");
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
    const count = await Project.countDocuments({
      status: "Queued for Quality Assurance",
    });
    io.emit("qaQueueUpdated", { count });
  } catch (err) {
    console.error("emitQAQueue error:", err.message);
  }
};

const emitClockifyQueue = async (req) => {
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

const emitClockifyPaidQueue = async (req) => {
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

    await transporter.sendMail({
      from: process.env.TITAN_FROM,
      to: email,
      subject: "Your Heart’s Prayer Is Being Crafted Into a Song",
      html: ` <p>Thank you for trusting <strong>HeartPrayerMusic</strong> to transform your heart’s prayer into a song. We’re honored to be part of something so personal and meaningful.</p>
              <p>Our gifted artists are already prayerfully and thoughtfully working on your custom song, giving careful attention to every detail so it reflects your heart and intention.</p>
              <p>Your custom song will be delivered to you on or before <strong>${targetdate.toLocaleDateString(
                "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}</strong>. You may track the status of your custom song by referencing Song Code # <strong style="text-decoration: underline;">${project.songcode}</strong>.</p>
          <br></br>
                    <div className="w-3/4 shadow-md py-8 px-14 bg-gray-100 text-sm font-mono border-2 border-gray-200 carrois-gothic-sc-regular">
            <div className="my-0">
              <p className="text-center font-black">
                <strong>CUSTOM SONG SPECIFICATION</strong>
              </p>
              <br/>
              <p className="font-light">
                A custom song dedicated to 
                <strong><span className="font-semibold text-blue-800 font-montserrat">
                  ${recipient} 
                </span></strong>
                (
                <strong><span className="font-semibold text-blue-800 font-montserrat">
                  ${relation}
                </span></strong>
                ). <span> </span>
                ${recipient}'s age group is 
                <strong><span className="font-semibold text-blue-800 font-montserrat">
                  ${agegroup}
                </span></strong>
                .
              </p>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">Special Qualities :</span>
                <strong><span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${qualities}
                </span></strong>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">Memorable Moments :</span>
                <strong><span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${moment}
                </span></strong>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">
                  What This Song Should Say :
                </span>
                <strong><span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${specialmsg}
                </span></strong>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">Song Style / Genre :</span>
                <strong><span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${genre}
                </span></strong>
              </div>
              <div className="flex text-md gap-5">
                <span className="w-1/4 text-right">
                  Preferred Voice Gender :
                </span>
                <strong><span className="w-3/4 text-blue-800 text-left border-2 px-1 font-semibold text-blue-800 font-montserrat">
                  ${voice}
                </span></strong>
              </div>
              <br/><br/>
              <p>Thank you again for allowing us to serve you through music and prayer.<p>
              <p>Warm blessings,</p>
              <br/>
              <p><strong>HeartPrayerMusic Creatives Team</strong></p>
          `,
    });
    // emit updated queue
    await emitLyricistQueue(req);

    res
      .status(201)
      .json({ message: "Saved", id: project._id, songcode: project.songcode });
  } catch (err) {
    console.error("POST /api/projects error", err);
    return res.status(500).json({ error: "Server error" });
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
    } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (songartist) filter.songartist = songartist;
    if (assessor) filter.assessor = assessor;
    if (lyricist) filter.lyricist = lyricist;
    if (songcode) filter.songcode = songcode;

    // Date range filter
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) filter.createdAt.$lte = new Date(toDate);
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
    const { id } = req.params;
    // const { status } = req.body;
    // Extract fields from request body
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
      ...otherUpdates
    } = req.body;

    // Build update object
    const updates = {
      ...otherUpdates,
      lock: {
        _id: null,
        user: null,
        timestamp: null,
      },
    };

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

    const project = await Project.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!project) return res.status(404).json({ error: "Project not found" });

    await emitLyricistQueue(req);
    await emitSAQueue(req);
    await emitQAQueue(req);

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
    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("DELETE /api/projects/:id error", err);
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
  await emitLyricistQueue(req);

  res.json({ project });
});

router.post("/:id/lyricistclaim", async (req, res) => {
  console.log("Lyricist claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
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
    console.log("Didnt find project");

    return res.status(409).json({
      message: "Project locked",
      lockUser: lockedProject.lock.user,
      lockTimestamp: lockedProject.lock.timestamp,
    });
  }
  // emit updated queue after claim
  await emitLyricistQueue(req);
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
  await emitSAQueue(req);

  res.json({ project });
});

router.post("/:id/saclaim", async (req, res) => {
  console.log("Song Artist claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
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
    console.log("Didnt find project");

    return res.status(409).json({
      message: "Project locked",
      lockUser: lockedProject.lock.user,
      lockTimestamp: lockedProject.lock.timestamp,
    });
  }
  // emit updated queue after claim
  await emitSAQueue(req);
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
  await emitQAQueue(req);

  res.json({ project });
});

router.post("/:id/qaclaim", async (req, res) => {
  console.log("Assessor claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
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
    console.log("Didnt find project");

    return res.status(409).json({
      message: "Project locked",
      lockUser: lockedProject.lock.user,
      lockTimestamp: lockedProject.lock.timestamp,
    });
  }
  // emit updated queue after claim
  await emitQAQueue(req);
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

    const title = project.songtitlerev || project.songtitle || "Song";

    const filename = `${title} - ${project.songcode}.mp3`
      .replace(/[^\w\s\-\.]/g, "")
      .replace(/\s+/g, "_");

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
  console.log("heartbeat...");

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

module.exports = router;
