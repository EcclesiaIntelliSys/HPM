import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Modal from "../components/Modal";
import api from "../api/api";
import Themes from "../components/Themes";
const currentTheme = Themes.qa;

export default function QualityassuranceProject() {
  const [user, setUser] = useState(null);
  const [bit1, bit2, bit3, bit4, bit5, bit6] = user?.role || [];
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [dispo, setDispo] = useState("");
  const [dispo_remarks, setDispo_remarks] = useState("");
  const timerRef = useRef(null);

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

  //states for audio file playback

  const [audioLoaded, setAudioLoaded] = useState(false);

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
    if (!project?.assessor_start || !config) return;

    const start = new Date(project.assessor_start).getTime();
    const limit = config.qaWorkMin * 60;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const remaining = limit - elapsed;
      setTimeLeft(Math.max(remaining, 0));
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [project?.assessor_start, config]);

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
          `${API_BASE}/api/projectsmanage/${id}/qaclaim`,
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
      setDispo(project.dispo || "");
      setDispo_remarks(project.dispo_remarks || "");
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
        { dispo, dispo_remarks },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setProject((prev) => ({
        ...prev,
        dispo,
        dispo_remarks,
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

      const assessorEnd = new Date().toISOString(); // Save project fields
      await axios.put(
        `${API_BASE}/api/projectsmanage/${id}`,
        {
          dispo,
          dispo_remarks,
          assessor: user?.username,
          assessor_end: assessorEnd,
          status: "Queued for Admin Review and Action",
          clearLock: true,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      clearInterval(timerRef.current);
      setIsSubmitted(true);
      // Add log entry
      const message =
        dispo === "Approve"
          ? `Song APPROVED (${dispo_remarks}). Submitted Assessment for Admin Review and Action`
          : `Song REJECTED (${dispo_remarks}). Submitted Assessment for Admin Review and Action`;

      const logEntry = {
        timestamp: assessorEnd,
        actor: user?.username || "Unknown",
        message,
      };
      await axios.post(`${API_BASE}/api/projectsmanage/${id}/logs`, logEntry, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Add clockify record
      await axios.post(
        `${API_BASE}/api/clockify`,
        {
          resource: user?.username,
          service: "Song Assessment",
          songcode: project.songcode,
          start: project.assessor_start,
          end: assessorEnd,
          hours_rendered:
            (new Date(assessorEnd) - new Date(project.assessor_start)) /
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
            "Quality Assurance process timed-out. Project placed back in to the Quality Assurance queue.",
        };

        try {
          await axios.put(
            `${API_BASE}/api/projectsmanage/${id}`,
            {
              assessor: null,
              assessor_start: null,
              status: "Queued for Quality Assurance",
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
    ? (timeLeft / (config.qaWorkMin * 60)) * 100
    : 0;

  // Consts and effects for Audio

  const R2_PUBLIC = process.env.REACT_APP_R2_PUBLIC_URL;

  const audioSrc = project?.filename
    ? `${R2_PUBLIC}/${encodeURIComponent(project.filename)}`
    : null;

  // Start Render here
  if (project && bit3 === "1") {
    return (
      <main className="max-w-4xl mx-auto p-6 font-montserrat">
        {/* Timer */}
        <div className="sticky top-0 z-50 bg-white mb-4 text-center py-2 shadow">
          {/* Timer text with conditional color */}
          <div
            className={`font-bold text-lg ${
              timeLeft <= 0.2 * config.qaWorkMin * 60
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
                timeLeft <= 0.2 * config.qaWorkMin * 60
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
          Quality Assurance Project: {project.songcode}
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
              <span className="font-semibold text-red-900">Qualities:</span>
              <br />{" "}
              <span className="whitespace-pre-wrap">{project.qualities}</span>
            </div>
            <div>
              <span className="font-semibold text-red-900">Moment:</span>
              <br />{" "}
              <span className="whitespace-pre-wrap">{project.moment}</span>
            </div>
            <div>
              <span className="font-semibold text-red-900">
                Special Message:
              </span>
              <br />{" "}
              <span className="whitespace-pre-wrap">{project.specialmsg}</span>
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
              <span className="font-semibold text-red-900">Lyrics:</span>
              <br />{" "}
              <span className="whitespace-pre-wrap">{project.lyrics}</span>
            </div>
            <div></div>
            <div>
              <span className="font-semibold text-red-900">
                Song Title (Revised):
              </span>{" "}
              {project.songtitlerev || "N/A"}
            </div>
            <div></div>
            <div>
              <span className="font-semibold text-red-900">
                Lyrics (Revised):
              </span>
              <br />{" "}
              <span className="whitespace-pre-wrap">
                {project.lyricsrev || "N/A"}
              </span>
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

        {/* Quality Assurance Workspace */}
        <div className={`${currentTheme.box}`}>
          <h3 className="text-lg font-semibold mb-2">
            Quality Assurance Workspace
          </h3>

          {/* Audio Playback */}
          <div className="mt-4">
            <label className="font-semibold">{project.filename}</label>

            {audioSrc && (
              <div className="mt-3">
                <audio
                  controls
                  src={audioSrc}
                  className="w-full"
                  onCanPlayThrough={() => setAudioLoaded(true)}
                />
              </div>
            )}
          </div>
          <hr />
          <br />
          <select
            value={dispo}
            onChange={(e) => setDispo(e.target.value)}
            className={`w-1/3 border p-2 mb-4 text-sm ${
              dispo === "Approve"
                ? "text-green-700"
                : dispo === "Reject"
                  ? "text-red-700"
                  : ""
            }`}
          >
            <option value="">Select Disposition</option>
            <option value="Approve">Approve</option>
            <option value="Reject">Reject</option>
          </select>

          <textarea
            type="text"
            value={dispo_remarks}
            onChange={(e) => setDispo_remarks(e.target.value)}
            className="w-full h-40 border p-2 text-sm"
            placeholder="Input Your Justification"
          />

          {/* Save Progress */}
          <button
            onClick={handleSaveProgress}
            disabled={!dispo && !dispo_remarks}
            className={`relative inline-flex items-center justify-center text-sm mt-4 px-4 py-2 rounded ml-2 min-w-[140px] 
            ${
              !dispo && !dispo_remarks
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
            disabled={!dispo || !dispo_remarks || !audioLoaded} // <-- add audioLoaded
            className={`relative inline-flex items-center justify-center text-sm mt-4 px-4 py-2 rounded ml-2 min-w-[140px] 
    ${
      !dispo || !dispo_remarks || !audioLoaded
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
                Upon submission, the project will be queued for Admin review and
                action. Are you sure you want to submit your assessment?
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
              <p>Your project assessment has been submitted successfully.</p>
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
                This project has been placed back in to the Quality Assurance
                queue.
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
          {bit3 !== "1" ? (
            <p>You are not authorized to perform this operation.</p>
          ) : (
            <p>
              Project not found or project is currently not available for
              Quality Assurance operation.
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
