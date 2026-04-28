const mongoose = require("mongoose");
const Project = require("../models/Project");
const OpsConfig = require("../models/opsconfig"); // Mongo-driven config

let cleanupRunning = false;

/**
 * Requeues orphaned projects based on role-specific rules.
 * @param {Object} params
 * @param {string} params.status - Current status of the project.
 * @param {string} params.queueStatus - Status to reset to.
 * @param {string} params.roleField - Field representing assigned user.
 * @param {string} params.startField - Field representing start timestamp.
 * @param {number} params.claimMinutes - Time before a project is considered orphaned.
 * @param {string} params.logMessage - Message to append to project logs.
 * @returns {Promise<number>} - Number of modified documents.
 */
async function requeueProjects({
  status,
  queueStatus,
  roleField,
  startField,
  claimMinutes,
  logMessage,
}) {
  const expiry = new Date(Date.now() - claimMinutes * 60 * 1000);
  const now = new Date();
  // console.log("Requeing projects");
  const result = await Project.updateMany(
    {
      status,
      "lock.timestamp": { $lte: expiry }, //A project will be requeued if last heartbeat is older than lock expiration
    },
    {
      $set: {
        [roleField]: null,
        [startField]: null,
        status: queueStatus,
        lock: { _id: null, user: null, timestamp: null },
      },
      $push: {
        logs: {
          timestamp: now,
          actor: "SYSTEM",
          message: logMessage,
        },
      },
    },
  );

  return result.modifiedCount;
}

/**
 * Cleans up orphaned projects for Lyricist, Song Artist, and QA roles.
 */
async function cleanupOrphan() {
  if (cleanupRunning) return;
  console.log("Cleaning up orphan projects.");
  cleanupRunning = true;

  try {
    // Fetch the latest configuration document from Mongo
    const config = await OpsConfig.findOne().sort({ createdAt: -1 });
    if (!config) {
      console.error("No opsconfig found. Aborting orphan cleanup.");
      return;
    }

    // Lyricist
    const lyricistCount = await requeueProjects({
      status: "Lyricist - WIP",
      queueStatus: "Queued for Lyricist",
      roleField: "lyricist",
      startField: "lyricist_start",
      claimMinutes: config.lyricistClaimMin,
      logMessage: "Project was orphaned. Requeued for Lyricist",
    });

    // Song Artist
    const songArtistCount = await requeueProjects({
      status: "Song Artist - WIP",
      queueStatus: "Queued for Song Artist",
      roleField: "songartist",
      startField: "songartist_start",
      claimMinutes: config.songartistClaimMin,
      logMessage: "Project was orphaned. Requeued for Song Artist",
    });

    // QA
    const qaCount = await requeueProjects({
      status: "Quality Assurance - WIP",
      queueStatus: "Queued for Quality Assurance",
      roleField: "assessor",
      startField: "assessor_start",
      claimMinutes: config.qaClaimMin,
      logMessage: "Project was orphaned. Requeued for Quality Assurance",
    });

    if (lyricistCount)
      console.log(`Requeued ${lyricistCount} orphaned Lyricist projects.`);
    if (songArtistCount)
      console.log(`Requeued ${songArtistCount} orphaned Song Artist projects.`);
    if (qaCount) console.log(`Requeued ${qaCount} orphaned QA projects.`);
  } catch (err) {
    console.error("Error during orphan cleanup:", err);
  } finally {
    cleanupRunning = false;
  }
}

module.exports = { cleanupOrphan };
