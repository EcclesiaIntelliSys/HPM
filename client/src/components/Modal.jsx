import { useEffect, useState } from "react";

export default function Modal({ title, filePath, onClose, children }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (filePath) {
      fetch(filePath)
        .then((res) => res.text())
        .then(setContent)
        .catch(() => setContent("<p>Failed to load content.</p>"));
    }
  }, [filePath]);

  const containerClasses = `bg-white p-6 rounded shadow-lg w-full max-h-[80vh] flex flex-col font-serif ${children ? "max-w-md" : "max-w-4xl"}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={containerClasses}>
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {/* ✅ Render children if provided, else fallback to filePath content */}
        {children ? (
          <div className="flex-1 overflow-y-auto mb-4 pr-2 prose max-w-none font-serif">
            {children}
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto mb-4 pr-2 prose max-w-none font-serif"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}

        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 self-end"
        >
          Close
        </button>
      </div>
    </div>
  );
}
