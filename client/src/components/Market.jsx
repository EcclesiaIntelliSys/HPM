import React from "react";
import { FaMusic } from "react-icons/fa6";
import { ImGift } from "react-icons/im";
import { useNavigate } from "react-router-dom";

export default function Market() {
  const navigate = useNavigate();
  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative w-full h-auto overflow-hidden shadow-md bg-gray-100 px-6 py-8">
        <p className="text-gray-800 text-center text-sm tracking-widest">
          CUSTOM SCRIPTURE SONGS FOR THE PEOPLE WHO MATTER MOST
        </p>

        <div className="mt-6">
          <p className="text-olive-900 font-serif font-bold text-center text-2xl">
            "It was like the song was written just for us—because it was."
          </p>
        </div>

        <div className="text-gray-800 text-center mt-6 space-y-2">
          <p>Not a generic song. Not something anyone else could give.</p>
          <p>
            A song written from Scripture, shaped by your story, and offered as
            a gift of faith, love, and prayer.
          </p>
        </div>

        {/* Center the button using a flex parent */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate("/create")}
            className="my-2 bg-orange-800 hover:bg-rose-700 text-white px-5 py-2 rounded-md text-sm shadow-lg flex items-center gap-2"
          >
            <FaMusic className="w-4 h-4 text-white" />
            <ImGift className="w-4 h-4 text-white" />
            <span>Pack Your Song Gift Now !</span>
          </button>
        </div>
      </div>
    </div>
  );
}
