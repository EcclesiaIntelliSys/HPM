import { React, useState, useRef, useEffect } from "react";
import { FaMusic } from "react-icons/fa6";
import { ImGift } from "react-icons/im";
import { FaRegCirclePlay } from "react-icons/fa6";
import { GiCheckMark } from "react-icons/gi";
import { IoPauseCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function Features({ id }) {
  const navigate = useNavigate();
  const images = ["/images/cpx.png", "/images/ipadx.png", "/images/pcx.png"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id={id}
      className="bg-gray-100 max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 shadow-md mb-4"
    >
      {/* First div: 75% on medium+ screens */}
      <div className="md:w-2/4 w-full flex flex-col p-5">
        <p className="text-center md:text-left text-black carrois-gothic-sc-regular font-black text-2xl italic m-0">
          Your very own custom song!
        </p>
        <div className="flex h-52 overflow-hidden">
          <img
            src="/images/giftbox.png"
            alt="Gift box"
            className="w-auto h-full object-cobtain block"
          />
        </div>
        <div className="border-2 border-gray-200 bg-gradient-to-b from-black to-yellow-600 px-4 py-2 shadow rounded-xl font-montserrat text-sm">
          <div className="flex gap-2 items-start ">
            <GiCheckMark className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className="text-white">
              A song gift made from your very thoughts and heart's prayer
            </span>
          </div>
          <div className="flex gap-2 items-center ">
            <GiCheckMark className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className="text-white">
              Delivered in 5 days.. Or as fast as 24 hours or less!
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <GiCheckMark className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className="text-white">Recorded in High-fidelity Audio</span>
          </div>
          <div className="flex gap-2 items-center">
            <GiCheckMark className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className="text-white">30-day Money-Back Guarantee</span>
          </div>
          <div className="flex gap-2 items-center">
            <GiCheckMark className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <span className="text-white">
              Prayerfully and artistically crafted
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate("/create")}
          className="my-4 bg-orange-800 hover:bg-rose-700 text-white px-5 py-4 rounded-full text-sm shadow-lg flex items-center gap-4 w-fit mx-auto"
        >
          <FaMusic className="w-4 h-4 text-white" />
          <span>Pack My Gift Now</span>
          <FaMusic className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Second div: 25% on medium+ screens */}
      <div className="md:w-2/4 w-full p-5">
        <p className="text-black roboto-condensed-forms text-center text-lg italic tracking-tighter">
          Play the Song Link on Any Media
        </p>

        <div className="relative w-full h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Device preview"
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
