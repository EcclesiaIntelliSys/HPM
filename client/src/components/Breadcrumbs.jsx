import React from 'react';

export default function Breadcrumbs({ path }) {
  const crumbs = [{ key: 'home', label: 'Home' }];
  if (path && path !== 'home') crumbs.push({ key: path, label: path.charAt(0).toUpperCase() + path.slice(1) });

  return (
    <div className="bg-sand-50 border-b border-sand-200">
      <div className="max-w-6xl mx-auto p-3 text-sm text-sand-700">
        {crumbs.map((c, i) => (
          <span key={c.key} className="inline-flex items-center">
            {i > 0 && <span className="mx-2">/</span>}
            <span>{c.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
