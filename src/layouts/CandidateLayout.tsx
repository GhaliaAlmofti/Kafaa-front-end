import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Send, FileText, Search } from 'lucide-react';
import { api } from '../services/api';

export type CandidateLayoutContext = {
  selectedCvId: number | null;
  setSelectedCvId: React.Dispatch<React.SetStateAction<number | null>>;
};

const navItems: { to: string; end?: boolean; label: string; icon: React.ReactNode }[] = [
  { to: '/dashboard', end: true, label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/dashboard/applications', label: 'Applications', icon: <Send size={18} /> },
  { to: '/dashboard/cv', label: 'My CV', icon: <FileText size={18} /> },
  { to: '/dashboard/jobs', label: 'Find jobs', icon: <Search size={18} /> },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
    isActive
      ? 'bg-brand-green text-white shadow-sm'
      : 'text-gray-600 hover:bg-gray-100 hover:text-brand-black'
  }`;

const CandidateLayout = () => {
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);

  useEffect(() => {
    api
      .getUserCV()
      .then((cvs) => {
        if (cvs.length > 0) {
          setSelectedCvId((prev) => prev ?? cvs[0].id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white md:w-56 md:pt-4">
        <p className="hidden md:block text-[10px] font-black uppercase tracking-wider text-gray-400 px-4 mb-2">
          Career hub
        </p>
        <nav className="flex md:flex-col gap-1 p-3 md:px-3 overflow-x-auto md:overflow-visible">
          {navItems.map(({ to, end, label, icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">
        <Outlet context={{ selectedCvId, setSelectedCvId } as CandidateLayoutContext} />
      </div>
    </div>
  );
};

export default CandidateLayout;
