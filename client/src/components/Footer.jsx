import React, { useState, useRef, useEffect } from "react";
import Modal from "./Modal.jsx";

export default function Footer() {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <footer className="mt-8 bg-olive-50 border-t border-sand-200 font-montserrat">
      <div className="max-w-6xl mx-auto p-6 flex flex-col md:flex-row items-center justify-between">
        <div className="text-sand-800 text-xs">
          <p>© {new Date().getFullYear()} Heart Prayer Music</p>
          <p>Wyoming, USA</p>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0 items-center">
          {/* Terms of Service */}{" "}
          <button
            onClick={() => setShowTerms(true)}
            className="text-sand-700 text-xs hover:underline"
          >
            {" "}
            Terms of Service{" "}
          </button>{" "}
          {/* Privacy Policy */}{" "}
          <button
            onClick={() => setShowPrivacy(true)}
            className="text-sand-700 text-xs hover:underline"
          >
            {" "}
            Privacy Policy{" "}
          </button>
          {showTerms && (
            <Modal
              title=""
              filePath="/tos.html"
              onClose={() => setShowTerms(false)}
            />
          )}{" "}
          {showPrivacy && (
            <Modal
              title=""
              filePath="/pp.html"
              onClose={() => setShowPrivacy(false)}
            />
          )}{" "}
          {/* YouTube */}
          <a
            href="https://www.youtube.com/@heartprayermusic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <svg
              className="w-9 h-9 text-red-600 hover:text-red-700"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1.5"
                y="4.5"
                width="21"
                height="15"
                rx="4"
                fill="currentColor"
              />
              <path d="M10 9.5v5l4-2.5-4-2.5z" fill="#ffffff" />
            </svg>
          </a>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/HeartPrayerMusic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
          >
            <svg
              className="w-8 h-8 text-blue-600 hover:text-blue-700"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07C1.86 17.02 5.9 21.12 10.7 21.95v-6.95H8.2v-2.98h2.5V9.6c0-2.47 1.47-3.83 3.72-3.83 1.08 0 2.21.19 2.21.19v2.43h-1.24c-1.22 0-1.6.76-1.6 1.54v1.85h2.73l-.44 2.98h-2.29V21.95C18.1 21.12 22 17.02 22 12.07z" />
            </svg>
          </a>
          {/* Instagram with simple gradient fill */}
          <a
            href="https://www.instagram.com/heart_prayermusic"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
          >
            <svg
              className="w-8 h-8 hover:opacity-90"
              viewBox="0 0 24 24"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="igGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#f58529" />
                  <stop offset="50%" stopColor="#dd2a7b" />
                  <stop offset="100%" stopColor="#8134af" />
                </linearGradient>
              </defs>
              <rect
                x="2"
                y="2"
                width="20"
                height="20"
                rx="5"
                fill="url(#igGrad)"
              />
              <circle cx="12" cy="12" r="3.2" fill="#ffffff" />
              <circle cx="17.5" cy="6.5" r="0.9" fill="#ffffff" />
            </svg>
          </a>
          {/* X (formerly Twitter) */}
          {/* X (formerly Twitter) */}
          <a
            href="https://x.com/yourprofile"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
          >
            <svg
              className="w-7 h-7 text-slate-900 hover:text-sky-500"
              viewBox="0 0 1200 1227"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M714.163 519.284 1160.89 0H1057.2L668.29 452.37 356.06 0H0l468.492 679.38L0 1226.37h103.7l412.96-480.96 331.28 480.96H1200L714.137 519.284h.026ZM565.59 687.47l-46.47-66.46L142.55 88.65h162.06l303.14 433.94 46.47 66.46 395.36 566.72H887.52L565.59 687.47Z" />
            </svg>
          </a>
          {/* Plain blue TikTok icon */}
          <a
            href="https://www.tiktok.com/@hpm_2026"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
          >
            <svg
              className="w-7 h-7 text-blue-600 hover:text-blue-700"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              role="img"
            >
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"></path>{" "}
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
