import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";

const API_BASE = process.env.REACT_APP_API_URL;

export default function AdminPending() {
  const [user, setUser] = useState(null);
  const [bit1, bit2, bit3, bit4, bit5, bit6] = user?.role || [];
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
          status: [
            "Queued for Admin Review and Action",
            "Admin Review in Progress",
          ],
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

  // Date Format

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
  const searchTerm = search.toLowerCase();

  const filtered = projects.filter(
    (p) =>
      (p.email || "").toLowerCase().includes(searchTerm) ||
      (p.status || "").toLowerCase().includes(searchTerm) ||
      (p.admin || "").toLowerCase().includes(searchTerm) ||
      (p.assessor || "").toLowerCase().includes(searchTerm) ||
      (p.songcode || "").toLowerCase().includes(searchTerm) ||
      (p.dispo || "").toLowerCase().includes(searchTerm) ||
      (p.songtitlerev?.trim() || p.songtitle || "")
        .toLowerCase()
        .includes(searchTerm),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  if (bit4 === "1") {
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
            PROJECTS FOR ADMIN REVIEW AND ACTION
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
            placeholder="Songcode, title, email, dispo, QA assessor..."
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
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Admin Reviewer</th>
                  <th className="p-2 border">Target Date</th>
                  <th className="p-2 border">QA Assessor</th>
                  <th className="p-2 border">QA Date</th>
                  <th className="p-2 border">QA Dispo</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => {
                  const url = `/songdetails/${p._id}`;
                  const canOpen =
                    !p.admin || p.admin === "" || p.admin === user?.username;

                  return (
                    <tr
                      key={p._id}
                      className={
                        canOpen
                          ? "cursor-pointer hover:bg-blue-900 hover:text-white"
                          : "opacity-50"
                      }
                      onClick={() => {
                        if (canOpen) navigate(url);
                      }}
                    >
                      <td className="p-2 border">{p.songcode}</td>
                      <td className="p-2 border">
                        {p.songtitlerev || p.songtitle}
                      </td>
                      <td className="p-2 border">{p.email}</td>
                      <td className="p-2 border">{p.status}</td>
                      <td className="p-2 border">{p.admin}</td>

                      <td className="p-2 border">
                        {new Date(p.targetdate).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">{p.assessor}</td>
                      <td className="p-2 border">
                        {new Date(p.assessor_end).toLocaleDateString()}
                      </td>
                      <td className="p-2 border">
                        <span
                          className={`p-2 border rounded text-white ${
                            p.dispo === "Approve"
                              ? "bg-green-600"
                              : "bg-red-500"
                          }`}
                        >
                          {p.dispo}
                        </span>
                      </td>
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
