import React, { useEffect, useState } from 'react';

export default function WorkflowABC() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // For demo we decode token payload lightly; in production fetch user info from server
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h2 className="text-xl font-semibold text-olive-900 mb-4">Artist Workflow</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-sand-50 rounded shadow">
          <div className="text-2xl font-bold text-olive-800">A</div>
          <div className="mt-2 text-sand-700">Idea capture and brief</div>
        </div>
        <div className="p-6 bg-sand-50 rounded shadow">
          <div className="text-2xl font-bold text-olive-800">B</div>
          <div className="mt-2 text-sand-700">Composition and arrangement</div>
        </div>
        <div className="p-6 bg-sand-50 rounded shadow">
          <div className="text-2xl font-bold text-olive-800">C</div>
          <div className="mt-2 text-sand-700">Mixing and delivery</div>
        </div>
      </div>

      <div className="mt-6 text-sm text-sand-600">
        {user ? `Signed in as ${user.email}` : 'Not signed in'}
      </div>
    </main>
  );
}
