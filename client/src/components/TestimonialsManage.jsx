import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const API_BASE = process.env.REACT_APP_API_URL;

export default function TestimonialsManage() {
  const R2_PUBLIC = process.env.REACT_APP_R2_PUBLIC_URL;
  const navigate = useNavigate();

  const { token, logout } = useContext(AuthContext);

  const [user, setUser] = useState(null);

  // Reload once on direct page load
  useEffect(() => {
    const isDirectLoad =
      performance.getEntriesByType("navigation")[0]?.type === "navigate";

    if (isDirectLoad && !sessionStorage.getItem("testimonialMReloaded")) {
      sessionStorage.setItem("testimonialMReloaded", "1");
      window.location.reload();
    }
  }, []);

  // Clear the flag when leaving this page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("testimonialMReloaded");
    };
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

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [newMedia, setNewMedia] = useState(null);
  const [newProfilePhoto, setNewProfilePhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteProfilePhoto, setDeleteProfilePhoto] = useState(false);
  const [deleteMedia, setDeleteMedia] = useState(false);

  const pageSize = 5;

  const mediaSrc = form?.mediaUrl
    ? `${R2_PUBLIC}/${encodeURIComponent(form.mediaUrl)}`
    : null;

  const profilePhotoSrc = form?.profilePhotoUrl
    ? `${R2_PUBLIC}/${encodeURIComponent(form.profilePhotoUrl)}`
    : null;

  const fetchTestimonials = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_BASE}/api/testimonials/manage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTestimonials(res.data);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

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

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");

      const formData = new FormData();

      formData.append("rating", form.rating);
      formData.append("status", form.status);
      formData.append("feedback", form.feedback);
      formData.append("deleteProfilePhoto", deleteProfilePhoto);
      formData.append("deleteMedia", deleteMedia);

      if (newMedia) {
        formData.append("media", newMedia);
      }

      if (newProfilePhoto) {
        formData.append("profilePhoto", newProfilePhoto);
      }

      const res = await fetch(`${API_BASE}/api/testimonials/${selected._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Update failed.");

      const updated = testimonials.map((t) =>
        t._id === selected._id ? data : t,
      );

      setTestimonials(updated);
      setSelected(data);
      setForm(data);
      setEditing(false);
      setNewMedia(null);
      setNewProfilePhoto(null);
      setDeleteProfilePhoto(false);
      setDeleteMedia(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = testimonials.filter(
    (t) =>
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.songcode.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.status.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const LABELS = {
    rating: "Rating",
    status: "Status",
    name: "Customer Name",
    email: "Email",
    songcode: "Song Code",
    feedback: "Feedback",
    mediaType: "Media Type",
    mediaUrl: "Media File",
    createdAt: "Submitted At",
  };

  const FIELD_GROUPS = [
    ["rating", "status"],
    ["name", "email"],
    ["songcode", "mediaType"],
    ["createdAt"],
    ["feedback"],
  ];

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
  return (
    <main>
      {/* Logo */}
      <img
        src="/images/mylogo5.png"
        alt="Heart Prayer Music logo"
        loading="lazy"
        className="absolute top-1 left-5 w-32 md:w-40 lg:w-48 object-contain"
      />

      {/* Signed In */}
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

      <br />
      <br />

      <div className="p-6 space-y-6 text-sm font-mono">
        <h1 className="text-2xl font-bold text-center">
          TESTIMONIALS MANAGEMENT
        </h1>

        {/* Detail / Edit */}
        {selected && (
          <div className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">
              Testimonial for Song Code: {selected.songcode}
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
                        <label className="font-medium">{LABELS[key]}</label>
                        {key === "feedback" ? (
                          <textarea
                            rows={5}
                            value={form[key] ?? ""}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                [key]: e.target.value,
                              })
                            }
                            className="border rounded p-2"
                          />
                        ) : key === "status" ? (
                          <select
                            value={form.status ?? "pending"}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                status: e.target.value,
                              })
                            }
                            className="border rounded p-2"
                          >
                            <option value="pending">Pending</option>
                            <option value="published">Published</option>
                            <option value="unpublished">Unpublished</option>
                          </select>
                        ) : key === "rating" ? (
                          <select
                            value={form.rating ?? 5}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                rating: Number(e.target.value),
                              })
                            }
                            className="border rounded p-2"
                          >
                            <option value={1}>1 ★</option>
                            <option value={2}>2 ★★</option>
                            <option value={3}>3 ★★★</option>
                            <option value={4}>4 ★★★★</option>
                            <option value={5}>5 ★★★★★</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={
                              key === "createdAt"
                                ? new Date(form.createdAt).toLocaleString()
                                : (form[key] ?? "")
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,
                                [key]: e.target.value,
                              })
                            }
                            className={`border rounded p-2 ${
                              [
                                "createdAt",
                                "songcode",
                                "name",
                                "email",
                                "mediaType",
                                "mediaUrl",
                              ].includes(key)
                                ? "bg-gray-100"
                                : ""
                            }`}
                            readOnly={[
                              "createdAt",
                              "songcode",
                              "name",
                              "email",
                              "mediaType",
                              "mediaUrl",
                            ].includes(key)}
                          />
                        )}{" "}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>

                  {newProfilePhoto ||
                  (form.profilePhotoUrl && !deleteProfilePhoto) ? (
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={
                          newProfilePhoto
                            ? URL.createObjectURL(newProfilePhoto)
                            : `${R2_PUBLIC}/${encodeURIComponent(form.profilePhotoUrl)}`
                        }
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border shadow"
                      />

                      {!newProfilePhoto && form.profilePhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setDeleteProfilePhoto(true)}
                          className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mb-4">
                      No profile photo.
                    </p>
                  )}

                  <label className="block font-medium mb-2">
                    Replace Profile Photo
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setNewProfilePhoto(e.target.files[0]);
                      setDeleteProfilePhoto(false);
                    }}
                  />

                  {newProfilePhoto && (
                    <p className="text-green-600 text-sm mt-2">
                      Selected: {newProfilePhoto.name}
                    </p>
                  )}
                </div>{" "}
                <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">Attachment</h3>

                  {newMedia || (form.mediaUrl && !deleteMedia) ? (
                    <div className="flex items-start gap-4 mb-4">
                      <div>
                        {newMedia ? (
                          <>
                            {newMedia.type.startsWith("image/") && (
                              <img
                                src={URL.createObjectURL(newMedia)}
                                alt="Preview"
                                className="w-32 h-32 object-cover rounded border shadow"
                              />
                            )}

                            {newMedia.type.startsWith("audio/") && (
                              <div className="px-4 py-3 border rounded bg-white">
                                🎵 {newMedia.name}
                              </div>
                            )}

                            {newMedia.type.startsWith("video/") && (
                              <video
                                src={URL.createObjectURL(newMedia)}
                                controls
                                className="w-64 rounded border shadow"
                              />
                            )}
                          </>
                        ) : (
                          <>
                            {form.mediaType === "image" && (
                              <a
                                href={`${R2_PUBLIC}/${encodeURIComponent(form.mediaUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={`${R2_PUBLIC}/${encodeURIComponent(form.mediaUrl)}`}
                                  alt="Attachment"
                                  className="w-32 h-32 object-cover rounded border shadow"
                                />
                              </a>
                            )}

                            {form.mediaType === "audio" && (
                              <a
                                href={`${R2_PUBLIC}/${encodeURIComponent(form.mediaUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                🎵 Current Audio
                              </a>
                            )}

                            {form.mediaType === "video" && (
                              <a
                                href={`${R2_PUBLIC}/${encodeURIComponent(form.mediaUrl)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                🎬 Current Video
                              </a>
                            )}
                          </>
                        )}
                      </div>

                      {!newMedia && form.mediaUrl && (
                        <button
                          type="button"
                          onClick={() => setDeleteMedia(true)}
                          className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic mb-4">No attachment.</p>
                  )}

                  <label className="block font-medium mb-2">
                    Replace Attachment
                  </label>

                  <input
                    type="file"
                    accept="image/*,audio/*,video/*"
                    onChange={(e) => {
                      setNewMedia(e.target.files[0]);
                      setDeleteMedia(false);
                    }}
                  />

                  {newMedia && (
                    <p className="text-green-600 text-sm mt-2">
                      Selected: {newMedia.name}
                    </p>
                  )}
                </div>{" "}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded mt-4 text-white flex items-center justify-center gap-2
    ${
      saving
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-blue-600 hover:bg-blue-700"
    }`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>{" "}
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
                        <span className="font-medium">{LABELS[key]}:</span>{" "}
                        <span className="font-bold text-blue-900 roboto-condensed-forms">
                          {key === "createdAt" ? (
                            new Date(selected.createdAt).toLocaleString()
                          ) : key === "rating" ? (
                            <span className="text-blue-600 text-lg">
                              {"★".repeat(selected.rating)}
                              {"☆".repeat(5 - selected.rating)}
                            </span>
                          ) : (
                            String(selected[key] ?? "")
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
                {selected?.profilePhotoUrl && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Profile Photo</h3>

                    <img
                      src={profilePhotoSrc}
                      alt={selected.name}
                      className="w-24 h-24 rounded-full object-cover border shadow"
                    />
                  </div>
                )}
                {selected?.mediaUrl && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-3">Attachment</h3>

                    {selected.mediaType === "image" && (
                      <a
                        href={mediaSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Click to view full image"
                      >
                        <img
                          src={mediaSrc}
                          alt="Attachment"
                          className="w-28 h-28 object-cover rounded border shadow hover:scale-105 transition cursor-pointer"
                        />
                      </a>
                    )}

                    {selected.mediaType === "audio" && (
                      <a
                        href={mediaSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="text-2xl">🎵</span>
                        <span className="font-medium">Open Audio</span>
                      </a>
                    )}

                    {selected.mediaType === "video" && (
                      <a
                        href={mediaSrc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100"
                      >
                        <span className="text-2xl">🎬</span>
                        <span className="font-medium">Open Video</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Top Controls */}

        <button
          onClick={() => navigate("/workflow")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto"
        >
          Back to Workflow
        </button>

        <input
          type="text"
          placeholder="Search by name, email, song code or status..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border p-2 rounded w-full"
        />

        {/* Table */}

        <div className="overflow-x-auto text-center">
          <table className="min-w-full border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Song Code</th>
                <th className="p-2 border">Rating</th>
                <th className="p-2 border">Attachment</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Submitted</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="border p-2">{t.name}</td>
                  <td className="border p-2">{t.email}</td>
                  <td className="border p-2">{t.songcode}</td>
                  <td className="border p-2">
                    <span className="text-blue-600 text-lg">
                      {"★".repeat(t.rating)}
                      {"☆".repeat(5 - t.rating)}
                    </span>
                  </td>
                  <td className="border p-2">
                    <div className="flex justify-center items-center">
                      {t.mediaUrl ? (
                        t.mediaType === "image" ? (
                          <a
                            href={`${R2_PUBLIC}/${encodeURIComponent(t.mediaUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src={`${R2_PUBLIC}/${encodeURIComponent(t.mediaUrl)}`}
                              alt="Thumbnail"
                              className="w-14 h-14 object-cover rounded border hover:scale-105 transition"
                            />
                          </a>
                        ) : t.mediaType === "audio" ? (
                          <a
                            href={`${R2_PUBLIC}/${encodeURIComponent(t.mediaUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl hover:scale-110 transition"
                            title="Open Audio"
                          >
                            🎵
                          </a>
                        ) : t.mediaType === "video" ? (
                          <a
                            href={`${R2_PUBLIC}/${encodeURIComponent(t.mediaUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-3xl hover:scale-110 transition"
                            title="Open Video"
                          >
                            🎬
                          </a>
                        ) : (
                          "-"
                        )
                      ) : (
                        "-"
                      )}
                    </div>
                  </td>{" "}
                  <td className="border p-2">{t.status}</td>
                  <td className="border p-2">{formatDate(t.createdAt)}</td>
                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => {
                        setSelected(t);
                        setForm(t);
                        setEditing(false);
                      }}
                      className="bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Detail
                    </button>

                    <button
                      onClick={() => {
                        setSelected(t);
                        setForm(t);

                        setNewMedia(null);
                        setNewProfilePhoto(null);

                        setDeleteProfilePhoto(false);
                        setDeleteMedia(false);

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

        {/* Pagination */}

        <div className="flex justify-between items-center mt-4">
          <span>
            Page {page} of {totalPages}
          </span>

          <div className="space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={`px-3 py-1 rounded ${
                page === 1
                  ? "bg-gray-300 text-gray-600"
                  : "bg-blue-600 text-white"
              }`}
            >
              Prev
            </button>

            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className={`px-3 py-1 rounded ${
                page === totalPages
                  ? "bg-gray-300 text-gray-600"
                  : "bg-blue-600 text-white"
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
