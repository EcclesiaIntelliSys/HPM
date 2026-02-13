import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function WorkflowABC() {
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
  const boxClass =
    "p-4 bg-sand-50 shadow text-center hover:bg-green-200 focus:outline-none rounded-2xl";
  return (
    <main className="max-w-6xl mx-auto p-6 relative carrois-gothic-sc-regular">
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
      <h2 className="text-center font-semibold text-2xl mb-4 text-black">
        CREATIVES WORKFLOW
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate("/workflow/a")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">Lyricist</div>
        </button>

        <button onClick={() => navigate("/workflow/b")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">Song Artist</div>
        </button>

        <button onClick={() => navigate("/workflow/c")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">
            Quality Assurance
          </div>
        </button>
      </div>

      <br />
      <br />

      <h2 className="text-center font-semibold text-2xl mb-4 text-black">
        ADMIN WORKFLOW
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={() => navigate("/projectmanage")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">
            Projects Management
          </div>
        </button>
        <button onClick={() => navigate("/workflow/b")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">Payroll</div>
        </button>
        <button onClick={() => navigate("/workflow/b")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">
            Performance Mgt
          </div>
        </button>
        <button onClick={() => navigate("/vouchermanage")} className={boxClass}>
          <div className="text-lg font-bold text-olive-800">Site Admin</div>
        </button>
      </div>
    </main>
  );
}
