import React from 'react';
import { Link } from 'react-router-dom';

/** Compact logo in dashboard sidebars (no top navbar). */
const SidebarBrand = () => (
  <Link
    to="/"
    className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white shrink-0 hover:bg-gray-50/80 transition-colors"
  >
    <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
      C
    </div>
    <span className="text-lg font-black tracking-tighter text-brand-black leading-tight">
      CAREER<span className="text-brand-primary">VISION</span>
    </span>
  </Link>
);

export default SidebarBrand;
