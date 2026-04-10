import React from 'react';
import { Link } from 'react-router-dom';
import { LanguageToggle } from './LanguageToggle';

/** Compact logo in dashboard sidebars (no top navbar). */
const SidebarBrand = () => (
  <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 shrink-0">
    <Link
      to="/"
      className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1 hover:bg-gray-50/80 transition-colors"
    >
      <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
        C
      </div>
      <span className="text-lg font-black tracking-tighter text-brand-black leading-tight truncate">
        CAREER<span className="text-brand-primary">VISION</span>
      </span>
    </Link>
    <LanguageToggle compact className="shrink-0" />
  </div>
);

export default SidebarBrand;
