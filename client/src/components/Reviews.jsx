// client/src/components/Banner.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaQuoteRight, FaCommentDots, FaHome } from "react-icons/fa";
import { FaCheckCircle } from "react-icons/fa";

export default function Reviews() {
  const navigate = useNavigate();
  const R2_PUBLIC = process.env.REACT_APP_R2_PUBLIC_URL;

  useEffect(() => {
    document.title = "HeartPrayerMusic Reviews | Hearts and lives blessed!";
  }, []);

  const [reviews, setReviews] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const audioRefs = useRef({});
  const [expandedReviews, setExpandedReviews] = useState({});

  const API_BASE = process.env.REACT_APP_API_URL;
  const toggleReview = (id) => {
    setExpandedReviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const toggleAudio = (id) => {
    const audio = audioRefs.current[id];
    if (!audio) return;

    if (playingId === id) {
      audio.pause();
      setPlayingId(null);
    } else {
      // Pause any currently playing audio
      if (playingId && audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
      }

      audio.play();
      setPlayingId(id);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/testimonials/published`);
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-sky-50 font-montserrat">
      <header className="w-full">
        <div className="max-w-6xl mx-auto">
          <div className="relative w-full h-28 overflow-hidden">
            {/* Banner */}
            <img
              src="/images/skybanner2.png"
              alt="Heart Prayer Music banner"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover object-center"
              aria-hidden="true"
            />

            {/* Logo */}
            <img
              src="/images/mylogo5.png"
              alt="Heart Prayer Music logo"
              loading="lazy"
              className="absolute left-1 top-1/2 transform -translate-y-1/2 z-30 w-48 md:w-52 lg:w-64 object-contain pointer-events-none"
            />

            <div className="absolute inset-0 flex flex-col items-end text-right px-3 md:items-center md:text-center">
              <div className="w-6/12 md:max-w-[50%]">
                <p className="ml-5 mt-1 text-white text-md md:text-2xl carrois-gothic-sc-regular pb-2 leading-none">
                  Your heart's prayer in a song
                </p>

                <div className="mt-1">
                  <button
                    onClick={() => navigate("/create")}
                    className="my-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-1 rounded-md text-xs md:text-sm shadow-lg"
                  >
                    Create Your Song
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl text-gray-800 font-semibold">
            HeartPayerMusic Reviews
          </h2>

          <p className="text-black mt-3 delius-regular">
            Every song is more than music—it is someone's prayer answered
            through melody.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => {
            const mediaSrc = review.mediaUrl
              ? `${R2_PUBLIC}/${encodeURIComponent(review.mediaUrl)}`
              : null;

            const profilePhotoSrc = review.profilePhotoUrl
              ? `${R2_PUBLIC}/${encodeURIComponent(review.profilePhotoUrl)}`
              : null;

            return (
              <div
                key={review._id}
                className="relative bg-white rounded-2xl border h-[600px] flex flex-col overflow-hidden
shadow-md transition-all duration-300 ease-out
hover:-translate-y-2 hover:scale-[1.02] hover:shadow-2xl
focus-within:-translate-y-2 focus-within:scale-[1.02] focus-within:shadow-2xl"
              >
                {/* Quote icon */}
                <div className="absolute top-4 right-4 text-sky-200 opacity-50">
                  <FaQuoteRight size={54} />
                </div>
                <div className="px-6 pt-6 text-2xl text-blue-600">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
                <div className="px-8 py-4">
                  {expandedReviews[review._id] ? (
                    <div className="h-80 overflow-y-auto pr-2">
                      <p className="text-gray-800 italic delius-regular leading-relaxed">
                        "{review.feedback}"
                      </p>
                    </div>
                  ) : (
                    <p
                      style={{
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 11,
                        overflow: "hidden",
                      }}
                      className="text-gray-800 italic delius-regular leading-relaxed"
                    >
                      "{review.feedback}"
                    </p>
                  )}

                  {review.feedback.length > 350 && (
                    <button
                      onClick={() => toggleReview(review._id)}
                      className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {expandedReviews[review._id] ? "Read Less" : "Read More"}
                    </button>
                  )}
                </div>
                {review.mediaType === "image" && mediaSrc && (
                  <div className="px-6 my-4">
                    <div
                      onClick={() =>
                        window.open(
                          `/image-viewer?src=${encodeURIComponent(mediaSrc)}`,
                          "testimonialImage",
                          "width=1100,height=700,resizable=yes",
                        )
                      }
                      className="w-28 aspect-video rounded-lg overflow-hidden bg-black cursor-pointer shadow hover:shadow-lg transition"
                    >
                      <img
                        src={mediaSrc}
                        alt="Testimonial attachment"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  </div>
                )}
                {review.mediaType === "audio" && mediaSrc && (
                  <div className="px-6 my-4">
                    <div
                      onClick={() => toggleAudio(review._id)}
                      className="relative w-28 aspect-video rounded-lg overflow-hidden bg-slate-800 group cursor-pointer"
                    >
                      {/* Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-200" />

                      {/* Music Note */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl text-blue-500 opacity-90">
                          🎵
                        </span>
                      </div>

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition" />

                      {/* Play/Pause Button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <span className="text-blue-700 text-xl ml-0.5">
                            {playingId === review._id ? "⏸" : "▶"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <audio
                      ref={(el) => (audioRefs.current[review._id] = el)}
                      src={mediaSrc}
                      onEnded={() => setPlayingId(null)}
                    />
                  </div>
                )}
                {review.mediaType === "video" && mediaSrc && (
                  <div className="px-6 my-4">
                    <div
                      onClick={() =>
                        window.open(
                          `/video-player?src=${encodeURIComponent(mediaSrc)}`,
                          "testimonialVideo",
                          "width=1100,height=700,resizable=yes",
                        )
                      }
                      className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black group cursor-pointer"
                    >
                      <video
                        src={mediaSrc}
                        muted
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />

                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />

                      {/* Play button */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                          <span className="text-blue-700 text-xl ml-0.5">
                            ▶
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-auto px-6 py-5 border-t bg-slate-50">
                  <div className="flex items-center gap-2">
                    {profilePhotoSrc && (
                      <img
                        src={profilePhotoSrc}
                        alt={review.name}
                        className="w-14 h-14 ring-2 ring-sky-100 rounded-full object-cover border shadow-sm flex-shrink-0"
                      />
                    )}

                    <div>
                      <div className="font-semibold text-blue-900 text-md">
                        {review.name}
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-xs text-green-800 font-medium tracking-tight italic">
                        <FaCheckCircle className="text-green-500" />
                        <span>Verified Customer</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* Floating Action Buttons */}
      <div className="fixed top-24 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 flex justify-end gap-3">
          <button
            onClick={() => navigate("/testimonial")}
            className="
        pointer-events-auto
        flex
        items-center
        gap-2
        bg-rose-600
        hover:bg-rose-700
        text-white
        px-5
        py-3
        rounded-full
        shadow-xl
        hover:shadow-2xl
        hover:scale-105
        transition-all
        duration-300
      "
          >
            <FaCommentDots className="text-sm" />
            Share Your Story
          </button>

          <button
            onClick={() => navigate("/")}
            className="
    pointer-events-auto
    flex
    items-center
    justify-center
    bg-slate-700
    hover:bg-slate-800
    text-white
    w-12
    h-12
    rounded-full
    shadow-xl
    hover:shadow-2xl
    hover:scale-105
    transition-all
    duration-300
  "
            title="Back to Home"
            aria-label="Back to Home"
          >
            <FaHome className="text-lg" />
          </button>
        </div>
      </div>{" "}
    </div>
  );
}
