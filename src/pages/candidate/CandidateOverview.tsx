import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Info, Loader2, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import type { Job, CV, MyApplication } from '../../types';

const CandidateOverview = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsData, cvData, appsData] = await Promise.all([
        api.listJobs(),
        api.getUserCV(),
        api.listMyApplications(),
      ]);
      setJobs(jobsData);
      setCvs(cvData);
      setMyApps(appsData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const parsedCvCount = cvs.filter((c) => c.is_parsed).length;

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="medium">
        <div className="flex items-center justify-center min-h-[40vh] text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} />
          Loading…
        </div>
      </PageLayout.Shell>
    );
  }

  const quick = [
    { to: '/dashboard/applications', title: 'My applications', desc: `${myApps.length} total` },
    { to: '/dashboard/cv', title: 'My CV', desc: `${cvs.length} file(s)` },
    { to: '/dashboard/jobs', title: 'Find jobs', desc: `${jobs.length} open roles` },
  ];

  return (
    <PageLayout
      maxWidth="medium"
      title="Your career hub"
      subtitle={`Hi ${user?.username ?? 'there'} — use the sidebar to move between tasks, or jump in below.`}
    >
      <div className="rounded-3xl border border-brand-primary-soft bg-brand-primary-faint/60 p-5 md:p-6 flex gap-4">
        <Info className="text-brand-primary shrink-0 mt-0.5" size={22} />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-bold text-brand-black">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>
              Upload a CV — we run{' '}
              <span className="ai-text-gradient font-bold">AI analysis</span> automatically so
              employers can compare applicants fairly.
            </li>
            <li>
              On Find jobs, use <strong>Easy apply</strong> and pick which CV to send for each role.
            </li>
            <li>Track applications; match scores update when you apply (if your CV was analyzed).</li>
            <li>
              If marked <strong>rejected</strong>, open your growth report from Applications.
            </li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">Open roles</p>
          <p className="text-2xl font-black text-brand-black">{jobs.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">Applications</p>
          <p className="text-2xl font-black text-brand-primary">{myApps.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">CVs</p>
          <p className="text-2xl font-black text-brand-black">{cvs.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">Analyzed</p>
          <p className="text-2xl font-black text-brand-primary">{parsedCvCount}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quick.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="group flex items-center justify-between rounded-3xl border border-gray-100 bg-white p-5 md:p-6 hover:border-brand-primary transition-colors"
          >
            <div>
              <p className="font-bold text-brand-black group-hover:text-brand-primary">{q.title}</p>
              <p className="text-xs text-gray-500 mt-1">{q.desc}</p>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-brand-primary" size={20} />
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        Public catalog:{' '}
        <Link to="/jobs" className="text-brand-primary font-semibold hover:underline">
          Browse all jobs
        </Link>
      </p>
    </PageLayout>
  );
};

export default CandidateOverview;
