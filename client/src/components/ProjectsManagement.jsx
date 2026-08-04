import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

export default function ProjectsManagement() {
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
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5; // ✅ number of rows per page

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
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

  const formatDateTimeLocal = (date) => {
    if (!date) return "";

    const d = new Date(date);
    const offset = d.getTimezoneOffset();

    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  // Save edits
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/projects/${selected._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      const updated = projects.map((p) => (p._id === selected._id ? data : p));
      setProjects(updated);
      setSelected(data);
      setEditing(false);
    } catch (err) {
      console.error("Error updating project:", err);
    }
  };

  // Filter + paginate
  const filtered = projects.filter(
    (p) =>
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.songcode.toLowerCase().includes(search.toLowerCase()) ||
      p.recipient.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Label mapping
  const LABELS = {
    relation: "Relationship",
    recipient: "Song Recipient",
    agegroup: "Age Group",
    genre: "Musical Style",
    voice: "Preferred Voice",
    email: "Email Address",
    ack: "TOS & PP Accepted",
    status: "Project Status",
    voucherNo: "Voucher Code",
    createdAt: "Order Date",
    songcode: "Song Code",
    qualities: "Standout Qualities",
    moment: "Special Moment",
    specialmsg: "Special Message",
    targetdate: "Target Date",
    deliverydate: "Delivery Date",
    paymentStatus: "Payment Status",
    amount: "Amount(USD)",
    addons: "Add-On Options",
  };

  // Field groups
  const FIELD_GROUPS = [
    ["relation", "recipient", "agegroup"], // row 1
    ["genre", "voice", "email"], // row 2
    ["ack", "status", "voucherNo"], // row 3
    ["createdAt", "targetdate", "deliverydate"], // row 4
    ["paymentStatus", "amount", "addons"], // row 4
    ["qualities"], // row 5 (single row)
    ["moment"], // row 6 (single row)
    ["specialmsg"], // row 7 (single row)
  ];

  const formatAddons = (addons) => {
    if (!addons) return "None";

    const addonLabels = {
      fastTrack: "Fast Track",
      nextDay: "Next Day Delivery",
      lyricVideo: "Lyrics Video",
      commercialRights: "Commercial Rights",
    };

    return (
      Object.entries(addons)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => addonLabels[key])
        .join(", ") || "None"
    );
  };

  const formatValue = (key, value) => {
    switch (key) {
      case "createdAt":
      case "targetdate":
      case "deliverydate":
        return new Date(value).toLocaleString();

      case "amount":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(value / 100);

      case "addons":
        return formatAddons(value);

      default:
        return String(value ?? "");
    }
  };

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
        <h1 className="text-2xl font-bold text-center">PROJECTS MANAGEMENT</h1>

        {/* Top section */}
        {selected && (
          <div className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">
              Details for Songcode: {selected.songcode}
            </h2>

            {editing ? (
              <div className="space-y-2">
                {FIELD_GROUPS.map((group, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-1 md:grid-cols-${group.length} gap-4`}
                  >
                    {group.map((key) => (
                      <div key={key} className="flex flex-col">
                        <label className="text-sm font-medium">
                          {LABELS[key] || key}
                        </label>

                        {["targetdate", "deliverydate"].includes(key) ? (
                          <input
                            type="datetime-local"
                            value={formatDateTimeLocal(form[key])}
                            onChange={(e) =>
                              setForm({ ...form, [key]: e.target.value })
                            }
                            className="border p-2 rounded"
                          />
                        ) : key === "addons" ? (
                          <div className="space-y-2 border p-2 rounded">
                            {[
                              ["fastTrack", "Fast Track"],
                              ["nextDay", "Next Day Delivery"],
                              ["lyricVideo", "Lyrics Video"],
                              ["commercialRights", "Commercial Rights"],
                            ].map(([addonKey, label]) => (
                              <label
                                key={addonKey}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={form.addons?.[addonKey] || false}
                                  onChange={(e) =>
                                    setForm({
                                      ...form,
                                      addons: {
                                        ...form.addons,
                                        [addonKey]: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={
                              key === "createdAt"
                                ? new Date(form.createdAt).toLocaleString()
                                : key === "amount"
                                  ? (form.amount / 100).toFixed(2)
                                  : (form[key] ?? "")
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,
                                [key]:
                                  key === "amount"
                                    ? Math.round(
                                        parseFloat(e.target.value || 0) * 100,
                                      )
                                    : e.target.value,
                              })
                            }
                            className={`border p-2 rounded ${
                              ["createdAt", "songcode"].includes(key)
                                ? "bg-gray-100"
                                : ""
                            }`}
                            readOnly={["createdAt", "songcode"].includes(key)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {FIELD_GROUPS.map((group, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-1 md:grid-cols-${group.length} gap-4`}
                  >
                    {group.map((key) => (
                      <div key={key}>
                        <span className="font-medium ">
                          {LABELS[key] || key}:{" "}
                        </span>
                        <span className="font-sanserif font-bold roboto-condensed-forms text-blue-900">
                          {formatValue(key, selected[key])}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
          placeholder="Search by email, songcode, recipient, or status..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // reset to first page on search
          }}
          className="border p-2 rounded w-full mb-4"
        />

        {/* Table */}
        <div className="overflow-x-auto text-center">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Songcode</th>
                <th className="p-2 border">Created At</th>
                <th className="p-2 border">Recipient</th>
                <th className="p-2 border">Relationship</th>
                <th className="p-2 border">Proj Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="p-2 border">{p.email}</td>
                  <td className="p-2 border">{p.songcode}</td>
                  <td className="p-2 border">{formatDate(p.createdAt)}</td>
                  <td className="p-2 border">{p.recipient}</td>
                  <td className="p-2 border">{p.relation}</td>
                  <td className="p-2 border">{p.status}</td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => {
                        setSelected(p);
                        setForm(p);
                        setEditing(false);
                      }}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => {
                        setSelected(p);
                        setForm(p);
                        setEditing(true);
                      }}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
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
