// components/MothersDayBanner.jsx
import React, { useEffect, useState } from "react";
import { RiHeart2Fill } from "react-icons/ri";

export default function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({});
  const [isVisible, setIsVisible] = useState(true);

  // 🔒 Persist dismiss state
  useEffect(() => {
    const dismissedDate = localStorage.getItem("mdBannerDismissed");
    const today = new Date().toDateString();

    if (dismissedDate === today) {
      setIsVisible(false);
    }
  }, []);

  // 📅 Countdown logic (auto local timezone)
  useEffect(() => {
    const endDate = new Date("2026-05-10T23:59:59");

    const timer = setInterval(() => {
      const now = new Date();
      const diff = endDate - now;

      if (diff <= 0) {
        clearInterval(timer);
        setIsVisible(false);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("mdBannerDismissed", new Date().toDateString());
    setIsVisible(false);
  };
  if (new Date() > new Date("2026-05-09T23:59:59")) {
    return null;
    if (!isVisible) return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-rose-200 via-pink-100 to-rose-200 text-olive-900 px-4 py-3 flex items-center justify-center relative z-50">
      {/* CENTER CONTENT */}
      <div
        onClick={() =>
          document
            .getElementById("ourprocess-section")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        className="flex flex-col md:flex-row items-center gap-1 md:gap-3 cursor-pointer text-center font-montserrat"
      >
        {/* ❌ Close Button (absolute so it doesn't break centering) */}
        <button
          onClick={handleDismiss}
          className="absolute right-4 text-olive-700 hover:text-black text-lg font-bold"
          aria-label="Close banner"
        >
          ×
        </button>
        <div className="flex">
          <RiHeart2Fill className="w-6 h-6 text-red-800" />
          <RiHeart2Fill className="w-6 h-6 text-red-800" />
        </div>
        <span className="font-semibold italic">
          MOM's Day is on May 10th....
        </span>
        <span className="font-semibold">
          Gift her now with a Heart Prayer Music for only {"  "}
          <span className="italic line-through opacity-70 text-xl">$100</span>
          <span className="italic text-blue-700 font-bold text-xl">
            {" "}
            $80
          </span>{" "}
        </span>
        <span className="text-sm">(that's 20% off) !!</span>
        {/* ⏳ Countdown */}
        <span className="text-xs md:text-sm font-mono bg-white/50 px-2 py-1 rounded tracking-tight">
          Promo valid for{" "}
          <span className="text-md font-black italic text-blue-900">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{" "}
            {timeLeft.seconds}s
          </span>
        </span>
        <div className="flex">
          <RiHeart2Fill className="w-6 h-6 text-red-800" />
          <RiHeart2Fill className="w-6 h-6 text-red-800" />
        </div>
      </div>
    </div>
  );
}
