// client/src/components/Banner.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Banner() {
  const navigate = useNavigate();
  return (
    <header className="w-full sticky top-0 z-50">
      <div className="max-w-6xl mx-auto">
        <div className="relative w-full h-28 overflow-hidden ">
         {/* background banner fills container */}
              <img 
                  src="/images/skybanner2.png" 
                  alt="Heart Prayer Music banner" 
                  loading="lazy" 
                  className="absolute inset-0 w-full h-full object-cover object-center" 
                  aria-hidden="true" />

          {/* logo left-justified and vertically centered */}
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
  );
}
