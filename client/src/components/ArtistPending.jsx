import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

export default function ArtistPending() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const { token, logout } = useContext(AuthContext);

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }
  }, [token]);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5; // ✅ number of rows per page

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`${API_BASE}/api/projectsmanage`, {
        params: {
          "lock.user": user.username,
          status_contains: "WIP",
        },
      });
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProjects();
  }, []);

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
        {" "}
        <div className="spinner"></div>{" "}
      </div>
    );
  }

  // Filter + paginate
  const filtered = projects.filter(
    (p) =>
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.songcode.toLowerCase().includes(search.toLowerCase()) ||
      p.recipient.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Label mapping

  return (
    <main>
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
      <div className="p-6 space-y-6 text-sm font-mono">
        <h1 className="text-2xl font-bold text-center">
          WORK-IN-PROGRESS PROJECTS
        </h1>

        {/* Search bar */}
        <button
          type="submit"
          onClick={() => navigate("/workflow")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto mt-2"
        >
          Back to Workflow
        </button>
        <input
          type="text"
          placeholder="Status, songcode, or title..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // reset to first page on search
          }}
          className="border p-2 rounded w-full mb-4"
        />

        {/* Table */}

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
