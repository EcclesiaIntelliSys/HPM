import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Modal from "../components/Modal";
import api from "../api/api";
import Themes from "../components/Themes";
import axios from "axios";
const currentTheme = Themes.qa;

export default function SongDetails() {
  const [user, setUser] = useState(null);
  const [bit1, bit2, bit3, bit4, bit5, bit6] = user?.role || [];
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [project, setProject] = useState(null);
  const [dispo, setDispo] = useState("");
  const [dispo_remarks, setDispo_remarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [lockedInfo, setLockedInfo] = useState(false);
  const [config, setConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  const [newLogMessage, setNewLogMessage] = useState("");

  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const claimedRef = useRef(false);
  const [overrides, setOverrides] = useState({
    lyricist_ov: "",
    songartist_ov: "",
    assessor_ov: "",
  });

  const [action, setAction] = useState("");

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
        const res = await api.get(`${API_BASE}/api/projectsmanage/${id}`);

        setProject(res.data);

        setOverrides((prev) => ({
          ...prev,
          lyricist_ov:
            (
              (new Date(res.data.lyricist_end) -
                new Date(res.data.lyricist_start)) /
              (1000 * 60)
            ).toFixed(2) ?? "0.00",
          songartist_ov:
            (
              (new Date(res.data.songartist_end) -
                new Date(res.data.songartist_start)) /
              (1000 * 60)
            ).toFixed(2) ?? "0.00",
          assessor_ov:
            (
              (new Date(res.data.assessor_end) -
                new Date(res.data.assessor_start)) /
              (1000 * 60)
            ).toFixed(2) ?? "0.00",
        }));
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

  const handleSubmitProject = async () => {
    try {
      setShowSubmitModal(false);
      setSubmittingProject(true);

      const adminActionsMap = {
        send_to_customer: "Send Song to Customer",
        requeue_lyricist: "Requeue for Lyricist Action",
        requeue_songartist: "Requeue for Song Artist Action",
        requeue_qa: "Requeue for QA Action",
        admin_queue: "Place back to Admin Queue",
        cancel: "Cancel Project",
      };

      const statusMap = {
        send_to_customer: "Project Completed",
        requeue_lyricist: "Queued for Lyricist",
        requeue_songartist: "Queued for Song Artist",
        requeue_qa: "Queued for Quality Assurance",
        admin_queue: "Queued for Admin Review and Action",
        cancel: "Project Cancelled",
      };
      const status = statusMap[action];

      const adminActions = adminActionsMap[action] || "No action";

      const overrideMessages = [];

      if (parseFloat(overrides.lyricist_ov) !== lyricistTimeRendered) {
        overrideMessages.push("Revised time rendered for Lyricist.");
      }
      if (parseFloat(overrides.songartist_ov) !== songartistTimeRendered) {
        overrideMessages.push("Revised time rendered for Song Artist.");
      }
      if (parseFloat(overrides.assessor_ov) !== assessorTimeRendered) {
        overrideMessages.push("Revised time rendered for QA Assessor.");
      }

      const overrideMsg = overrideMessages.length
        ? " " + overrideMessages.join(" ")
        : "";

      const adminActionText = `${adminActions}${overrideMsg}`;

      const adminActionDate = new Date().toISOString();

      await axios.put(
        `${API_BASE}/api/projectsmanage/${id}`,
        {
          admin: user?.username,
          admin_action: adminActionText,
          admin_action_date: adminActionDate,
          status,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setIsSubmitted(true);
      // Add log entry
      const message = "Admin Actions: " + adminActionText;

      const logEntry = {
        timestamp: adminActionDate,
        actor: user?.username || "Unknown",
        message,
      };
      await axios.post(`${API_BASE}/api/projectsmanage/${id}/logs`, logEntry, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Modify clockify record
      await axios.put(
        `${API_BASE}/api/clockify/override`,
        {
          resource: project.lyricist,
          service: "Lyrics Creation",
          songcode: project.songcode,
          hours_rendered_override: parseFloat(overrides.lyricist_ov) / 60,
          reviewer: user?.username,
          reviewdate: adminActionDate,
          adminaction: adminActions,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await axios.put(
        `${API_BASE}/api/clockify/override`,
        {
          resource: project.songartist,
          service: "Song Creation",
          songcode: project.songcode,
          hours_rendered_override: parseFloat(overrides.songartist_ov / 60),
          reviewer: user?.username,
          reviewdate: adminActionDate,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      await axios.put(
        `${API_BASE}/api/clockify/override`,
        {
          resource: project.assessor,
          service: "Song Assessment",
          songcode: project.songcode,
          hours_rendered_override: parseFloat(overrides.assessor_ov / 60),
          reviewer: user?.username,
          reviewdate: adminActionDate,
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

  if (loading || !configLoaded) {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-10 z-50">
        {" "}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-600"></div>{" "}
      </div>
    );
  }

  // Consts and effects for Audio

  const R2_PUBLIC = process.env.REACT_APP_R2_PUBLIC_URL;

  const audioSrc = project?.filename
    ? `${R2_PUBLIC}/${encodeURIComponent(project.filename)}`
    : null;

  const lyricistTimeRendered =
    project.lyricist_start && project.lyricist_end
      ? (
          (new Date(project.lyricist_end) - new Date(project.lyricist_start)) /
          (1000 * 60)
        ).toFixed(2)
      : "N/A";

  const songartistTimeRendered =
    project.songartist_start && project.songartist_end
      ? (
          (new Date(project.songartist_end) -
            new Date(project.songartist_start)) /
          (1000 * 60)
        ).toFixed(2)
      : "N/A";

  const assessorTimeRendered =
    project.assessor_start && project.assessor_end
      ? (
          (new Date(project.assessor_end) - new Date(project.assessor_start)) /
          (1000 * 60)
        ).toFixed(2)
      : "N/A";

  // Start Render here
  if (project && bit4 === "1") {
    return (
      <main className="max-w-4xl mx-auto p-6 font-montserrat">
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
          Admin Review and Actions ( Song Code: {project.songcode} )
        </h2>

        {/* Song Details */}
        <div className={`${currentTheme.box}`}>
          <h3 className="text-lg font-semibold mb-4">Song Details </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800">
            <div>
              <span className="font-semibold text-red-900">Disposition:</span>{" "}
              <span
                className={`p-2 border rounded text-white text-xs ${
                  project.dispo === "Approve" ? "bg-green-600" : "bg-red-500"
                }`}
              >
                {project.dispo}
              </span>
            </div>
            <div>
              <span className="font-semibold text-red-900">
                Customer Email:
              </span>{" "}
              {project.email}
            </div>

            <div>
              <span className="font-semibold text-red-900">Status:</span>{" "}
              {project.status}
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

        {/* Workspace */}
        <div className={`${currentTheme.box}`}>
          <h3 className="text-lg font-semibold mb-2">Admin Actions</h3>
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
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border border-gray-400 border-separate border-spacing-0">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold text-red-900 border-b border-gray-300 border-r border-gray-400">
                    Resource
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-red-900 border-b border-gray-300 border-r border-gray-400">
                    Username
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-red-900 border-b border-gray-400 border-r border-gray-400">
                    Time Rendered (mins)
                  </th>
                  <th className="px-2 py-2 text-center font-semibold text-red-900 border-b border-gray-400">
                    Overrides
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1 text-left border-b border-gray-400 border-r border-gray-400">
                    Lyricist
                  </td>
                  <td className="px-2 py-1 text-center border-b border-gray-400 border-r border-gray-400">
                    {project.lyricist || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-center border-b border-gray-400 border-r border-gray-400">
                    {lyricistTimeRendered}
                  </td>
                  <td className="px-2 py-1 text-center border-b border-gray-400">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={overrides.lyricist_ov}
                      onChange={(e) =>
                        setOverrides({
                          ...overrides,
                          lyricist_ov: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) val = 0; // clamp negative or invalid to 0
                        setOverrides({
                          ...overrides,
                          lyricist_ov: val.toFixed(2),
                        });
                      }}
                      className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center"
                      placeholder="0.00"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="px-2 py-1 text-left border-b border-gray-400 border-r border-gray-400">
                    Song Artist
                  </td>
                  <td className="px-2 py-1 text-center border-b border-gray-400 border-r border-gray-400">
                    {project.songartist || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-center border-b border-gray-400 border-r border-gray-400">
                    {songartistTimeRendered}
                  </td>
                  <td className="px-2 py-1 text-center border-b border-gray-400">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={overrides.songartist_ov}
                      onChange={(e) =>
                        setOverrides({
                          ...overrides,
                          songartist_ov: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) val = 0; // clamp negative or invalid to 0
                        setOverrides({
                          ...overrides,
                          songartist_ov: val.toFixed(2),
                        });
                      }}
                      className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center"
                      placeholder="0.00"
                    />
                  </td>
                </tr>

                <tr>
                  <td className="px-2 py-1 text-left border-r border-gray-400">
                    QA Assessor
                  </td>
                  <td className="px-2 py-1 text-center border-r border-gray-400">
                    {project.assessor || "N/A"}
                  </td>
                  <td className="px-2 py-1 text-center border-r border-gray-400">
                    {assessorTimeRendered}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={overrides.assessor_ov}
                      onChange={(e) =>
                        setOverrides({
                          ...overrides,
                          assessor_ov: e.target.value,
                        })
                      }
                      onBlur={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val) || val < 0) val = 0; // clamp negative or invalid to 0
                        setOverrides({
                          ...overrides,
                          assessor_ov: val.toFixed(2),
                        });
                      }}
                      className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center"
                      placeholder="0.00"
                    />{" "}
                  </td>
                </tr>
              </tbody>{" "}
            </table>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-red-900 mb-1">
              Action
            </label>

            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="w-full md:w-1/2 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="">Select action...</option>
              <option value="send_to_customer">Send Song to Customer</option>
              <option value="requeue_lyricist">
                Requeue for Lyricist Action
              </option>
              <option value="requeue_songartist">
                Requeue for Song Artist Action
              </option>
              <option value="requeue_qa">Requeue for QA Action</option>
              <option value="admin_queue">Place back to Admin Queue</option>
              <option value="cancel">Cancel Project</option>
            </select>
          </div>
          {/* Submit Project */}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={!action}
            className={`relative inline-flex items-center justify-center text-sm mt-4 px-4 py-2 rounded min-w-[140px] 
    ${
      !action
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : "bg-purple-600 text-white hover:bg-purple-700"
    }`}
          >
            {submittingProject && (
              <span className="absolute left-4 animate-spin rounded-full w-4 h-4 border-t-2 border-white" />
            )}
            <span className={submittingProject ? "ml-6" : ""}>
              {submittingProject ? "Finalizing..." : "Finalize Action"}
            </span>
          </button>
          {/* Submit Confirmation Modal */}
          {showSubmitModal && (
            <Modal
              onClose={() => setShowSubmitModal(false)}
              hideDefaultClose={true}
            >
              <h2>
                <strong>Confirm Admin Action(s):</strong>
              </h2>
              <br />
              <p className="whitespace-pre-line">
                {action === "send_to_customer" &&
                  `√  You have opted to send this song to ${project.email}.\n\n`}
                {action === "requeue_lyricist" &&
                  "√  You have opted to requeue this song for Lyricist Action.\n\n"}
                {action === "requeue_songartist" &&
                  "√  You have opted to requeue this song for Song Artist Action.\n\n"}
                {action === "requeue_qa" &&
                  "√  You have opted to requeue this song for Q/A Action.\n\n"}
                {action === "admin_queue" &&
                  "√  You have opted to place this song back to the Admin Queue.\n\n"}
                {action === "cancel" &&
                  "√  You are cancelling this Project.\n\n"}

                {overrides.lyricist_ov &&
                  overrides.lyricist_ov !== lyricistTimeRendered &&
                  `√  You revised the Lyricist Time Rendered from ${lyricistTimeRendered} minutes to ${overrides.lyricist_ov} minutes.\n\n`}
                {overrides.songartist_ov &&
                  overrides.songartist_ov !== songartistTimeRendered &&
                  `√  You revised the Song Artist Time Rendered from ${songartistTimeRendered} minutes to ${overrides.songartist_ov} minutes.\n\n`}
                {overrides.assessor_ov &&
                  overrides.assessor_ov !== assessorTimeRendered &&
                  `√  You revised the QA Assessor Time Rendered from ${assessorTimeRendered} minutes to ${overrides.assessor_ov} minutes.\n`}
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
              <h2>Admin Action Successful</h2>
              <p>Your admin actions have been performed and recorded.</p>
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
