import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function MenuNav() {
  const { token, logout, user } = useContext(AuthContext);
  const navigate = useNavigate(); // ✅ hook for navigation
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="max-w-6xl mx-auto py-1">
      <ul
        className="flex flex-col md:flex-row items-center carrois-gothic-sc-regular justify-center
                   space-y-2 md:space-y-0 md:space-x-6
                   bg-sand-50 rounded-md p-3 md:p-4 shadow-sm"
      >
        <li>
          <button
            onClick={() => navigate("/create")}
            className="text-olive-900 hover:text-olive-700 hover:bg-terra-100"
          >
            Create Song
          </button>
        </li>
        <li>
          <button
            onClick={() => scrollToSection("sampleaudio-section")}
            className="text-olive-900 hover:text-olive-700 hover:bg-terra-100"
          >
            Sample Songs
          </button>
        </li>
        <li>
          <button
            onClick={() => scrollToSection("ourprocess-section")}
            className="text-olive-900 hover:text-olive-700 hover:bg-terra-100"
          >
            Our Process
          </button>
        </li>
      </ul>
    </nav>
  );
}
