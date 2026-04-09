import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { Building2, LayoutDashboard } from 'lucide-react';
import { api } from '../services/api';
import type { Job } from '../types';
import SidebarBrand from '../components/SidebarBrand';
import SidebarUserMenu from '../components/SidebarUserMenu';

export type RecruiterLayoutContext = {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
    isActive
      ? 'bg-brand-primary text-white'
      : 'text-gray-600 hover:bg-gray-100 hover:text-brand-black'
  }`;

const RecruiterLayout = () => {
  const { t } = useTranslation();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const jobsData = await api.listMyJobs();
      setJobs(jobsData);
    } catch {
      setError(t('recruiterLayout.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <aside className="shrink-0 w-full md:w-56 md:min-h-screen border-b md:border-b-0 md:border-r border-gray-200 bg-white flex flex-col">
        <SidebarBrand />
        <p className="hidden md:block text-[10px] font-black uppercase tracking-wider text-gray-400 px-4 pt-3 pb-1">
          {t('layouts.recruiterSection')}
        </p>
        <nav className="flex md:flex-col gap-1 p-3 md:px-3 overflow-x-auto md:overflow-visible md:flex-1 md:min-h-0">
          <NavLink to="/recruiter" className={linkClass} end>
            <LayoutDashboard size={18} />
            {t('layouts.recruiterNavDashboard')}
          </NavLink>
          <NavLink to="/recruiter/company" className={linkClass}>
            <Building2 size={18} />
            {t('layouts.recruiterNavCompany')}
          </NavLink>
        </nav>
        <SidebarUserMenu />
      </aside>
      <div className="flex-1 min-w-0 min-h-0">
        <Outlet context={{ jobs, setJobs, loading, error, refetch } as RecruiterLayoutContext} />
      </div>
    </div>
  );
};

export default RecruiterLayout;
