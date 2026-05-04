import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { RxSpeakerLoud, RxSpeakerModerate, RxSpeakerOff } from "react-icons/rx";

export default function AudioPlayer() {
  const { publicId } = useParams();
  const beatRef = useRef(0);
  const lastEnergyRef = useRef(0);
  const hueRef = useRef(350); // start near rose
  const particlesRef = useRef([]);
  const rotationRef = useRef(0);
  const pulseRef = useRef(0);
  const prevDataRef = useRef(null);
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

  const genreImages = {
    Worship: "/images/worship.png",
    Jazz: "/images/jazz.png",
    "R&B / Soul": "/images/rnb.png",
    Country: "/images/country.png",
    Pop: "/images/pop.png",
    "Rap / Hip-hop": "/images/rap.png",
    Electronic: "/images/electronic.png",
    Reggae: "/images/reggae.png",
    "Indie Pop Rock": "/images/rocker.png",
    "Latin-Inspired": "/images/latino.png",
    Chorale: "/images/chorale.png",
    "Cinematic / Epic": "/images/epicsong.png",
  };
  const artwork = genreImages[project?.genre] || "/images/generics.png";

  const accent = "rose"; // 🔥 change here (violet, blue, etc.)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(
          `${API_BASE}/api/projects/audioplayer/${publicId}`,
        );
        setProject(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [publicId]);

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
      analyserRef.current.fftSize = 1024; // smoother waveform

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

    const bufferLength = analyserRef.current.fftSize;

    const timeData = new Uint8Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    analyserRef.current.getByteTimeDomainData(timeData);
    analyserRef.current.getByteFrequencyData(freqData);

    const width = canvas.width;
    const height = canvas.height;

    // 🎬 TRAIL
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // 🎧 ENERGY (bass-focused)
    let bass = 0;
    const bassRange = Math.floor(bufferLength * 0.1);

    for (let i = 0; i < bassRange; i++) {
      bass += freqData[i];
    }
    bass /= bassRange;

    // 💓 BEAT DETECTION
    const delta = bass - lastEnergyRef.current;
    lastEnergyRef.current = bass;

    if (delta > 15) {
      beatRef.current = 1; // trigger beat
    }

    beatRef.current *= 0.9; // decay

    // smooth pulse
    pulseRef.current = pulseRef.current * 0.85 + bass * 0.05;

    // 🌈 COLOR FROM FREQUENCY
    const mid = freqData[Math.floor(bufferLength * 0.3)];
    const high = freqData[Math.floor(bufferLength * 0.6)];

    const hue =
      340 +
      mid * 0.05 + // shift with mids
      high * 0.02;

    const color = `hsl(${hue}, 90%, 60%)`;

    const scale =
      width * 0.015 + pulseRef.current * 0.002 + beatRef.current * 0.01; // 💥 beat bump

    rotationRef.current += 0.002;

    // 🧠 smoothing
    if (!prevDataRef.current) {
      prevDataRef.current = new Uint8Array(timeData);
    }

    const smoothData = new Uint8Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
      smoothData[i] = prevDataRef.current[i] * 0.75 + timeData[i] * 0.25;
    }
    prevDataRef.current = smoothData;

    // 🎨 layers
    const layers = [
      { amp: 25, alpha: 0.12, width: 12, blur: 35 },
      { amp: 18, alpha: 0.25, width: 7, blur: 25 },
      { amp: 12, alpha: 1, width: 3, blur: 15 },
    ];

    layers.forEach((layer, layerIndex) => {
      ctx.beginPath();
      ctx.lineWidth = layer.width;
      ctx.strokeStyle = color;
      ctx.shadowBlur =
        layer.blur + pulseRef.current * 0.4 + beatRef.current * 10; // 💥 burst glow
      ctx.shadowColor = color;

      let prevX, prevY;

      for (let i = 0; i < bufferLength; i++) {
        const t = (i / bufferLength) * Math.PI * 2 + rotationRef.current;

        const index = (i + layerIndex * 8) % bufferLength;

        const v = smoothData[index] / 128.0;

        const displacement =
          (v - 1) *
          layer.amp *
          (1 + pulseRef.current * 0.02 + beatRef.current * 0.5);

        // ❤️ heart
        const x0 = 16 * Math.pow(Math.sin(t), 3);
        const y0 =
          13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t);

        const len = Math.sqrt(x0 * x0 + y0 * y0) || 1;
        const nx = x0 / len;
        const ny = y0 / len;

        const x = cx + x0 * scale + nx * displacement;
        const y = cy - y0 * scale - ny * displacement;

        if (i === 0) ctx.moveTo(x, y);
        else {
          const midX = (prevX + x) / 2;
          const midY = (prevY + y) / 2;
          ctx.quadraticCurveTo(prevX, prevY, midX, midY);
        }

        prevX = x;
        prevY = y;

        // ✨ particles on beat
        if (beatRef.current > 0.5 && Math.random() < 0.02) {
          particlesRef.current.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 40,
          });
        }
      }

      ctx.closePath();
      ctx.stroke();
    });

    // ✨ particles
    particlesRef.current.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (p.life <= 0) {
        particlesRef.current.splice(i, 1);
      }
    });

    // 🧊 GLASS LIGHT SWEEP
    let sweep = (Math.sin(Date.now() * 0.001) + 1) / 2;

    const clamp = (v) => Math.min(1, Math.max(0, v));

    const glass = ctx.createLinearGradient(0, 0, width, height);
    glass.addColorStop(clamp(sweep - 0.2), "rgba(255,255,255,0)");
    glass.addColorStop(clamp(sweep), "rgba(255,255,255,0.08)");
    glass.addColorStop(clamp(sweep + 0.2), "rgba(255,255,255,0)");

    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, width, height);

    // 🎬 vignette
    const vignette = ctx.createRadialGradient(
      cx,
      cy,
      width * 0.2,
      cx,
      cy,
      width * 0.7,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.45)");

    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    animationRef.current = requestAnimationFrame(drawVisualizer);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (!isPlaying) {
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0; // 🔥 ensures restart
      }
      initVisualizer();
      audioRef.current.play();

      if (!animationRef.current) {
        drawVisualizer();
      }
    } else {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
              className={`w-full h-full object-cover ${isPlaying ? "opacity-50" : "opacity-100"}`}
            />
            {/* Visualizer Canvas */}
            <canvas
              ref={canvasRef}
              width={320}
              height={320}
              className="absolute inset-0 w-full h-full z-20 pointer-events-none mix-blend-screen"
              style={{ opacity: isPlaying ? 0.9 : 0.25 }}
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
            <div className="whitespace-nowrap group-hover:animate-marquee font-montserrat text-sm">
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
            <span className="inline-block transform rotate-180">▶|</span>
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
          onEnded={() => {
            setIsPlaying(false);
            setProgress(0);
            setCurrentTime(0);

            if (animationRef.current) {
              cancelAnimationFrame(animationRef.current);
              animationRef.current = null; // ✅ ADD THIS
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}
    </div>
  );
}
