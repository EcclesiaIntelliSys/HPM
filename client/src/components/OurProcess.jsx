import React from "react";
import { FaMusic } from "react-icons/fa6";
import { ImGift } from "react-icons/im";
import { useNavigate } from "react-router-dom";

export default function OurProcess({ id }) {
  const navigate = useNavigate();
  return (
    <div id={id} className="max-w-6xl mx-auto">
      <div className="relative w-full overflow-hidden shadow-md h-[620px]">
        {/* Background image */}
        <img
          src="/images/collage.png"
          alt="Process Collage"
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden="true"
        />

        {/* Overlay content */}
        <div className="relative z-10 flex flex-col items-center h-full space-y-8">
          <p className="mt-5 text-yellow-400 font-serif font-black text-center text-4xl tracking-tight">
            Your Custom Song in{" "}
            <span className="mogra-regular text-white text-5xl">3</span> Simple
            Steps !
          </p>
          <br></br>

          <div className="items-center delius-regular">
            <div className="flex mb-5">
              <div className="ml-5 text-xl md:text-2xl w-14 h-14 rounded-full bg-white flex items-center justify-center text-black font-black">
                1
              </div>
              <div className="text-2xl md:text-3xl flex items-center justify-center ml-3 text-white font-medium tracking-tight">
                Answer a few guided questions - Share what's in your heart
              </div>
            </div>

            <div className="flex mb-5">
              <div className="ml-5 text-xl md:text-2xl w-14 h-14 text-2xl rounded-full bg-white flex items-center justify-center text-black font-bold">
                2
              </div>
              <div className="text-2xl md:text-3xl flex items-center justify-center ml-3 text-white font-medium tracking-tight">
                Our artists catch the feeling and turn it into a song
              </div>
            </div>

            <div className="flex mb-5">
              <div className="ml-5 text-xl md:text-2xl w-14 h-14 text-2xl rounded-full bg-white flex items-center justify-center text-black font-bold">
                3
              </div>
              <div className="text-2xl md:text-3xl flex items-center justify-center ml-3 text-white font-medium tracking-tight">
                Your song gift delivered straight to your inbox within a week
              </div>
            </div>
          </div>

          {/* Button */}
          <button
            onClick={() => navigate("/create")}
            className="my-2 bg-orange-800 hover:bg-rose-700 text-white px-5 py-6 rounded-md text-sm shadow-lg flex items-center gap-4"
          >
            <FaMusic className="w-4 h-4 text-white" />
            <span>I'm Ready. Let's Start !</span>
            <FaMusic className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
