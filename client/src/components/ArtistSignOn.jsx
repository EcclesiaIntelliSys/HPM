import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom"; // ✅ add navigation

export default function ArtistSignOn({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const API_BASE = process.env.REACT_APP_API_URL || "";

  const { login } = useContext(AuthContext);
  const navigate = useNavigate(); // ✅ hook for navigation

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.msg || "Signon failed");
        setLoading(false);
        return;
      }

      if (!data.token) {
        setErr("No token returned from server");
        setLoading(false);
        return;
      }

      login(data.token);
      onSuccess();
    } catch (e) {
      console.error("Login error:", e);
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <img
        src="/images/mylogo5.png"
        alt="Heart Prayer Music logo"
        loading="lazy"
        className="w-32 md:w-40 lg:w-48 object-contain mx-auto mb-6"
      />
      <div className="max-w-md mx-auto p-6 bg-sand-50 rounded-md shadow mt-6 font-mono">
        <h2 className="text-olive-900 mb-3">Please Sign in</h2>
        <form onSubmit={submit} className="space-y-3">
          <input
            className="w-full p-2 rounded border"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full p-2 rounded border"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {err && <div className="text-red-600">{err}</div>}
          <button
            className="w-full bg-olive-800 text-white py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign On"}
          </button>
        </form>

        {/* ✅ Register option */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Don’t have an account?</p>
          <button
            onClick={() => navigate("/register")}
            className="mt-2 w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
          >
            Register
          </button>
        </div>
      </div>
    </main>
  );
}
