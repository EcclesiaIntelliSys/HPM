import { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_URL;

export default function ProjectsManagement() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5; // ✅ number of rows per page

  // Load projects
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE}/api/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        if (data.length > 0) {
          setSelected(data[0]); // default: first record
          setForm(data[0]);
        }
      })
      .catch((err) => console.error("Error fetching projects:", err));
  }, []);

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
      p.recipient.toLowerCase().includes(search.toLowerCase()),
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
  };

  // Field groups
  const FIELD_GROUPS = [
    ["relation", "recipient", "agegroup"], // row 1
    ["genre", "voice", "email"], // row 2
    ["ack", "status", "voucherNo"], // row 3
    ["createdAt", "songcode"], // row 4
    ["qualities"], // row 5 (single row)
    ["moment"], // row 6 (single row)
    ["specialmsg"], // row 7 (single row)
  ];

  return (
    <div className="p-6 space-y-6 text-sm font-mono">
      <h1 className="text-2xl font-bold">Projects Management</h1>

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
                      <input
                        type="text"
                        value={
                          key === "createdAt"
                            ? new Date(form.createdAt).toLocaleString()
                            : (form[key] ?? "")
                        }
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                        className={`border p-2 rounded ${
                          ["createdAt", "songcode"].includes(key)
                            ? "bg-gray-100"
                            : ""
                        }`}
                        readOnly={["createdAt", "songcode"].includes(key)}
                      />
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
                        {key === "createdAt"
                          ? new Date(selected.createdAt).toLocaleString()
                          : String(selected[key])}
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
      <input
        type="text"
        placeholder="Search by email, songcode, or recipient..."
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
  );
}
