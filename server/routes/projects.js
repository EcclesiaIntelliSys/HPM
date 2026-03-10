const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const Voucher = require("../models/Voucher");
const transporter = require("../utils/mailer");
const LOCK_TIMEOUT = 30 * 60 * 1000; // 30 minutes

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
      from: process.env.TITAN_USER,
      to: email,
      subject: "Your Heart’s Prayer Is Being Crafted",
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

    // Extract fields from request body
    const { songtitle, lyrics, lyricist, lyricist_end, ...otherUpdates } =
      req.body;

    // Build update object
    const updates = {
      ...otherUpdates,
    };

    if (songtitle !== undefined) updates.songtitle = songtitle;
    if (lyrics !== undefined) updates.lyrics = lyrics;
    if (lyricist !== undefined) updates.lyricist = lyricist;
    if (lyricist_end !== undefined) updates.lyricist_end = lyricist_end;

    const project = await Project.findByIdAndUpdate(id, updates, {
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

// START - LYRICIST ROUTES
router.post("/assign-lyricist", async (req, res) => {
  const { username } = req.body;
  const project = await Project.findOne({ status: "Queued for Lyricist" }).sort(
    { createdAt: 1 },
  );

  if (!project) return res.status(404).json({ error: "No projects in queue" });

  res.json({ project });
});

// END - LYRICIST ROUTES

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

router.post("/:id/claim", async (req, res) => {
  console.log("Im claiming");
  const { id } = req.params;
  const { username } = req.body;

  const expired = new Date(Date.now() - LOCK_TIMEOUT);

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { lyricist: null },
        { lyricist: username },
        { "lock.timestamp": { $lt: expired } },
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

  res.json(project);
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
