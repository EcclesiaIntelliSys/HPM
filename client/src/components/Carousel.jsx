import React, { useState, useEffect } from 'react';

const slides = [
  { id: 1, type: 'img', src: '/images/slide1.jpg', alt: 'Holding hands' },
  { id: 2, type: 'img', src: '/images/slide2.gif', alt: 'Warm embrace' },
  { id: 3, type: 'img', src: '/videos/clip1.gif', alt: 'Reunion' }
];

export default function Carousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setIndex(i => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex(i => (i + 1) % slides.length);

  return (
    <section className="max-w-6xl mx-auto ">
      <div className="relative overflow-hidden bg-sand-100 flex items-center justify-center">
        <div className="rounded-lg overflow-hidden w-11/12 md:w-3/6 h-64 md:h-72 bg-sand-100">
          {slides[index].type === 'img' ? (
            <img src={slides[index].src} alt={slides[index].alt} className="object-cover w-full h-full" />
          ) : (
            <video src={slides[index].src} controls className="object-cover w-full h-full" />
          )}
        </div>
{/* 
        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-olive-800/80 text-white p-2 rounded-full"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-olive-800/80 text-white p-2 rounded-full"
          aria-label="Next"
        >
          ›
        </button>
 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`w-3 h-3 rounded-full ${i === index ? 'bg-olive-800' : 'bg-sand-300'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
