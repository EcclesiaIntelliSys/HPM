import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { RxSpeakerLoud, RxSpeakerModerate, RxSpeakerOff } from "react-icons/rx";

export default function AudioPlayer() {
  const { publicId } = useParams();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [tapEffect, setTapEffect] = useState(null);
  const [volume, setVolume] = useState(0.75);
  const [isDark, setIsDark] = useState(false); // 🌗 toggle

  const audioRef = useRef(null);
  const lastTapRef = useRef(0);

  // Visualizer Refs
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  const API_BASE = process.env.REACT_APP_API_URL;
  const R2_PUBLIC = process.env.REACT_APP_R2_PUBLIC_URL;

  const artwork =
    project?.coverImage ||
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=800";
  const accent = "rose"; // 🔥 change here (violet, blue, etc.)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`${API_BASE}/api/projects/${publicId}`);
        setProject(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Cleanup Web Audio API on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const audioSrc = project?.filename
    ? `${R2_PUBLIC}/${encodeURIComponent(project.filename)}?nocache=1`
    : null;

  // Initialize Web Audio API
  const initVisualizer = () => {
    if (!audioRef.current) return;

    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256; // Slightly more detail

      // Only create the source once
      sourceRef.current = audioCtxRef.current.createMediaElementSource(
        audioRef.current,
      );

      // IMPORTANT: Connect to both the analyser AND the destination (speakers)
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };
  const drawVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyserRef.current.getByteFrequencyData(dataArray);

    // Clear previous frame
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = (width / bufferLength) * 2;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      // Scale bar height relative to canvas height
      const scaledHeight = (barHeight / 255) * height;

      // Rose-500 theme to match your UI
      ctx.fillStyle = `rgba(244, 63, 94, 0.8)`;

      // Draw bar from bottom up
      ctx.fillRect(x, height - scaledHeight, barWidth, scaledHeight);

      x += barWidth + 1;
    }

    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!isPlaying) {
      initVisualizer();
      audioRef.current.play();
      drawVisualizer(); // Start the loop
    } else {
      audioRef.current.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current); // Stop the loop
    }
    setIsPlaying(!isPlaying);
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(
      Math.max(audio.currentTime + seconds, 0),
      audio.duration,
    );
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    if (!audioRef.current?.duration) return;
    audioRef.current.currentTime = percent * duration;
  };

  const handleDoubleTap = (direction) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      skipTime(direction === "left" ? -10 : 10);
      setTapEffect(direction);
      setTimeout(() => setTapEffect(null), 400);
    }
    lastTapRef.current = now;
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
    setProgress((audio.currentTime / audio.duration) * 100 || 0);
  };

  const formatTime = (time) => {
    if (!time) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-screen relative overflow-hidden flex items-center justify-center px-6 transition ${
        isDark ? "text-white" : "text-zinc-800"
      }`}
    >
      {/* 🌈 Background */}

      <div
        className="absolute inset-0 bg-center bg-cover scale-110 blur-3xl opacity-30"
        style={{ backgroundImage: `url(${artwork})` }}
      />
      <div
        className={`absolute inset-0 ${isDark ? "bg-black/60" : "bg-white/60"}`}
      />

      {/* 🎧 Main */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center mt-10">
        <div className="relative flex flex-col items-center z-10">
          {/* 🌟 Logo */}
          <img
            src="/images/mylogo5.png"
            alt="Heart Prayer Music logo"
            loading="lazy"
            className="w-28 sm:w-32 md:w-36 lg:w-40 object-contain mb-1 sm:mb-2 mt-4"
          />
          <div className=" flex gap-2 rounded-full backdrop-blur bg-white/30 p-1 mb-2">
            <button
              onClick={() => setIsDark(false)}
              className={`font-monserrat text-xs px-3 py-1 rounded-full transition ${
                !isDark
                  ? "bg-rose-500 text-white"
                  : "text-zinc-800 hover:bg-white/20"
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isDark
                  ? "bg-rose-500 text-white"
                  : "text-zinc-800 hover:bg-white/20"
              }`}
            >
              🌙 Dark
            </button>
          </div>

          {/* 💿 Visualizer / Album Art Container */}
          <div
            className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-xl transition ${
              isPlaying ? "scale-105 shadow-rose-500/30" : ""
            } ${isDark ? "bg-black/40" : "bg-black/10"}`}
          >
            <img
              src={artwork}
              alt="cover"
              className="w-full h-full object-cover"
            />
            {/* Visualizer Canvas */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="absolute inset-0 w-full h-full z-20 pointer-events-none"
              style={{ display: isPlaying ? "block" : "block" }}
            />
          </div>

          {/* ✨ Tap Feedback */}
          {tapEffect && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-4xl animate-ping">
                {tapEffect === "left" ? "⏪" : "⏩"}
              </div>
            </div>
          )}
        </div>

        {/* 🎵 Info */}
        <div className="w-full max-w-xs overflow-hidden mt-5">
          <div className="group relative">
            <div className="whitespace-nowrap group-hover:animate-marquee font-montserrat">
              {project?.filename || "Your Song"}
            </div>
          </div>
        </div>

        {/* 🎯 Seek */}
        <div
          className="w-full md:w-80 mb-2 cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className={`${isDark ? "bg-white/20" : "bg-black/10"} h-1 rounded-full`}
          >
            <div
              className="h-1 bg-rose-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ⏱ Time */}
        <div
          className={`w-full md:w-80 flex justify-between text-xs mb-6 ${isDark ? "text-zinc-300" : "text-zinc-500"}`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* 🎛 Controls */}
        <div
          className={`backdrop-blur-xl px-8 py-2 rounded-full flex items-center gap-6 shadow-md ${isDark ? "bg-white/10" : "bg-white/60"}`}
        >
          <button
            onClick={() => skipTime(-10)}
            className="w-10 h-10 flex items-center justify-center"
          >
            |◄
          </button>
          <button
            onClick={togglePlay}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white shadow-md hover:scale-110 transition ${
              isPlaying ? "pl-0" : "pl-1"
            } bg-gradient-to-br from-rose-500 to-rose-700`}
          >
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <button
            onClick={() => skipTime(10)}
            className="w-10 h-10 flex items-center justify-center"
          >
            ▶|
          </button>
        </div>

        {/* 🔊 Volume */}
        <div className="mt-8 relative flex items-center group">
          <button className="text-lg">
            {audioRef.current?.muted || volume === 0 ? (
              <RxSpeakerOff />
            ) : volume < 0.5 ? (
              <RxSpeakerModerate />
            ) : (
              <RxSpeakerLoud />
            )}
          </button>
          <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setVolume(value);
                if (audioRef.current) {
                  audioRef.current.volume = value;
                  audioRef.current.muted = value === 0;
                }
              }}
              style={{
                background: `linear-gradient(to right, ${
                  isDark ? "white" : "#f43f5e"
                } ${volume * 100}%, rgba(0,0,0,0.1) ${volume * 100}%)`,
              }}
              className="w-24 h-1 appearance-none rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* ❤️ Footer */}
        <p
          className={`text-xs mt-8 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}
        >
          A song made just for {project?.recipient}
        </p>
      </div>

      {/* 🔊 Audio */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
        />
      )}
    </div>
  );
}
