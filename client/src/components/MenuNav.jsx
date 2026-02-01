import React from 'react';

export default function MenuNav({ onNavigate }) {
  return (
    <nav className="max-w-6xl mx-auto py-1">
      <ul className="flex flex-col md:flex-row items-center carrois-gothic-sc-regular justify-center
                     space-y-2 md:space-y-0 md:space-x-6
                     bg-sand-50 rounded-md p-3 md:p-4 shadow-sm">
        <li>
          <button
            onClick={() => onNavigate('create')}
            className="text-olive-900 hover:text-olive-700 hover:bg-terra-100"
          >
            Create Song
          </button>
        </li>
        <li>
          <button
            onClick={() => onNavigate('about')}
            className="text-olive-900 hover:text-olive-700 hover:bg-terra-100"
          >
            About Us
          </button>
        </li>
        <li>
          <button
            onClick={() => onNavigate('testimonials')}
            className="text-olive-900 hover:text-olive-700 hover:bg-terra-100"
          >
            Testimonials
          </button>
        </li>
      </ul>
    </nav>
  );
}
