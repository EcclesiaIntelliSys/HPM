import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

export default function VoucherCRUD() {
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

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    vouchercode: "",
    discount: 0,
    quantity: 0,
    validstart: "",
    validend: "",
    valid: true,

    claimedby: "",
    claimdate: "",
    role: "",
  });
  const [editingId, setEditingId] = useState(null);

  // ✅ Base URL for backend API
  const API_BASE = process.env.REACT_APP_API_URL;

  // Load vouchers
  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/vouchersmanage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVouchers(res.data);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVouchers();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(`${API_BASE}/api/vouchersmanage/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/vouchersmanage`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setForm({
        vouchercode: "",
        discount: 0,
        quantity: 0,
        validstart: "",
        validend: "",
        valid: true,

        claimedby: "",
        claimdate: "",
        role: "",
      });
      setEditingId(null);
      fetchVouchers();
    } catch (err) {
      alert(err.response?.data?.error || "Error saving voucher");
    }
  };

  const handleEdit = (voucher) => {
    setForm({
      vouchercode: voucher.vouchercode,
      discount: voucher.discount,
      quantity: voucher.quantity,
      validstart: voucher.validstart?.slice(0, 10),
      validend: voucher.validend?.slice(0, 10),
      valid: voucher.valid,

      claimedby: voucher.claimedby || "",
      claimdate: voucher.claimdate ? voucher.claimdate.slice(0, 10) : "",
      role: voucher.role || "",
    });
    setEditingId(voucher._id);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Delete this voucher?")) return;
    try {
      await axios.delete(`${API_BASE}/api/vouchersmanage/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVouchers();
    } catch (err) {
      console.error("Error deleting voucher:", err);
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
      <div className="p-6 text-sm font-mono">
        <h1 className="text-2xl font-bold mb-4 text-center">
          VOUCHER MANAGEMENT
        </h1>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-1 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {/* Voucher Code */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Voucher Code:
              </label>
              <input
                type="text"
                value={form.vouchercode}
                onChange={(e) =>
                  setForm({ ...form, vouchercode: e.target.value })
                }
                className="border p-2 flex-1 rounded"
                required
              />
            </div>

            {/* Discount */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Discount (%):
              </label>
              <input
                type="number"
                value={form.discount}
                onChange={(e) =>
                  setForm({ ...form, discount: Number(e.target.value) })
                }
                className="border p-2 flex-1 rounded"
                min="0"
                max="100"
                required
              />
            </div>

            {/* Valid Start */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Valid Start:
              </label>
              <input
                type="date"
                value={form.validstart}
                onChange={(e) =>
                  setForm({ ...form, validstart: e.target.value })
                }
                className="border p-2 flex-1 rounded"
                required
              />
            </div>

            {/* Valid End */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Valid End:
              </label>
              <input
                type="date"
                value={form.validend}
                onChange={(e) => setForm({ ...form, validend: e.target.value })}
                className="border p-2 flex-1 rounded"
                required
              />
            </div>

            {/* Valid Checkbox */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">Valid:</label>
              <input
                type="checkbox"
                checked={form.valid}
                onChange={(e) => setForm({ ...form, valid: e.target.checked })}
              />
            </div>

            {/* Claimed By */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Claimed By:
              </label>
              <input
                type="text"
                value={form.claimedby}
                onChange={(e) =>
                  setForm({ ...form, claimedby: e.target.value })
                }
                className="border p-2 flex-1 rounded"
              />
            </div>

            {/* Claim Date */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Claim Date:
              </label>
              <input
                type="date"
                value={form.claimdate}
                onChange={(e) =>
                  setForm({ ...form, claimdate: e.target.value })
                }
                className="border p-2 flex-1 rounded"
              />
            </div>

            {/* Role */}
            <div className="flex items-center gap-1">
              <label className="w-32 font-semibold text-right">
                Role (for onboarding voucher only):
              </label>
              <input
                type="text"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="border p-2 flex-1 rounded"
              />

              {/* Quantity */}
              <div className="flex items-center gap-1">
                <label className="w-32 font-semibold text-right">
                  Quantity :
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: Number(e.target.value) })
                  }
                  className="border p-2 flex-1 rounded"
                  min="0"
                  max="1000"
                  required
                />
              </div>
            </div>
          </div>
          <br />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto mt-2"
          >
            {editingId ? "Update Voucher" : "Add Voucher"}
          </button>
          <button
            type="submit"
            onClick={() => navigate("/workflow")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto mt-2 ml-5"
          >
            Back to Workflow
          </button>
        </form>

        {/* List */}
        <div className="overflow-x-auto">
          <table className="w-full border text-center">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Code</th>
                <th className="border p-2">Discount</th>
                <th className="border p-2">Quantity</th>
                <th className="border p-2">Valid Start</th>
                <th className="border p-2">Valid End</th>
                <th className="border p-2">Valid</th>

                <th className="border p-2">Claimed By</th>
                <th className="border p-2">Claim Date</th>
                <th className="border p-2">Role</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v._id}>
                  <td className="border p-2">{v.vouchercode}</td>
                  <td className="border p-2">{v.discount}</td>
                  <td className="border p-2">{v.quantity}</td>
                  <td className="border p-2">
                    {new Date(v.validstart).toLocaleDateString()}
                  </td>
                  <td className="border p-2">
                    {new Date(v.validend).toLocaleDateString()}
                  </td>
                  <td className="border p-2">{v.valid ? "Yes" : "No"}</td>

                  <td className="border p-2">{v.claimedby}</td>
                  <td className="border p-2">
                    {v.claimdate
                      ? new Date(v.claimdate).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="border p-2">{v.role}</td>
                  <td className="border p-2 space-x-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(v._id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
