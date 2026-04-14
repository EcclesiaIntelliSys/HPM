import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import Modal from "../components/Modal";
import Themes from "../components/Themes";
const currentTheme = Themes.qa;

const API_BASE = process.env.REACT_APP_API_URL;

export default function ArtistClockify() {
  const [user, setUser] = useState(null);
  const [bit1, bit2, bit3, bit4, bit5, bit6] = user?.role || [];
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);

  const [clockifyItems, setClockifyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payFilter, setPayFilter] = useState(""); // "", "settled", "unpaid"
  const [resourceFilter, setResourceFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const R2_PUBLIC = process.env.REACT_APP_R2_PUBLIC_URL;

  const audioSrc = selectedProject?.filename
    ? `${R2_PUBLIC}/${encodeURIComponent(selectedProject.filename)}`
    : null;

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

  // Fetch projects
  const fetchClockifyItems = async () => {
    try {
      const res = await api.get(`${API_BASE}/api/clockify`, {
        params: {
          resource: user?.username,
        },
      });
      setClockifyItems(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      fetchClockifyItems();
    }
  }, [user?.username]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  // Format for dates
  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleString(undefined, {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Filter + paginate
  const filtered = clockifyItems.filter((p) => {
    const matchesSearch =
      p.resource.toLowerCase().includes(search.toLowerCase()) ||
      p.service.toLowerCase().includes(search.toLowerCase()) ||
      p.songcode.toLowerCase().includes(search.toLowerCase());

    const matchesResource =
      !resourceFilter ||
      p.resource.toLowerCase().includes(resourceFilter.toLowerCase());

    const endDate = p.end ? new Date(p.end) : null;

    const matchesFrom = !dateFrom || (endDate && endDate >= new Date(dateFrom));

    const matchesTo =
      !dateTo || (endDate && endDate <= new Date(dateTo + "T23:59:59"));

    const matchesPay =
      !payFilter ||
      (payFilter === "settled" && p.payflag === true) ||
      (payFilter === "unpaid" && p.payflag === false);

    return (
      matchesSearch && matchesResource && matchesFrom && matchesTo && matchesPay
    );
  });

  // 2. Compute summary AFTER filtered is ready
  const totalFilteredHours = filtered.reduce((sum, p) => {
    const hours =
      p.hours_rendered_override != null
        ? Number(p.hours_rendered_override)
        : Number(p.hours_rendered);
    return sum + hours;
  }, 0);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleRowClick = async (songcode) => {
    try {
      const res = await api.get(
        `${API_BASE}/api/projects/songcode/${songcode}`,
      );

      setSelectedProject(res.data);
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching project:", err);
    }
  };

  if (bit1 === "1" || bit2 === "1" || bit3 === "1") {
    return (
      <main>
        {showModal && selectedProject && (
          <Modal
            title={`Project Details - ${selectedProject.songcode}`}
            onClose={() => {
              setShowModal(false);
              setSelectedProject(null);
            }}
          >
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 gap-4 text-sm text-gray-800">
                <div>
                  <span className="font-semibold text-red-900">Status:</span>{" "}
                  {selectedProject.status}
                </div>

                <div>
                  <span className="font-semibold text-red-900">Relation:</span>{" "}
                  {selectedProject.relation}
                </div>
                <div>
                  <span className="font-semibold text-red-900">Recipient:</span>{" "}
                  {selectedProject.recipient}
                </div>
                <div>
                  <span className="font-semibold text-red-900">Age Group:</span>{" "}
                  {selectedProject.agegroup}
                </div>
                <div>
                  <span className="font-semibold text-red-900">Qualities:</span>
                  <br />{" "}
                  <span className="whitespace-pre-wrap">
                    {selectedProject.qualities}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-red-900">Moment:</span>
                  <br />{" "}
                  <span className="whitespace-pre-wrap">
                    {selectedProject.moment}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Special Message:
                  </span>
                  <br />{" "}
                  <span className="whitespace-pre-wrap">
                    {selectedProject.specialmsg}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-red-900">Genre:</span>{" "}
                  {selectedProject.genre}
                </div>
                <div>
                  <span className="font-semibold text-red-900">Voice:</span>{" "}
                  {selectedProject.voice}
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Order Date:
                  </span>{" "}
                  {selectedProject.createdAt
                    ? new Date(selectedProject.createdAt).toLocaleDateString()
                    : "N/A"}
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Target Date:
                  </span>{" "}
                  {selectedProject.targetdate
                    ? new Date(selectedProject.targetdate).toLocaleDateString()
                    : "N/A"}
                </div>
                <hr />
                <div>
                  <span className="font-semibold text-red-900">
                    Song Title:
                  </span>{" "}
                  {selectedProject.songtitle}
                </div>
                <div>
                  <span className="font-semibold text-red-900">Lyrics:</span>
                  <br />{" "}
                  <span className="whitespace-pre-wrap">
                    {selectedProject.lyrics}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Song Title (Revised):
                  </span>{" "}
                  {selectedProject.songtitlerev || "N/A"}
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Lyrics (Revised):
                  </span>
                  <br />{" "}
                  <span className="whitespace-pre-wrap">
                    {selectedProject.lyricsrev || "N/A"}
                  </span>
                </div>
                <hr />
                <div>
                  <span className="font-semibold text-red-900">Lyricist:</span>{" "}
                  {selectedProject.lyricist}
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Song Artist:
                  </span>{" "}
                  {selectedProject.songartist}
                </div>
                <div>
                  <span className="font-semibold text-red-900">QA:</span>{" "}
                  {selectedProject.assessor}
                </div>
                <div>
                  <span className="font-semibold text-red-900">Dispo:</span>{" "}
                  {selectedProject.dispo}
                </div>
                <div>
                  <span className="font-semibold text-red-900">
                    Dispo-Remarks:
                  </span>{" "}
                  {selectedProject.dispo_remarks}
                </div>
              </div>
            </div>
            <br />
            <hr />
            <br />

            {/* Logs */}
            <strong>Log Entries</strong>
            <div className={`${currentTheme.box} space-y-4 text-xs`}>
              {selectedProject.logs.map((log, index) => (
                <div key={index}>
                  <div className="space-y-1">
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    <p>
                      <strong>By:</strong> {log.actor}
                    </p>
                    <p>
                      <strong>Message:</strong> {log.message}
                    </p>
                  </div>

                  {index !== selectedProject.logs.length - 1 && (
                    <hr className="border-gray-300 mt-4" />
                  )}
                </div>
              ))}
            </div>

            {/* Quality Assurance Workspace */}
            <div className={`${currentTheme.box}`}>
              {/* Audio Playback */}
              <div className="mt-4">
                <label className="font-semibold">
                  {selectedProject.filename}
                </label>

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
            </div>
          </Modal>
        )}
        <img
          src="/images/mylogo5.png"
          alt="Heart Prayer Music logo"
          loading="lazy"
          className="absolute top-1 left-5 w-32 md:w-40 lg:w-48 object-contain"
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

        <div className="p-6 space-y-6 text-sm font-mono">
          <h1 className="text-2xl font-bold text-center">CLOCKIFY RECORD</h1>

          <button
            type="button"
            onClick={() => navigate("/workflow")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto mt-2"
          >
            Back to Workflow
          </button>

          {/* Listing Parameters Section */}

          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 mt-4 p-2 bg-terra-50">
            {/* Left side: filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold">Display</label>
                {/* Rows dropdown */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border p-2 rounded"
                >
                  <option value={5}>5 rows</option>
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>
              {/* Date From */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPage(1);
                  }}
                  className="border p-2 rounded"
                />
              </div>

              {/* Date To */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPage(1);
                  }}
                  className="border p-2 rounded"
                />
              </div>

              {/* Paid Status */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold">Payment Status</label>
                <select
                  value={payFilter}
                  onChange={(e) => {
                    setPayFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border p-2 rounded"
                >
                  <option value="">All</option>
                  <option value="settled">Settled</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              {/* Resource Username */}
              <div className="flex flex-col items-center">
                <label className="text-xs font-semibold">Resource</label>
                <input
                  type="text"
                  placeholder="Enter username..."
                  value={resourceFilter}
                  onChange={(e) => {
                    setResourceFilter(e.target.value);
                    setPage(1);
                  }}
                  className="border p-2 rounded"
                />
              </div>
            </div>

            {/* Right side: summary */}
            <div className="flex flex-col items-start lg:items-end text-sm font-mono gap-1">
              <span>
                <strong>Records Found:</strong> {filtered.length}
              </span>
              <span>
                <strong>Total Time Rendered (Hrs):</strong>{" "}
                {totalFilteredHours.toFixed(3)}
              </span>
              <span>
                <strong>Total Time Rendered (Mins):</strong>{" "}
                {(totalFilteredHours * 60).toFixed(3)}
              </span>
            </div>
          </div>
          {/* End - Listing Parameters Section */}

          <input
            type="text"
            placeholder="Resource, service, or songcode..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="border p-2 rounded w-full mb-4"
          />

          {/* Table */}
          <div className="overflow-x-auto text-center">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Resource Name</th>
                  <th className="p-2 border">Service</th>
                  <th className="p-2 border">Song Code</th>
                  <th className="p-2 border">Attempt</th>
                  <th className="p-2 border">Start</th>
                  <th className="p-2 border">End</th>
                  <th className="p-2 border">Minutes (Calculated)</th>
                  <th className="p-2 border">Minutes (Final)</th>
                  <th className="p-2 border">Admin by:</th>
                  <th className="p-2 border">Admin Action:</th>
                  <th className="p-2 border">Admin Date:</th>
                  <th className="p-2 border">Paid?</th>
                  <th className="p-2 border">Txn Ref</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  // const url = `/projectdetails/${p._id}`;

                  return (
                    <tr
                      key={p._id}
                      className="cursor-pointer hover:bg-blue-900 hover:text-white"
                      onClick={() => handleRowClick(p.songcode)}
                    >
                      <td className="p-2 border">{p.resource}</td>
                      <td className="p-2 border">{p.service}</td>
                      <td className="p-2 border">{p.songcode}</td>
                      <td className="p-2 border">{p.attempt}</td>
                      <td className="p-2 border">{formatDate(p.start)}</td>
                      <td className="p-2 border">{formatDate(p.end)}</td>
                      <td className="p-2 border">
                        {p.hours_rendered != null
                          ? Number(p.hours_rendered * 60).toFixed(3)
                          : ""}
                      </td>
                      <td className="p-2 border">
                        {p.hours_rendered_override != null
                          ? Number(p.hours_rendered_override * 60).toFixed(3)
                          : Number(p.hours_rendered * 60).toFixed(3)}
                      </td>
                      <td className="p-2 border">{p.reviewer}</td>
                      <td className="p-2 border">{p.adminaction}</td>
                      <td className="p-2 border">{formatDate(p.reviewdate)}</td>
                      <td className="p-2 border">
                        <span
                          className={`px-2 py-1 rounded text-white ${
                            p.payflag ? "bg-green-600" : "bg-amber-500"
                          }`}
                        >
                          {p.payflag ? "Settled" : "Unpaid"}
                        </span>
                      </td>
                      <td className="p-2 border">{p.txnref}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className={`px-3 py-1 rounded ${
                  page === 1
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Prev
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className={`px-3 py-1 rounded ${
                  page === totalPages
                    ? "bg-gray-200 text-gray-500"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
