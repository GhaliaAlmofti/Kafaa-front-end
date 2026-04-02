import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Briefcase, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';
import type { Company, AdminJobRow } from '../../types';

const AdminOverview = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJobRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [companiesData, jobsData] = await Promise.all([
        api.listCompanies(),
        api.listAdminJobs(),
      ]);
      setCompanies(companiesData);
      setAdminJobs(jobsData);
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const blockedCount = companies.filter((c) => c.is_blocked).length;
  const activeJobsCount = adminJobs.filter((j) => j.is_active !== false).length;
  const totalApplications = adminJobs.reduce((s, j) => s + (j.application_count ?? 0), 0);

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center text-gray-500 min-h-[40vh]">Loading…</div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="Admin overview"
      subtitle="Companies, job health, and applications at a glance"
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase text-gray-400">Companies</p>
          <p className="text-2xl font-black text-brand-black">{companies.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase text-gray-400">Blocked</p>
          <p className="text-2xl font-black text-red-600">{blockedCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase text-gray-400">Jobs</p>
          <p className="text-2xl font-black text-brand-black">{adminJobs.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4">
          <p className="text-[10px] font-black uppercase text-gray-400">Active listings</p>
          <p className="text-2xl font-black text-brand-primary">{activeJobsCount}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4 col-span-2 md:col-span-1">
          <p className="text-[10px] font-black uppercase text-gray-400">Applications</p>
          <p className="text-2xl font-black text-brand-primary">{totalApplications}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <NavLink
          to="/admin/companies"
          className="group rounded-3xl bg-white border border-gray-100 p-6 hover:border-brand-primary transition-colors flex items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-brand-primary mb-2">
              <Building2 size={22} />
              <span className="font-black text-brand-black text-lg">Companies</span>
            </div>
            <p className="text-sm text-gray-500">
              Add recruiter accounts, block or unblock companies, and review profiles.
            </p>
          </div>
          <ArrowRight
            className="shrink-0 text-gray-300 group-hover:text-brand-primary transition-colors"
            size={22}
          />
        </NavLink>
        <NavLink
          to="/admin/jobs"
          className="group rounded-3xl bg-white border border-gray-100 p-6 hover:border-brand-primary transition-colors flex items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-brand-primary mb-2">
              <Briefcase size={22} />
              <span className="font-black text-brand-black text-lg">Jobs</span>
            </div>
            <p className="text-sm text-gray-500">
              Post roles for a company, review listings, and drill into applications.
            </p>
          </div>
          <ArrowRight
            className="shrink-0 text-gray-300 group-hover:text-brand-primary transition-colors"
            size={22}
          />
        </NavLink>
      </div>
    </PageLayout>
  );
};

export default AdminOverview;
