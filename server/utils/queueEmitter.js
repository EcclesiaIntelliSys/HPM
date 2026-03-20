const Project = require("../models/Project");

const emitLyricistQueue = async (io) => {
  try {
    const count = await Project.countDocuments({
      status: "Queued for Lyricist",
    });

    io.emit("lyricistQueueUpdated", { count });
  } catch (err) {
    console.error("emitLyricistQueue error:", err.message);
  }
};

const emitSAQueue = async (io) => {
  try {
    const count = await Project.countDocuments({
      status: "Queued for Song Artist",
    });

    io.emit("saQueueUpdated", { count });
  } catch (err) {
    console.error("emitSAQueue error:", err.message);
  }
};

const emitQAQueue = async (io) => {
  try {
    const count = await Project.countDocuments({
      status: "Queued for Quality Assurance",
    });

    io.emit("qaQueueUpdated", { count });
  } catch (err) {
    console.error("emitQAQueue error:", err.message);
  }
};

module.exports = {
  emitLyricistQueue,
  emitSAQueue,
  emitQAQueue,
};
