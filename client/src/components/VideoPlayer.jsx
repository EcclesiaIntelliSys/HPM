import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function VideoPlayer() {
  const [searchParams] = useSearchParams();

  const src = searchParams.get("src");

  useEffect(() => {
    document.title = "Heart Prayer Music | Video";
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-sky-100 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/mylogo5.png" alt="Logo" className="h-10" />
        </div>

        <button
          onClick={() => window.close()}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Close
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center p-6">
        <video
          controls
          autoPlay
          className="max-w-full max-h-full rounded-lg shadow-2xl"
        >
          <source src={src} />
        </video>
      </div>
    </div>
  );
}
