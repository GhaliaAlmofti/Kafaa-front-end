import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Send, FileText, Search } from 'lucide-react';
import { api } from '../services/api';
import SidebarBrand from '../components/SidebarBrand';
import SidebarUserMenu from '../components/SidebarUserMenu';
import { useAuth } from '../context/AuthContext';
import { candidateNeedsProfileOnboarding } from '../utils/authRedirect';

export type CandidateLayoutContext = {
  selectedCvId: number | null;
  setSelectedCvId: React.Dispatch<React.SetStateAction<number | null>>;
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
    isActive
      ? 'bg-brand-primary text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-brand-black'
  }`;

const CandidateLayout = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);

  const navItems = useMemo(
    (): { to: string; end?: boolean; label: string; icon: React.ReactNode }[] => [
      { to: '/dashboard', end: true, label: t('layouts.candidateNavOverview'), icon: <LayoutDashboard size={18} /> },
      { to: '/dashboard/applications', label: t('layouts.candidateNavApplications'), icon: <Send size={18} /> },
      { to: '/dashboard/cv', label: t('layouts.candidateNavCv'), icon: <FileText size={18} /> },
      { to: '/dashboard/jobs', label: t('layouts.candidateNavJobs'), icon: <Search size={18} /> },
    ],
    [t],
  );

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

  if (
    user?.role === 'CANDIDATE' &&
    candidateNeedsProfileOnboarding(user) &&
    !location.pathname.startsWith('/dashboard/onboarding')
  ) {
    return <Navigate to="/dashboard/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="shrink-0 w-full md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col">
        <SidebarBrand />
        <p className="hidden md:block text-[10px] font-black uppercase tracking-wider text-gray-400 px-4 pt-3 pb-1">
          {t('layouts.candidateHub')}
        </p>
        <nav className="flex md:flex-col gap-1 p-3 md:px-3 overflow-x-auto md:overflow-visible md:flex-1 md:min-h-0">
          {navItems.map(({ to, end, label, icon }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>
        <SidebarUserMenu />
      </aside>
      <div className="flex-1 min-w-0 min-h-0">
        <Outlet context={{ selectedCvId, setSelectedCvId } as CandidateLayoutContext} />
      </div>
    </div>
  );
};

export default CandidateLayout;
