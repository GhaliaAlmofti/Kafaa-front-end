import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Info, Loader2, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
      <div className="p-8 flex items-center justify-center text-gray-500 gap-2">
        <Loader2 className="animate-spin" size={22} />
        Loading…
      </div>
    );
  }

  const quick = [
    { to: '/dashboard/applications', title: 'My applications', desc: `${myApps.length} total` },
    { to: '/dashboard/cv', title: 'My CV', desc: `${cvs.length} file(s)` },
    { to: '/dashboard/jobs', title: 'Find jobs', desc: `${jobs.length} open roles` },
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-black">Your career hub</h1>
        <p className="text-gray-500 mt-2">
          Hi {user?.username ?? 'there'} — use the sidebar to move between tasks, or jump in below.
        </p>
      </header>

      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 flex gap-4">
        <Info className="text-brand-green shrink-0 mt-0.5" size={22} />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-bold text-brand-black">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>
              Upload a CV — we run <strong>AI analysis</strong> automatically so employers can compare
              applicants fairly.
            </li>
            <li>Pick which CV to attach when you apply — you can keep several versions.</li>
            <li>Track applications; match scores update when you apply (if your CV was analyzed).</li>
            <li>
              If marked <strong>rejected</strong>, open your growth report from Applications.
            </li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">Open roles</p>
          <p className="text-2xl font-black text-brand-black">{jobs.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">Applications</p>
          <p className="text-2xl font-black text-brand-green">{myApps.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">CVs</p>
          <p className="text-2xl font-black text-brand-black">{cvs.length}</p>
        </div>
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">Analyzed</p>
          <p className="text-2xl font-black text-emerald-600">{parsedCvCount}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quick.map((q) => (
          <Link
            key={q.to}
            to={q.to}
            className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-brand-green transition-colors"
          >
            <div>
              <p className="font-bold text-brand-black group-hover:text-brand-green">{q.title}</p>
              <p className="text-xs text-gray-500 mt-1">{q.desc}</p>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-brand-green" size={20} />
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        Public catalog:{' '}
        <Link to="/jobs" className="text-brand-green font-semibold hover:underline">
          Browse all jobs
        </Link>
      </p>
    </div>
  );
};

export default CandidateOverview;
