const Project = require("../models/Project");
const Clockify = require("../models/Clockify");
const Testimonial = require("../models/Testimonial");

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
      const [count, countAdmin, countClockify, countClockifyPaid] =
        await Promise.all([
          Project.countDocuments({
            "lock.user": username,
            status: / - WIP$/i,
          }),
          Project.countDocuments({
            $or: [
              { status: "Queued for Admin Review and Action" },
              { status: "Admin Review in Progress" },
            ],
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
        countAdmin,
        countClockify,
        countClockifyPaid,
      });
    }
  } catch (err) {
    console.error("emitPendingQueue error:", err.message);
  }
};

const emitPendingTestimonial = async (io) => {
  try {
    const count = await Testimonial.countDocuments({
      status: "pending",
    });

    io.emit("pendingTestimonialUpdated", { count });
  } catch (err) {
    console.error("emitPendingTestimonial error:", err.message);
  }
};

module.exports = {
  emitLyricistQueue,
  emitSAQueue,
  emitQAQueue,
  emitPendingQueue,
  emitPendingTestimonial,
};
