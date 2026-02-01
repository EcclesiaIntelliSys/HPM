import React, { useState } from 'react';

export default function ArtistSignOn({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const API_BASE = process.env.REACT_APP_API_URL || '';

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j.msg || 'Signon failed');
        return;
      }
      const { token } = await res.json();
      // store token securely in localStorage for demo; in production use httpOnly cookie
      localStorage.setItem('token', token);
      onSuccess();
    } catch (e) {
      setErr('Network error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-sand-50 rounded-md shadow mt-6">
      <h2 className="text-lg font-semibold text-olive-900 mb-3">Artist Sign On</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full p-2 rounded border" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="w-full p-2 rounded border" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
        {err && <div className="text-red-600">{err}</div>}
        <button className="w-full bg-olive-800 text-white py-2 rounded">Sign On</button>
      </form>
    </div>
  );
}
