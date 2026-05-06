import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
// import axios from "axios";
import api from "../api/api";
import Modal from "../components/Modal";
// import io from "socket.io-client";
import { useSocket } from "../context/SocketContext";

export default function WorkflowABC() {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  //States for Lyricist
  const [lyricistQueueCount, setLyricistQueueCount] = useState(0);
  const [showLyricistModal, setShowLyricistModal] = useState(false);
  const [selectedLyricistProject, setSelectedLyricistProject] = useState(null);

  //States for Song Artist
  const [saQueueCount, setSAQueueCount] = useState(0);
  const [showSAModal, setShowSAModal] = useState(false);
  const [selectedSAProject, setSelectedSAProject] = useState(null);

  //States for Quality Assurance
  const [qaQueueCount, setQAQueueCount] = useState(0);
  const [showQAModal, setShowQAModal] = useState(false);
  const [selectedQAProject, setSelectedQAProject] = useState(null);

  //Generic states for Artists
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [clockifyQueueCount, setClockifyQueueCount] = useState(0);
  const [clockifyPaidQueueCount, setClockifyPaidQueueCount] = useState(0);

  //States for Admin4
  const [pendingAdminQueueCount, setPendingAdminQueueCount] = useState(0);

  const [showSpinner, setShowSpinner] = useState(false);
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL;
  // const [socket, setSocket] = useState(null);
  const socket = useSocket();

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

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }
  }, [token]);

  // Connect to Socket.IO on mount

  useEffect(() => {
    if (!socket) return;

    const handleLyricistQueue = (data) => {
      // console.log("Lyricist queue update received:", data);
      setLyricistQueueCount(data.count);
    };

    const handleSAQueue = (data) => {
      // console.log("Song Artist queue update received:", data);
      setSAQueueCount(data.count);
    };

    const handleQAQueue = (data) => {
      // console.log("Quality Assessor queue update received:", data);
      setQAQueueCount(data.count);
    };

    const handlePendingQueue = (data) => {
      // console.log("Pending projects queue update received:", data);
      setPendingQueueCount(data.count);
      setPendingAdminQueueCount(data.countAdmin);
      setClockifyQueueCount(data.countClockify);
      setClockifyPaidQueueCount(data.countClockifyPaid);
    };

    socket.on("lyricistQueueUpdated", handleLyricistQueue);
    socket.on("saQueueUpdated", handleSAQueue);
    socket.on("qaQueueUpdated", handleQAQueue);
    socket.on("pendingQueueUpdated", handlePendingQueue);

    return () => {
      socket.off("lyricistQueueUpdated", handleLyricistQueue);
      socket.off("saQueueUpdated", handleSAQueue);
      socket.off("qaQueueUpdated", handleQAQueue);
      socket.off("pendingQueueUpdated", handlePendingQueue);
    };
  }, [socket]);

  // Lyricist Effects
  // Fetch queue count
  useEffect(() => {
    const fetchLyricistQueueCount = async () => {
      try {
        const res = await api.get(`${API_BASE}/api/projectsmanage/count`, {
          params: {
            status: "Queued for Lyricist",
          },
        });

        setLyricistQueueCount(res.data.count);
      } catch (err) {
        console.error("Error fetching queue count:", err);
      }
    };
    fetchLyricistQueueCount();
  }, [API_BASE]);
  const handleLyricistClick = () => {
    if (lyricistQueueCount > 0) {
      setShowLyricistModal(true);
    }
  };
  const handleLyricistAgree = async () => {
    try {
      setShowSpinner(true);
      // Assign first project in queue
      const res = await api.post(
        `${API_BASE}/api/projectsmanage/assign-lyricist`,
        {
          username: user.username,
        },
      );
      setSelectedLyricistProject(res.data.project);
      // Navigate to Lyricist Project component with project details
      navigate(`/lyricist/${res.data.project._id}`);
    } catch (err) {
      console.error("Error assigning project:", err);
    } finally {
      setShowSpinner(false);
      setShowLyricistModal(false);
    }
  };
  const handleLyricistCancel = () => {
    setShowLyricistModal(false);
  };

  // Song Artist Effects
  // Fetch queue count
  useEffect(() => {
    const fetchSAQueueCount = async () => {
      try {
        const res = await api.get(`${API_BASE}/api/projectsmanage/count`, {
          params: {
            status: "Queued for Song Artist",
          },
        });
        setSAQueueCount(res.data.count);
      } catch (err) {
        console.error("Error fetching queue count:", err);
      }
    };
    fetchSAQueueCount();
  }, [API_BASE]);

  const handleSAClick = () => {
    if (saQueueCount > 0) {
      setShowSAModal(true);
    }
  };
  const handleSAAgree = async () => {
    try {
      setShowSpinner(true);
      // Assign first project in queue
      const res = await api.post(`${API_BASE}/api/projectsmanage/assign-sa`, {
        username: user.username,
      });
      setSelectedSAProject(res.data.project);
      // Navigate to Song Artist Project component with project details
      navigate(`/songartist/${res.data.project._id}`);
    } catch (err) {
      console.error("Error assigning project:", err);
    } finally {
      setShowSpinner(false);
      setShowSAModal(false);
    }
  };
  const handleSACancel = () => {
    setShowSAModal(false);
  };

  // Quality Assurance Effects
  // Fetch queue count
  useEffect(() => {
    const fetchQAQueueCount = async () => {
      try {
        const res = await api.get(`${API_BASE}/api/projectsmanage/count`, {
          params: {
            status: "Queued for Quality Assurance",
          },
        });
        setQAQueueCount(res.data.count);
      } catch (err) {
        console.error("Error fetching queue count:", err);
      }
    };
    fetchQAQueueCount();
  }, [API_BASE]);

  const handleQAClick = () => {
    if (qaQueueCount > 0) {
      setShowQAModal(true);
    }
  };
  const handleQAAgree = async () => {
    try {
      setShowSpinner(true);
      // Assign first project in queue
      const res = await api.post(`${API_BASE}/api/projectsmanage/assign-qa`, {
        username: user.username,
      });
      setSelectedQAProject(res.data.project);
      // Navigate to Quality Assurance Project component with project details
      navigate(`/qualityassurance/${res.data.project._id}`);
    } catch (err) {
      console.error("Error assigning project:", err);
    } finally {
      setShowSpinner(false);
      setShowQAModal(false);
    }
  };
  const handleQACancel = () => {
    setShowQAModal(false);
  };

  // Generic Artist Effects
  // Fetch Pending queue count
  useEffect(() => {
    const fetchPendingQueueCount = async () => {
      try {
        // console.log(
        //   `Fetching pending count for ${user?.username} (current: ${pendingQueueCount})`,
        // );

        const res = await api.get(
          `${API_BASE}/api/projectsmanage/countPendingByuser`,
          {
            params: {
              "lock.user": user?.username,
              status_contains: "WIP",
            },
          },
        );

        setPendingQueueCount(res.data.count);
        setPendingAdminQueueCount(res.data.countAdmin);
        setClockifyQueueCount(res.data.countClockify);
        setClockifyPaidQueueCount(res.data.countClockifyPaid);
      } catch (err) {
        console.error("Error fetching queue count:", err);
      }
    };

    if (user?.username) {
      fetchPendingQueueCount();
    }
  }, [API_BASE, user?.username]);

  const boxClass =
    "p-4 bg-sand-50 shadow-2xl text-center hover:bg-green-200 focus:outline-none text-black border-black border";

  const [bit1, bit2, bit3, bit4, bit5, bit6] = user?.role || [];
  // console.log(
  //   bit1 + "-" + bit2 + "-" + bit3 + "-" + bit4 + "-" + bit5 + "-" + bit6,
  // );

  return (
    <main className="max-w-6xl mx-auto p-6 relative carrois-gothic-sc-regular">
      {/* Signed in info in upper left logo */}
      <img
        src="/images/mylogo5.png"
        alt="Heart Prayer Music logo"
        loading="lazy"
        className="absolute top-1 left-5 w-32 md:w-40 lg:w-48 object-contain "
      />
      <div className="absolute top-1 right-5 text-xs text-sand-600 font-mono">
        {token && (
          <div className="flex items-center gap-2 mb-4">
            {user && (
              <span className="text-olive-900 font-bold italic tracking-tight">
                Signed in as{" "}
                <span className="text-blue-900 roboto-condensed-forms">
                  {user.username}
                </span>
              </span>
            )}
            <button
              onClick={logout}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <br></br>
      <br></br>
      {(bit1 === "1" || bit2 === "1" || bit3 === "1") && (
        <div>
          <h2 className="text-center font-semibold text-2xl mb-4 text-white bg-blue-800 rounded-xl">
            CREATIVES WORKFLOW
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleLyricistClick}
              className={`${boxClass} ${bit1 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              disabled={bit1 !== "1" || lyricistQueueCount === 0}
            >
              <div className="text-lg font-bold ">Lyricist</div>
              <div className="text-sm">
                {lyricistQueueCount} projects in queue
              </div>
            </button>

            <button
              onClick={handleSAClick}
              className={`${boxClass} ${bit1 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              disabled={bit2 !== "1" || saQueueCount === 0}
            >
              <div className="text-lg font-bold ">Song Artist</div>
              <div className="text-sm">{saQueueCount} projects in queue</div>
            </button>

            <button
              onClick={handleQAClick}
              className={`${boxClass} ${bit1 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              disabled={bit3 !== "1" || qaQueueCount === 0}
            >
              <div className="text-lg font-bold ">Quality Assurance</div>
              <div className="text-sm">{qaQueueCount} projects in queue</div>
            </button>
          </div>

          <br />
          <br />

          <h2 className="text-center font-semibold text-2xl mb-4 text-white bg-blue-800 rounded-xl">
            MY PORTFOLIO
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/artistpending")}
              className={`${boxClass} ${bit1 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              disabled={pendingQueueCount === 0}
            >
              <div className="text-lg font-bold ">Work-In-Progress</div>
              <div className="text-sm">
                {pendingQueueCount} projects in progress
              </div>
            </button>

            <button
              onClick={() => navigate("/artistclockify")}
              className={`${boxClass} ${bit1 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              disabled={clockifyQueueCount === 0}
            >
              <div className="text-lg font-bold ">CLOCKIFY</div>
              <div className="text-sm">
                {clockifyQueueCount} tasks completed
              </div>
              <div className="text-sm">{clockifyPaidQueueCount} tasks paid</div>
            </button>
          </div>

          <br />
          <br />
        </div>
      )}
      {(bit4 === "1" || bit5 === "1" || bit6 === "1") && (
        <div>
          <h2 className="text-center font-semibold text-2xl mb-4 text-white bg-blue-800 rounded-xl">
            ADMIN WORKFLOW
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bit4 === "1" && (
              <button
                onClick={() => navigate("/adminpending")}
                className={`${boxClass} ${bit4 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
                disabled={pendingAdminQueueCount === 0}
              >
                <div className="text-lg font-bold ">Song Administration</div>
                <div className="text-sm">
                  {pendingAdminQueueCount} projects pending admin action
                </div>
              </button>
            )}
            {bit6 === "1" && (
              <button
                onClick={() => navigate("/projectmanage")}
                className={`${boxClass} ${bit6 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              >
                <div className="text-lg font-bold">Projects Monitoring</div>
              </button>
            )}
            {bit5 === "1" && (
              <button
                onClick={() => navigate("#")}
                className={`${boxClass} ${bit5 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              >
                <div className="text-lg font-bold">Payroll</div>
              </button>
            )}
            {bit5 === "1" && (
              <button
                onClick={() => navigate("#")}
                className={`${boxClass} ${bit5 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              >
                <div className="text-lg font-bold">Performance Mgt</div>
              </button>
            )}
            {bit6 === "1" && (
              <button
                onClick={() => navigate("/vouchermanage")}
                className={`${boxClass} ${bit6 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
              >
                <div className="text-lg font-bold">Voucher Management</div>
              </button>
            )}
          </div>
        </div>
      )}
      ;
      {showLyricistModal && (
        <Modal onClose={handleLyricistCancel} hideDefaultClose={true}>
          <h2 className="font-black text-center">Reminder for Lyricist</h2>
          <br />
          <p>
            A custom song project will be auto-selected for you. Should you
            accept, you will need to complete the process within{" "}
            <strong>{config.lyricistWorkMin} minutes</strong>.
          </p>
          <br />
          <p>
            If this time limit is exceeded due to any reason, the project will
            be placed back in to the queue and the time you spent woking on the
            project will not be credited to your Work-hours Rendered (WR).
          </p>
          <br />
          <p>
            Make sure you have a stable internet connection and your setup is
            not susceptible to power interruptions.
          </p>
          <br />
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleLyricistAgree}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {showSpinner && (
                <span className="absolute left-4 animate-spin rounded-full w-4 h-4 border-t-2 border-white" />
              )}

              <span className={showSpinner ? "ml-6" : ""}>
                {showSpinner ? "Selecting.." : "Agree"}
              </span>
            </button>
            <button
              onClick={handleLyricistCancel}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {showSAModal && (
        <Modal onClose={handleSACancel} hideDefaultClose={true}>
          <h2 className="font-black text-center">Reminder for Song Artist</h2>
          <br />
          <p>
            A lyricist-processed song project will be auto-selected for you.
            Should you accept, you will need to complete the process within{" "}
            <strong>{config.saWorkMin} minutes</strong>.
          </p>
          <br />
          <p>
            If this time limit is exceeded due to any reason, the project will
            be placed back in to the queue and the time you spent woking on the
            project will not be credited to your Work-hours Rendered (WR).
          </p>
          <br />
          <p>
            Make sure you have a stable internet connection and your setup is
            not susceptible to power interruptions.
          </p>
          <br />
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleSAAgree}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {showSpinner && (
                <span className="absolute left-4 animate-spin rounded-full w-4 h-4 border-t-2 border-white" />
              )}

              <span className={showSpinner ? "ml-6" : ""}>
                {showSpinner ? "Selecting.." : "Agree"}
              </span>
            </button>
            <button
              onClick={handleSACancel}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {showQAModal && (
        <Modal onClose={handleQACancel} hideDefaultClose={true}>
          <h2 className="font-black text-center">Reminder for QA Assessors</h2>
          <br />
          <p>
            A song artist crafted a song and we will auto-select it for your
            assessment. Should you accept, you will need to complete the process
            within <strong>{config.qaWorkMin} minutes</strong>.
          </p>
          <br />
          <p>
            If this time limit is exceeded due to any reason, the project will
            be placed back in to the queue and the time you spent woking on the
            project will not be credited to your Work-hours Rendered (WR).
          </p>
          <br />
          <p>
            Make sure you have a stable internet connection and your setup is
            not susceptible to power interruptions.
          </p>
          <br />
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={handleQAAgree}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {showSpinner && (
                <span className="absolute left-4 animate-spin rounded-full w-4 h-4 border-t-2 border-white" />
              )}

              <span className={showSpinner ? "ml-6" : ""}>
                {showSpinner ? "Selecting.." : "Agree"}
              </span>
            </button>
            <button
              onClick={handleQACancel}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
