import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import Modal from "../components/Modal";
import io from "socket.io-client";

export default function WorkflowABC() {
  const [user, setUser] = useState(null);
  const [lyricistQueueCount, setLyricistQueueCount] = useState(0);
  const [showLyricistModal, setShowLyricistModal] = useState(false);
  const [selectedLyricistProject, setSelectedLyricistProject] = useState(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);
  const API_BASE = process.env.REACT_APP_API_URL;
  const [socket, setSocket] = useState(null);

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
    const newSocket = io(API_BASE, { withCredentials: true });
    setSocket(newSocket);

    // Listen for lyricist queue updates
    newSocket.on("lyricistQueueUpdated", (data) => {
      console.log("Queue update received:", data);
      setLyricistQueueCount(data.count);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [API_BASE]);

  // Fetch queue count
  useEffect(() => {
    const fetchLyricistQueueCount = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/projects/count?status=Queued for Lyricist`,
        );
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
      const res = await axios.post(`${API_BASE}/api/projects/assign-lyricist`, {
        username: user.username,
      });
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

  const boxClass =
    "p-4 bg-sand-50 shadow text-center hover:bg-green-200 focus:outline-none text-black";

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
          <h2 className="text-center font-semibold text-2xl mb-4 text-black">
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
              onClick={() => navigate("/workflow/b")}
              className={`${boxClass} ${bit2 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
            >
              <div className="text-lg font-bold ">Song Artist</div>
            </button>

            <button
              onClick={() => navigate("/workflow/c")}
              className={`${boxClass} ${bit3 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
            >
              <div className="text-lg font-bold">Quality Assurance</div>
            </button>
          </div>

          <br />
          <br />
        </div>
      )}
      {(bit4 === "1" || bit5 === "1" || bit6 === "1") && (
        <div>
          <h2 className="text-center font-semibold text-2xl mb-4 text-black">
            ADMIN WORKFLOW
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate("/projectmanage")}
              className={`${boxClass} ${bit4 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
            >
              <div className="text-lg font-bold">Projects Management</div>
            </button>
            <button
              onClick={() => navigate("/workflow/b")}
              className={`${boxClass} ${bit5 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
            >
              <div className="text-lg font-bold">Payroll</div>
            </button>
            <button
              onClick={() => navigate("/workflow/b")}
              className={`${boxClass} ${bit5 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
            >
              <div className="text-lg font-bold">Performance Mgt</div>
            </button>
            <button
              onClick={() => navigate("/vouchermanage")}
              className={`${boxClass} ${bit6 !== "1" ? "bg-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-300" : ""}`}
            >
              <div className="text-lg font-bold">Site Admin</div>
            </button>
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
            accept, you will need to complete the process within 20 minutes.
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
    </main>
  );
}
