import React, { useState, useEffect } from "react";
import { FaStar, FaCheck, FaTimes } from "react-icons/fa";
import Banner from "./Banner";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function TestimonialForm() {
  // Reload once on direct page load
  useEffect(() => {
    const isDirectLoad =
      performance.getEntriesByType("navigation")[0]?.type === "navigate";

    if (isDirectLoad && !sessionStorage.getItem("testimonialReloaded")) {
      sessionStorage.setItem("testimonialReloaded", "1");
      window.location.reload();
    }
  }, []);

  // Clear the flag when leaving this page
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("testimonialReloaded");
    };
  }, []);

  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    songcode: "",
    feedback: "",
  });

  const [media, setMedia] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);

      const fd = new FormData();

      fd.append("rating", rating);
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("songcode", form.songcode);
      fd.append("feedback", form.feedback);

      if (profilePhoto) {
        fd.append("profilePhoto", profilePhoto);
      }
      if (media) {
        fd.append("media", media);
      }

      const res = await fetch(`${API_BASE}/api/testimonials`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) {
        console.log("Response:", data);
        throw new Error(data.error || "Submission failed");
      }

      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        {/* <Banner /> */}
        <div className="min-h-screen flex items-center justify-center p-6 font-montserrat">
          <div className="bg-sand-300 border-1 border-gray-600 shadow-xl p-8 text-center max-w-xl">
            <h1 className="text-2xl font-bold text-blue-800">Thank You!</h1>

            <p className="mt-4 text-black">
              Your testimonial has been received and is awaiting review.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-md"
            >
              Return Home
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Banner />
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-sand-100 border-1 border-gray-200 shadow-xl p-8">
            <h1 className="text-center text-xl font-montserrat mb-2 font-semibold">
              Share Your HeartPrayerMusic Story
            </h1>

            <p className="text-center text-gray-700 mb-8">
              We'd love to hear how your HeartPrayerMusic song impacted you or
              your loved one.
            </p>

            <form
              onSubmit={handleSubmit}
              className="space-y-6 text-sm font-montserrat"
            >
              {/* Rating */}

              <div>
                <label className="block mb-2 font-semibold">Rating *</label>

                <div className="flex gap-2 text-2xl select-none">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = rating >= star;

                    return (
                      <FaStar
                        key={star}
                        onClick={() => setRating(star)}
                        className="cursor-pointer hover:scale-110 transition-transform"
                        style={{
                          fill: active ? "#3b82f6" : "#ffffff",
                          stroke: "#000000",
                          strokeWidth: 20,
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              {/* Profile Photo */}

              <div>
                <label className="block mb-1">Profile Photo</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files[0])}
                  className="text-xs"
                />

                <p className="text-xs italic text-gray-500 mt-1">
                  Optional. This photo may be displayed together with your
                  testimonial.
                </p>
              </div>
              {/* Name */}

              <div>
                <label className="block mb-1">Name *</label>

                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded-md p-3 border border-olive-800"
                />
                <p className="text-xs italic text-gray-500 mt-1">
                  This is the name that will be shown with your testimonial.
                </p>
              </div>

              {/* Email */}

              <div>
                <label className="block mb-1">Email *</label>

                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="w-full rounded-md p-3 border border-olive-800"
                />
                <p className="text-xs italic text-gray-500 mt-1">
                  Your full email address will never be displayed.
                </p>
              </div>

              {/* Song Code */}

              <div>
                <label className="block mb-1">Song Code *</label>

                <input
                  type="text"
                  required
                  value={form.songcode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      songcode: e.target.value,
                    })
                  }
                  className="w-full rounded-md p-3 border border-olive-800"
                />
                <p className="text-xs italic text-gray-500 mt-1">
                  You can find this in your order confirmation or delivery
                  email.
                </p>
              </div>

              {/* Feedback */}

              <div>
                <label className="block mb-1">Write us your feedback. *</label>

                <textarea
                  required
                  rows={8}
                  value={form.feedback}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      feedback: e.target.value,
                    })
                  }
                  className="w-full rounded-md p-3 border border-olive-800"
                  placeholder="How did the song impact you or your loved one?"
                />

                {/* Gift + message row */}
                <div className="flex items-start gap-3 mt-2 mx-12">
                  <img
                    src="/images/giftbox.png"
                    alt="Gift box"
                    className="h-10 w-auto object-contain"
                  />

                  <p className="text-sm italic text-blue-800 leading-snug carrois-gothic-sc-regular tracking-tight">
                    Share your beautiful story and help inspire others —
                    selected testimonials featured on our website will receive a
                    special thank-you gift!
                  </p>
                </div>
              </div>
              {/* Upload */}

              <div>
                <label className="block mb-1">
                  Upload Photo, Audio or Video
                </label>

                <input
                  type="file"
                  accept="image/*,audio/*,video/*"
                  onChange={(e) => setMedia(e.target.files[0])}
                  className="text-xs "
                />

                <p className="text-xs italic text-gray-500 mt-1">Optional</p>
              </div>

              <div className="flex justify-center gap-4 pt-4">
                {/* Discard */}
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="
      w-12
      h-12
      rounded-full
      bg-red-600
      hover:bg-red-700
      text-white
      flex
      items-center
      justify-center
      shadow-lg
      hover:scale-105
      transition-all
    "
                  title="Discard and return Home"
                  aria-label="Discard and return Home"
                >
                  <FaTimes className="text-lg" />
                </button>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className={`
      w-12
      h-12
      rounded-full
      flex
      items-center
      justify-center
      text-white
      shadow-lg
      transition-all
      ${
        rating > 0 && !submitting
          ? "bg-olive-800 hover:bg-olive-900 hover:scale-105"
          : "bg-gray-300 cursor-not-allowed"
      }
    `}
                  title="Submit Story"
                  aria-label="Submit Story"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FaCheck className="text-lg" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
