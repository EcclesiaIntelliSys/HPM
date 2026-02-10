import { React, useState, useRef, useEffect } from "react";
import { FaMusic } from "react-icons/fa6";
import { ImGift } from "react-icons/im";
import { FaRegCirclePlay } from "react-icons/fa6";
import { IoPauseCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

export default function SampleAudio() {
  const navigate = useNavigate();

  const sampleFiles = [
    { src: "/media/sample1.mp3", title: "Morning Light", genre: "Worship" },
    { src: "/media/sample2.mp3", title: "Open Hands", genre: "R & B" },
    { src: "/media/sample3.mp3", title: "Quiet Promise", genre: "Rock" },
    {
      src: "/media/sample4.mp3",
      title: "Shine @ Eighteen",
      genre: "Indie Pop Rock",
    },
    { src: "/media/sample5.mp3", title: "The Long Way Home", genre: "Country" },
  ];

  // Create refs for each audio element
  const audioRefs = sampleFiles.map(() => useRef(null));
  const [playingIndex, setPlayingIndex] = useState(null);
  const togglePlay = (index) => {
    const audio = audioRefs[index].current;
    if (!audio) return;
    if (playingIndex === index) {
      audio.pause();
      setPlayingIndex(null);
    } else {
      // Pause any currently playing audio
      if (playingIndex !== null && audioRefs[playingIndex].current) {
        audioRefs[playingIndex].current.pause();
      }
      audio.play();
      setPlayingIndex(index);
    }
  };

  // Attach "ended" event listeners so playback resets when a track finishes
  useEffect(() => {
    audioRefs.forEach((ref, i) => {
      const audio = ref.current;
      if (!audio) return;
      const handleEnded = () => {
        if (playingIndex === i) {
          setPlayingIndex(null);
        }
      };
      audio.addEventListener("ended", handleEnded);
      return () => audio.removeEventListener("ended", handleEnded);
    });
  }, [playingIndex]);

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row gap-6 shadow-md">
      {/* First div: 75% on medium+ screens */}
      <div className="md:w-3/4 w-full">
        <p className="text-center md:text-left mx-2 text-olive-900 font-serif font-bold text-3xl">
          Heart Prayer Music - Who We Are
        </p>
        <p className="text-center md:text-left mx-2 mt-5 carrois-gothic-sc-regular text-lg font-md tracking-tight">
          We are musicians, storytellers, and worship leaders—united by faith
          and a belief in the power of music. With years of experience playing
          instruments, leading worship teams, and writing songs for deeply
          personal moments, we create music that speaks to the heart. Our
          diverse musical backgrounds allow us to move freely across styles,
          while our foundation in Bible-based counseling shapes every song with
          intention, compassion, and hope. We don’t just write music—we help
          tell stories that bring people closer, restore relationships, and
          inspire healing.
        </p>
        <div className="mr-5 mt-6">
          <img
            src="/images/banner.png"
            alt="Heart Prayer Music banner"
            loading="lazy"
            className="rounded-xl object-cover w-full"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Second div: 25% on medium+ screens */}
      <div className="md:w-1/4 w-full shadow-md p-4 bg-gray-100">
        <p className="text-olive-900 font-serif font-bold text-center text-xl">
          Listen To Some Of Our Samples
        </p>
        <div className="pl-2 mt-4">
          {sampleFiles.map((file, i) => (
            <div key={i} className="items-center p-2">
              <audio ref={audioRefs[i]} src={file.src} />
              <button
                onClick={() => togglePlay(i)}
                className="w-56 flex items-center px-4 hover:px-3 py-2 bg-terra-100 hover:bg-terra-50 text-sm rounded-full shadow-lg shadow-outline tracking-tight carrois-gothic-sc-regular font-bold"
              >
                {playingIndex === i ? (
                  <IoPauseCircle className="w-8 h-8 text-orange-800 mr-4" />
                ) : (
                  <FaRegCirclePlay className="w-8 h-8 text-orange-800 mr-4" />
                )}
                {file.title}
                <br></br>({file.genre})
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/create")}
          className="my-4 bg-orange-800 hover:bg-rose-700 text-white px-5 py-4 rounded-full text-sm shadow-lg flex items-center gap-4 w-full justify-center"
        >
          <FaMusic className="w-4 h-4 text-white" />
          <span>Create One For Me</span>
          <FaMusic className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
