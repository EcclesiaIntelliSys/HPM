import React, { useState, useRef } from "react";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import Modal from "../components/Modal";

const steps = [
  "Order Confirmed",
  "Crafting Your Lyrics",
  "Composing Your Sound",
  "Polishing the Final Track",
  "Getting Ready for You",
  "Your Song Has Arrived",
];

export default function Market({ id }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [codePart1, setCodePart1] = useState("");
  const [codePart2, setCodePart2] = useState("");
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [cancelProj, setCancelProj] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);

  const [recordFound, setRecordFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const part2Ref = useRef(null);

  const validate = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }

    if (!codePart1 || !codePart2) {
      newErrors.songCode = "Song code is required";
    } else if (codePart1.length !== 6 || codePart2.length !== 4) {
      newErrors.songCode = "Code must be 6 digits - 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    const songCode = `${codePart1}-${codePart2}`;

    try {
      const res = await api.get(`api/projects/tracker`, {
        params: { email, songCode },
      });

      const data = res.data;

      switch (data.status) {
        case "Queued for Lyricist":
        case "Lyricist - WIP":
          setCurrentStep(1);
          break;
        case "Queued for Song Artist":
        case "Song Artist - WIP":
          setCurrentStep(2);
          break;
        case "Queued for Quality Assurance":
        case "Quality Assurance - WIP":
          setCurrentStep(3);
          break;
        case "Queued for Admin Review and Action":
        case "Admin - WIP":
          setCurrentStep(4);
          break;
        case "Project Completed":
          setCurrentStep(5);
          break;
        case "Project Cancelled":
          setCurrentStep(6);
          setCancelProj(true);
          setShowCancelModal(true);
          break;
        default:
          setCurrentStep(0);
      }

      setRecordFound(true);
    } catch (err) {
      // console.log("FULL ERROR:", err);

      if (err.response?.status === 404) {
        setRecordFound(false);
        setShowNotFoundModal(true);
        setErrors({ songCode: "No order found for this email/code" });
      } else {
        setErrors({ songCode: "Something went wrong. Try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    /^\S+@\S+\.\S+$/.test(email) &&
    codePart1.length === 6 &&
    codePart2.length === 4;

  return (
    <div id={id} className="max-w-6xl mx-auto">
      <div className="relative w-full h-auto overflow-hidden shadow-md bg-gray-100 px-6 py-4">
        <p className="text-olive-900 font-serif font-bold text-center text-2xl mb-6">
          Track My Custom Song Order
        </p>

        {/* 📝 FORM */}
        <div className="flex flex-col gap-5 max-w-md mx-auto font-montserrat">
          {/* 📧 EMAIL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-rose-400 text-sm"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
            {!errors.email && (
              <p className="font-thin italic font-mono text-blue-500 text-xs mt-1 tracking-tight">
                * The email you indicated in your order.
              </p>
            )}
          </div>

          {/* 🔢 SONG CODE */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Song Code *
            </label>

            <div className="flex items-center gap-2 text-sm">
              {/* First 6 digits */}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={codePart1}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCodePart1(val);

                  if (val.length === 6) {
                    part2Ref.current?.focus();
                  }
                }}
                className="w-28 px-3 py-2 text-center tracking-widest rounded-md border focus:outline-none focus:ring-2 focus:ring-rose-400"
              />

              <span className="font-bold text-lg">-</span>

              {/* Last 4 digits */}
              <input
                ref={part2Ref}
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={codePart2}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setCodePart2(val);
                }}
                className="w-20 px-3 py-2 text-center tracking-widest rounded-md border focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            {errors.songCode && (
              <p className="text-red-500 text-xs mt-1">{errors.songCode}</p>
            )}
            {!errors.songCode && (
              <p className="font-thin italic font-mono text-blue-500 text-xs mt-1 tracking-tight">
                * The Song Code given with your order confirmation email.
              </p>
            )}
          </div>

          {/* Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`w-[50%] mx-auto px-5 py-2 rounded-md text-sm shadow-lg flex items-center justify-center gap-2 transition
    ${
      isFormValid
        ? "bg-orange-800 hover:bg-rose-700 text-white"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
          >
            <IoMdCheckmarkCircleOutline className="w-4 h-4" />
            Check Status
          </button>
        </div>

        {/* 📊 TRACKER */}
        {recordFound && !cancelProj && (
          <div className="mt-10">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-10 font-montserrat font-semibold">
              {steps.map((step, index) => {
                const isCompleted = index <= currentStep;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center text-center relative"
                  >
                    {/* Line */}
                    {index !== 0 && (
                      <>
                        {/* Line */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 left-[-50%] w-full h-[2px] ${
                            index % 3 === 0 ? "sm:block hidden" : "block"
                          } ${
                            index <= currentStep ? "bg-rose-500" : "bg-gray-300"
                          }`}
                        />

                        {/* Arrowhead */}
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 left-[-6px] w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent ${
                            index % 3 === 0 ? "sm:block hidden" : "block"
                          } ${index <= currentStep ? "border-l-rose-500" : "border-l-gray-300"}`}
                        />
                      </>
                    )}

                    {/* Circle */}
                    <div
                      className={`z-10 w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                        isCompleted
                          ? "bg-green-500 border-rose-400 text-white"
                          : "border-gray-300 text-gray-400"
                      }`}
                    >
                      <IoMdCheckmarkCircleOutline />
                    </div>

                    {/* Label */}
                    <p className="text-[10px] sm:text-xs mt-2 w-20 sm:w-24">
                      {step}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {showCancelModal && (
          <Modal
            onClose={() => {
              setShowCancelModal(false);
            }}
            hideDefaultClose={true}
          >
            <h2 className="text-red-600">
              Sorry. This order has been cancelled.
            </h2>
            <p className="text-red-600">
              You can reach us by email at info@heartprayermusic.com for more
              information.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                }}
                className="bg-red-600  text-white px-4 py-2 rounded mt-4 justify-center"
              >
                Close
              </button>
            </div>
          </Modal>
        )}

        {showNotFoundModal && (
          <Modal
            onClose={() => {
              setShowNotFoundModal(false);
            }}
            hideDefaultClose={true}
          >
            <h2 className="text-red-600">Sorry. No matching order found</h2>
            <p className="text-red-600">
              You can reach us by email at info@heartprayermusic.com for more
              information.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setShowNotFoundModal(false);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded mt-4 justify-center"
              >
                Close
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
