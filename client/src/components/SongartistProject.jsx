import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Modal from "../components/Modal";
import api from "../api/api";
import Themes from "../components/Themes";
const currentTheme = Themes.sa;
export default function SongartistProject() {
  const [user, setUser] = useState(null);
  const [bit1, bit2, bit3, bit4, bit5, bit6] = user?.role || [];
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [songTitleRev, setSongTitleRev] = useState("");
  const timerRef = useRef(null);

  const [LyricsRev, setLyricsRev] = useState("");
  const [loading, setLoading] = useState(true);
  const [lockedInfo, setLockedInfo] = useState(false);
  const [config, setConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [newLogMessage, setNewLogMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const claimedRef = useRef(false);

  //modal constants
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAckModal, setShowAckModal] = useState(false);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);

  //states for the spinner
  const [savingProgress, setSavingProgress] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);

  //states for audio file upload
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [fileError, setFileError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL;

  function timeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 60000);

    if (diff < 1) return "just now";
    if (diff < 60) return `${diff} minutes`;

    const hours = Math.floor(diff / 60);
    return `${hours} hours`;
  }

  //Load operational config values from DB
  useEffect(() => {
    fetch(`${API_BASE}/api/opsconfig/client-config`)
      .then((res) => res.json())
      .then((cfg) => {
        setConfig(cfg);
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, []);
  // console.log("CONFIG:" + config);

  // Countdown timer
  useEffect(() => {
    if (!project?.songartist_start || !config) return;

    const start = new Date(project.songartist_start).getTime();
    const limit = config.saWorkMin * 60;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = limit - elapsed;
      setTimeLeft(Math.max(remaining, 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [project?.songartist_start, config]);

  // Warn on refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (token && !isSubmitted) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [token, isSubmitted]);

  // Decode user from token
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }
  }, [token]);

  // Fetch and claim the project
  useEffect(() => {
    if (!token || !user || claimedRef.current) return;

    const claimProject = async () => {
      try {
        const res = await axios.post(
          `${API_BASE}/api/projectsmanage/${id}/saclaim`,
          { username: user.username },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setProject(res.data);
      } catch (err) {
        if (err.response?.status === 409) {
          setLockedInfo(err.response.data);
        }
      } finally {
        setLoading(false);
      }
    };
    claimedRef.current = true;
    claimProject();
  }, [id, user]); //

  useEffect(() => {
    if (!project || isSubmitted || !config) return;

    const interval = setInterval(
      () => {
        api.post(`/api/projectsmanage/${id}/heartbeat`).catch(() => {});
      },
      config.heartBeatMin * 1000 * 60,
    ); //extend lock expiry every x minutes while my project session is open

    return () => clearInterval(interval);
  }, [project, config]);

  useEffect(() => {
    //display whatever previous Song Artist have contributed.
    if (project) {
      setSongTitleRev(project.songtitlerev || "");
      setLyricsRev(project.lyricsrev || "");
    }
  }, [project]);

  // Add log entry
  const handleAddLog = async () => {
    if (!newLogMessage.trim()) return;
    const newLog = {
      timestamp: new Date().toISOString(),
      actor: user?.username || "Unknown",
      message: newLogMessage,
    };

    try {
      await axios.post(`${API_BASE}/api/projectsmanage/${id}/logs`, newLog, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProject((prev) => ({
        ...prev,
        logs: [...prev.logs, newLog],
      }));
      setNewLogMessage("");
    } catch (err) {
      console.error("Error saving log:", err);
    }
  };

  const handleSaveProgress = async () => {
    try {
      setSavingProgress(true);
      await axios.put(
        `${API_BASE}/api/projectsmanage/${id}`,
        { songtitlerev: songTitleRev, lyricsrev: LyricsRev },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProject((prev) => ({
        ...prev,
        songtitlerev: songTitleRev,
        lyricsrev: LyricsRev,
      }));
    } catch (err) {
      console.error("Error saving progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleSubmitProject = async () => {
    try {
      setShowSubmitModal(false);
      setSubmittingProject(true);
      if (audioFile) {
        const formData = new FormData();
        formData.append("audio", audioFile);
        formData.append("songtitlerev", songTitleRev);
        formData.append("songcode", project.songcode);

        await axios.post(
          `${API_BASE}/api/projectsmanage/${id}/upload-audio`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          },
        );
      }
      const songartistEnd = new Date().toISOString(); // Save project fields
      await axios.put(
        `${API_BASE}/api/projectsmanage/${id}`,
        {
          songtitlerev: songTitleRev,
          lyricsrev: LyricsRev,
          songartist: user?.username,
          songartist_end: songartistEnd,
          status: "Queued for Quality Assurance",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      clearInterval(timerRef.current);
      setIsSubmitted(true);
      // Add log entry
      const logEntry = {
        timestamp: songartistEnd,
        actor: user?.username || "Unknown",
        message: "Submitted Song File for QA",
      };
      await axios.post(`${API_BASE}/api/projectsmanage/${id}/logs`, logEntry, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Add clockify record
      await axios.post(
        `${API_BASE}/api/clockify`,
        {
          resource: user?.username,
          service: "Song Creation",
          songcode: project.songcode,
          start: project.songartist_start,
          end: songartistEnd,
          hours_rendered:
            (new Date(songartistEnd) - new Date(project.songartist_start)) /
            (1000 * 60 * 60),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setShowSubmitModal(false);
      setShowAckModal(true);
    } catch (err) {
      console.error("Error submitting project:", err);
    } finally {
      setSubmittingProject(false);
    }
  };

  useEffect(() => {
    if (timeLeft === 0 && !isSubmitted && project) {
      const handleTimeout = async () => {
        // Revert project fields
        const timeoutLog = {
          timestamp: new Date().toISOString(),
          actor: "SYSTEM",
          message:
            "Song Artist process timed-out. Project placed back in to the Song Artist queue.",
        };

        try {
          await axios.put(
            `${API_BASE}/api/projectsmanage/${id}`,
            {
              songartist: null,
              songartist_start: null,
              status: "Queued for Song Artist",
              lock: { _id: null, user: null, timestamp: null },
            },
            { headers: { Authorization: `Bearer ${token}` } },
          );

          await axios.post(
            `${API_BASE}/api/projectsmanage/${id}/logs`,
            timeoutLog,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          // Show timeout modal
          setShowTimeoutModal(true); // new state we will create
        } catch (err) {
          console.error("Error handling timeout:", err);
        }
      };

      handleTimeout();
    }
  }, [timeLeft, isSubmitted, project]);

  if (loading || !configLoaded) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-10 z-50">
        {" "}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600"></div>{" "}
      </div>
    );
  }

  // Format timer as mm:ss
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Calculate percentage remaining
  const progressPercent = config
    ? (timeLeft / (config.saWorkMin * 60)) * 100
    : 0;

  //Audio file upload handlers
  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setFileError("Only audio files allowed");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setFileError("File must be ≤ 15MB");
      return;
    }

    setFileError("");
    setAudioFile(file);
    setAudioURL(URL.createObjectURL(file));
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioURL(null);
  };

  // Start Render here
  if (project && bit2 === "1") {
    return (
      <main className="max-w-4xl mx-auto p-6 font-montserrat">
        {/* Timer */}
        <div className="sticky top-0 z-50 bg-white mb-4 text-center py-2 shadow">
          {/* Timer text with conditional color */}
          <div
            className={`font-bold text-lg ${
              timeLeft <= 0.2 * config.saWorkMin * 60
                ? "text-red-700"
                : "text-green-700"
            }`}
          >
            Time Remaining: {formatTime(timeLeft)}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-300 rounded h-3 mt-2">
            <div
              className={`${
                timeLeft <= 0.2 * config.saWorkMin * 60
                  ? "bg-red-600"
                  : "bg-green-600"
              } h-3 rounded transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Signed in info */}
        <img
          src="/images/mylogo5.png"
          alt="Heart Prayer Music logo"
          loading="lazy"
          className="absolute top-1 left-5 w-32 md:w-40 lg:w-48 object-contain"
        />
        <div className="absolute top-1 right-5 text-xs text-sand-600 font-mono">
          {token && user && (
            <span className="text-olive-900 font-bold italic tracking-tight">
              Signed in as{" "}
              <span className="text-blue-900 roboto-condensed-forms">
                {user.username}
              </span>
            </span>
          )}
        </div>

        <h2
          className={`text-2xl font-bold mb-4 text-center ${currentTheme.header}`}
        >
          Song Artist Project: {project.songcode}
        </h2>

        {/* Song Details */}
        <div className={`${currentTheme.box}`}>
          <h3 className="text-lg font-semibold mb-4">Song Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <div>
              <span className="font-semibold text-red-900">Status:</span>{" "}
              {project.status}
            </div>
            <div>
              <span className="font-semibold text-red-900">
                Title and Lyrics by:
              </span>{" "}
              {project.lyricist}
            </div>
            <div>
              <span className="font-semibold text-red-900">
                Assigned Song Artist:
              </span>{" "}
              {project.songartist}
            </div>
            <div>{""}</div>
            <div>
              <span className="font-semibold text-red-900">Relation:</span>{" "}
              {project.relation}
            </div>
            <div>
              <span className="font-semibold text-red-900">Recipient:</span>{" "}
              {project.recipient}
            </div>
            <div>
              <span className="font-semibold text-red-900">Age Group:</span>{" "}
              {project.agegroup}
            </div>
            <div>
              <span className="font-semibold text-red-900">Qualities:</span>{" "}
              {project.qualities}
            </div>
            <div>
              <span className="font-semibold text-red-900">Moment:</span>{" "}
              {project.moment}
            </div>
            <div>
              <span className="font-semibold text-red-900">
                Special Message:
              </span>{" "}
              {project.specialmsg}
            </div>
            <div>
              <span className="font-semibold text-red-900">Genre:</span>{" "}
              {project.genre}
            </div>
            <div>
              <span className="font-semibold text-red-900">Voice:</span>{" "}
              {project.voice}
            </div>
            <div>
              <span className="font-semibold text-red-900">Order Date:</span>{" "}
              {project.createdAt
                ? new Date(project.createdAt).toLocaleDateString()
                : "N/A"}
            </div>
            <div>
              <span className="font-semibold text-red-900">Target Date:</span>{" "}
              {project.targetdate
                ? new Date(project.targetdate).toLocaleDateString()
                : "N/A"}
            </div>
            <div>
              <span className="font-semibold text-red-900">Song Title:</span>{" "}
              {project.songtitle}
            </div>
            <div></div>
            <div>
              <span className="font-semibold text-red-900">Lyrics:</span>{" "}
              {project.lyrics}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className={`${currentTheme.box}`}>
          <h3 className="text-lg font-semibold mb-2">Logs</h3>
          <div className="h-20 overflow-auto border-gray-400 border-2 p-2">
            <ul className="text-xs text-gray-700 font-mono mb-4">
              {project.logs.map((log, idx) => (
                <li key={idx}>
                  {new Date(log.timestamp).toLocaleString()} —{" "}
                  <strong>{log.actor}</strong>: {log.message}
                </li>
              ))}
            </ul>
          </div>
          <br />
          <div className="flex gap-2">
            <input
              type="text"
              value={newLogMessage}
              onChange={(e) => setNewLogMessage(e.target.value)}
              placeholder="Add a log message..."
              className="flex-1 border p-2 text-sm"
            />
            <button
              onClick={handleAddLog}
              className="bg-blue-600 text-sm text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Add Log
            </button>
          </div>
        </div>

        {/* Song Artist Workspace */}
        <div className={`${currentTheme.box}`}>
          <h3 className="text-lg font-semibold mb-2">Song Artist Workspace</h3>

          {/* NEW: Song Title */}
          <input
            type="text"
            value={songTitleRev}
            onChange={(e) => setSongTitleRev(e.target.value)}
            placeholder="Revise song title here..."
            className="w-full border p-2 mb-4"
          />

          <textarea
            type="text"
            value={LyricsRev}
            onChange={(e) => setLyricsRev(e.target.value)}
            className="w-full h-40 border p-2 text-sm"
            placeholder="Revise lyrics here..."
          />

          {/* Audio file upload */}
          <div className="mt-4">
            <label className="font-semibold text-sm">Upload Song Audio</label>

            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="block mt-2 text-sm"
            />

            {fileError && <p className="text-red-600 text-sm">{fileError}</p>}

            {audioURL && (
              <div className="mt-3">
                <audio controls src={audioURL} className="w-full" />

                <button
                  onClick={handleRemoveAudio}
                  className="bg-red-500 text-white px-3 py-1 text-sm mt-2 rounded"
                >
                  Remove Audio
                </button>
              </div>
            )}
          </div>

          {/* Save Progress */}
          <button
            onClick={handleSaveProgress}
            disabled={!songTitleRev && !LyricsRev}
            className={`relative inline-flex items-center justify-center text-sm mt-4 px-4 py-2 rounded ml-2 min-w-[140px] 
            ${
              !songTitleRev && !LyricsRev
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {savingProgress && (
              <span className="absolute left-4 animate-spin rounded-full w-4 h-4 border-t-2 border-white" />
            )}

            <span className={savingProgress ? "ml-6" : ""}>
              {savingProgress ? "Saving..." : "Save Progress"}
            </span>
          </button>
          {/* Submit Project */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={!audioFile}
            className={`relative inline-flex items-center justify-center text-sm mt-4 px-4 py-2 rounded ml-2 min-w-[140px] 
            ${
              !audioFile
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            {submittingProject && (
              <span className="absolute left-4 animate-spin rounded-full w-4 h-4 border-t-2 border-white" />
            )}

            <span className={submittingProject ? "ml-6" : ""}>
              {submittingProject ? "Submitting..." : "Submit Project"}
            </span>
          </button>

          {/* Submit Confirmation Modal */}
          {showSubmitModal && (
            <Modal
              onClose={() => setShowSubmitModal(false)}
              hideDefaultClose={true}
            >
              <h2>Confirm Submission:</h2>
              <p>
                Upon submission, the project will be queued for Quality
                Assurance. Are you sure you want to submit this project?
              </p>
              <div className="flex gap-4 mt-4 justify-center">
                <button
                  onClick={handleSubmitProject}
                  className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                  Yes, Submit
                </button>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </Modal>
          )}

          {/* Acknowledgment Modal */}
          {showAckModal && (
            <Modal
              onClose={() => {
                setShowAckModal(false);
                navigate("/workflow");
              }}
              hideDefaultClose={true}
            >
              <h2>Submission Successful</h2>
              <p>Your song recording has been submitted successfully.</p>
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowAckModal(false);
                    // setShowWarningModal(false);
                    navigate("/workflow");
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded mt-4 justify-center"
                >
                  Back to Workflow
                </button>
              </div>
            </Modal>
          )}

          {showTimeoutModal && (
            <Modal
              onClose={() => {
                setShowTimeoutModal(false);
                navigate("/workflow");
              }}
              hideDefaultClose={true}
            >
              <h2>Time Limit Exceeded</h2>
              <p>
                You have exceeded the allotted time to complete this project.
                This project has been placed back in to the Song Artist queue.
              </p>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    setShowTimeoutModal(false);
                    navigate("/workflow");
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded mt-4"
                >
                  Back to Workflow
                </button>
              </div>
            </Modal>
          )}
        </div>
      </main>
    );
  } else {
    return (
      <div>
        <Modal
          onClose={() => {
            navigate("/workflow");
          }}
          hideDefaultClose={true}
        >
          <h2>Sorry</h2>
          {bit2 !== "1" ? (
            <p>You are not authorized to perform this operation.</p>
          ) : (
            <p>
              Project not found or project is currently not available for Song
              Artist operation.
            </p>
          )}
          <div className="flex justify-center">
            <button
              onClick={() => {
                navigate("/workflow");
              }}
              className="bg-green-600 text-white px-4 py-2 rounded mt-4 justify-center"
            >
              Back to Workflow
            </button>
          </div>
        </Modal>
      </div>
    );
  }
}
