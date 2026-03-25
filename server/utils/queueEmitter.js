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

const emitPendingQueue = async (io) => {
  try {
    const sockets = await io.fetchSockets();

    const usernames = new Set();

    // collect all joined usernames (rooms)
    sockets.forEach((socket) => {
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          usernames.add(room);
        }
      });
    });

    for (const username of usernames) {
      const count = await Project.countDocuments({
        "lock.user": username,
        status: / - WIP$/i, // improved regex
      });

      io.to(username).emit("pendingQueueUpdated", { count });
    }
  } catch (err) {
    console.error("emitPendingQueue error:", err.message);
  }
};
module.exports = {
  emitLyricistQueue,
  emitSAQueue,
  emitQAQueue,
  emitPendingQueue,
};
