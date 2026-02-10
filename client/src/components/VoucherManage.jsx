import { useEffect, useState } from "react";
import axios from "axios";

export default function VoucherCRUD() {
  const [vouchers, setVouchers] = useState([]);
  const [form, setForm] = useState({
    vouchercode: "",
    discount: 0,
    validstart: "",
    validend: "",
    valid: true,
    claimed: false,
    claimedby: "",
    claimdate: "",
  });
  const [editingId, setEditingId] = useState(null);

  // ✅ Base URL for backend API
  const API_BASE = process.env.REACT_APP_API_URL;

  // Load vouchers
  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/vouchers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVouchers(res.data);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (editingId) {
        await axios.put(`${API_BASE}/api/vouchers/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`${API_BASE}/api/vouchers`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setForm({
        vouchercode: "",
        discount: 0,
        validstart: "",
        validend: "",
        valid: true,
        claimed: false,
        claimedby: "",
        claimdate: "",
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
      validstart: voucher.validstart?.slice(0, 10),
      validend: voucher.validend?.slice(0, 10),
      valid: voucher.valid,
      claimed: voucher.claimed,
      claimedby: voucher.claimedby || "",
      claimdate: voucher.claimdate ? voucher.claimdate.slice(0, 10) : "",
    });
    setEditingId(voucher._id);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!window.confirm("Delete this voucher?")) return;
    try {
      await axios.delete(`${API_BASE}/api/vouchers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVouchers();
    } catch (err) {
      console.error("Error deleting voucher:", err);
    }
  };

  return (
    <div className="p-6 text-sm font-mono">
      <h1 className="text-2xl font-bold mb-4">Voucher Management</h1>

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
              onChange={(e) => setForm({ ...form, validstart: e.target.value })}
              className="border p-2 flex-1 rounded"
              required
            />
          </div>

          {/* Valid End */}
          <div className="flex items-center gap-1">
            <label className="w-32 font-semibold text-right">Valid End:</label>
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

          {/* Claimed Checkbox */}
          <div className="flex items-center gap-1">
            <label className="w-32 font-semibold text-right">Claimed:</label>
            <input
              type="checkbox"
              checked={form.claimed}
              onChange={(e) => setForm({ ...form, claimed: e.target.checked })}
            />
          </div>

          {/* Claimed By */}
          <div className="flex items-center gap-1">
            <label className="w-32 font-semibold text-right">Claimed By:</label>
            <input
              type="text"
              value={form.claimedby}
              onChange={(e) => setForm({ ...form, claimedby: e.target.value })}
              className="border p-2 flex-1 rounded"
            />
          </div>

          {/* Claim Date */}
          <div className="flex items-center gap-1">
            <label className="w-32 font-semibold text-right">Claim Date:</label>
            <input
              type="date"
              value={form.claimdate}
              onChange={(e) => setForm({ ...form, claimdate: e.target.value })}
              className="border p-2 flex-1 rounded"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full md:w-auto mt-2"
        >
          {editingId ? "Update Voucher" : "Add Voucher"}
        </button>
      </form>

      {/* List */}
      <div className="overflow-x-auto">
        <table className="w-full border text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Code</th>
              <th className="border p-2">Discount</th>
              <th className="border p-2">Valid Start</th>
              <th className="border p-2">Valid End</th>
              <th className="border p-2">Valid</th>
              <th className="border p-2">Claimed</th>
              <th className="border p-2">Claimed By</th>
              <th className="border p-2">Claim Date</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.map((v) => (
              <tr key={v._id}>
                <td className="border p-2">{v.vouchercode}</td>
                <td className="border p-2">{v.discount}</td>
                <td className="border p-2">
                  {new Date(v.validstart).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {new Date(v.validend).toLocaleDateString()}
                </td>
                <td className="border p-2">{v.valid ? "Yes" : "No"}</td>
                <td className="border p-2">{v.claimed ? "Yes" : "No"}</td>
                <td className="border p-2">{v.claimedby}</td>
                <td className="border p-2">
                  {v.claimdate
                    ? new Date(v.claimdate).toLocaleDateString()
                    : ""}
                </td>
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
  );
}
