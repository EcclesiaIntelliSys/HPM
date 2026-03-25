import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

const API_BASE = process.env.REACT_APP_API_URL;

export default function ArtistPending() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { token, logout } = useContext(AuthContext);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5; // rows per page

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
  const fetchProjects = async () => {
    try {
      const res = await api.get(`${API_BASE}/api/projectsmanage`, {
        params: {
          "lock.user": user?.username,
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
    if (user?.username) {
      fetchProjects();
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

  // Format createdAt
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${mm}${dd}${yy}-${hh}${min}${ss}`;
  };

  // Filter + paginate
  const filtered = projects.filter(
    (p) =>
      p.songcode.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase()) ||
      (p.songtitle && p.songtitle.toLowerCase().includes(search.toLowerCase())),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main>
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
        <h1 className="text-2xl font-bold text-center">
          WORK-IN-PROGRESS PROJECTS
        </h1>

        <button
          type="button"
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
            setPage(1);
          }}
          className="border p-2 rounded w-full mb-4"
        />

        {/* Table */}
        <div className="overflow-x-auto text-center">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Songcode</th>
                <th className="p-2 border">Song Title</th>
                <th className="p-2 border">Recipient</th>
                <th className="p-2 border">Relationship</th>
                <th className="p-2 border">Proj Status</th>
                <th className="p-2 border">WIP By</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => {
                // Determine role
                let role = null;
                if (p.status === "Lyricist - WIP") role = "lyricist";
                else if (p.status === "Song Artist - WIP") role = "songartist";
                else if (p.status === "Quality Assurance - WIP")
                  role = "qualityassurance";

                const url = role ? `/${role}/${p._id}` : "#";

                return (
                  <tr
                    key={p._id}
                    className={`${
                      role
                        ? "cursor-pointer hover:bg-blue-900 hover:text-white"
                        : ""
                    }`}
                    onClick={() => role && navigate(url)}
                  >
                    <td className="p-2 border">{p.songcode}</td>
                    <td className="p-2 border">
                      {p.songtitle || p.songtitlerev}
                    </td>
                    <td className="p-2 border">{p.recipient}</td>
                    <td className="p-2 border">{p.relation}</td>
                    <td className="p-2 border">{p.status}</td>
                    <td className="p-2 border">{p.lock?.user}</td>
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
