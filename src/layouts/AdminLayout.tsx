import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, Briefcase } from 'lucide-react';

const navItems: { to: string; end?: boolean; label: string; icon: React.ReactNode }[] = [
  { to: '/admin', end: true, label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { to: '/admin/companies', label: 'Companies', icon: <Building2 size={18} /> },
  { to: '/admin/jobs', label: 'Jobs', icon: <Briefcase size={18} /> },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
    isActive
      ? 'bg-brand-green text-white shadow-sm'
      : 'text-gray-600 hover:bg-gray-100 hover:text-brand-black'
  }`;

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-white md:w-56 md:pt-4">
        <p className="hidden md:block text-[10px] font-black uppercase tracking-wider text-gray-400 px-4 mb-2">
          Admin
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
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
