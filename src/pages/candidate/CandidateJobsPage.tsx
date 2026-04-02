import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Briefcase,
  MapPin,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Loader2,
  FileText,
  Zap,
} from 'lucide-react';
import { formatPostedDate } from '../../utils/formatPostedDate';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';
import type { Job, MyApplication } from '../../types';

const CandidateJobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [cvs, setCvs] = useState<{ id: number; is_parsed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [modalCvId, setModalCvId] = useState<number | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [jobSearch, setJobSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsData, appsData, cvData] = await Promise.all([
        api.listJobs(),
        api.listMyApplications(),
        api.getUserCV(),
      ]);
      setJobs(jobsData);
      setMyApps(appsData);
      setCvs(cvData.map((c) => ({ id: c.id, is_parsed: c.is_parsed })));
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const appliedJobIds = useMemo(() => new Set(myApps.map((a) => a.job)), [myApps]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchQ =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      const matchT = !jobTypeFilter || job.job_type === jobTypeFilter;
      return matchQ && matchT;
    });
  }, [jobs, jobSearch, jobTypeFilter]);

  const openEasyApplyModal = (job: Job) => {
    setModalError('');
    setApplyModalJob(job);
    const preferred = cvs.find((c) => c.is_parsed)?.id ?? cvs[0]?.id ?? null;
    setModalCvId(preferred);
  };

  const closeApplyModal = () => {
    if (applySubmitting) return;
    setApplyModalJob(null);
    setModalError('');
    setModalCvId(null);
  };

  const submitEasyApply = async () => {
    if (!applyModalJob || modalCvId == null) return;
    setModalError('');
    try {
      setApplySubmitting(true);
      await api.applyJob({ job: applyModalJob.id, cv: modalCvId });
      setMyApps(await api.listMyApplications());
      setApplyModalJob(null);
      setModalCvId(null);
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Apply failed';
      setModalError(raw);
    } finally {
      setApplySubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex justify-center min-h-[40vh] items-center text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} aria-hidden />
          Loading jobs…
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="Find jobs"
      subtitle="Search open roles. Use Easy apply on a job to choose which CV to send."
    >
      <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search title, location, description…"
              className="input-field pl-10 w-full"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field md:max-w-[180px]"
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
        {filteredJobs.map((job) => {
          const applied = appliedJobIds.has(job.id);
          const expanded = expandedJobId === job.id;
          return (
            <motion.div
              key={job.id}
              layout
              className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 md:p-6 flex flex-col"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-start gap-3 min-w-0">
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50"
                    />
                  ) : null}
                  <div className="min-w-0">
                    {job.company_name && (
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        {job.company_name}
                      </p>
                    )}
                    <h3 className="text-lg font-bold text-brand-black">{job.title}</h3>
                  </div>
                </div>
                {applied && (
                  <span className="shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-brand-primary-soft text-brand-primary-deep">
                    Applied
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={14} />
                  {job.job_type}
                </span>
                {job.created_at && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Calendar size={14} aria-hidden />
                    {formatPostedDate(job.created_at)}
                  </span>
                )}
              </div>
              <p className={`text-sm text-gray-600 mt-3 ${expanded ? '' : 'line-clamp-3'}`}>
                {job.description}
              </p>
              <button
                type="button"
                onClick={() => setExpandedJobId(expanded ? null : job.id)}
                className="mt-2 text-xs font-bold text-brand-primary hover:underline self-start flex items-center gap-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Read full description
                  </>
                )}
              </button>
              <div className="mt-4 flex flex-wrap gap-2">
                {!applied ? (
                  <button
                    type="button"
                    className="btn-primary inline-flex items-center gap-2"
                    onClick={() => openEasyApplyModal(job)}
                  >
                    <Zap size={18} aria-hidden />
                    Easy apply
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle size={16} className="text-brand-primary-bright" />
                    You have already applied.
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
        </div>
        {filteredJobs.length === 0 ? (
          <p className="text-gray-400 text-center py-12 border border-dashed border-gray-200 rounded-2xl text-sm">
            No jobs match your filters.{' '}
            <button
              type="button"
              className="text-brand-primary font-semibold"
              onClick={() => {
                setJobSearch('');
                setJobTypeFilter('');
              }}
            >
              Clear filters
            </button>
          </p>
        ) : null}
      </section>

      {applyModalJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="easy-apply-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeApplyModal();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary-soft text-brand-primary">
                <Zap size={22} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="easy-apply-title" className="text-lg font-bold text-brand-black">
                  Easy apply
                </h2>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{applyModalJob.title}</p>
                {applyModalJob.company_name && (
                  <p className="text-xs text-gray-400 mt-0.5">{applyModalJob.company_name}</p>
                )}
              </div>
            </div>

            {cvs.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center text-sm text-gray-600">
                <FileText className="mx-auto mb-2 text-gray-400" size={28} aria-hidden />
                <p className="font-medium text-brand-black">No CV on file</p>
                <p className="mt-1 text-gray-500">Upload a CV on My CV before you can apply.</p>
                <Link
                  to="/dashboard/cv"
                  className="mt-4 inline-block btn-primary text-sm py-2.5 px-5"
                  onClick={closeApplyModal}
                >
                  Go to My CV
                </Link>
              </div>
            ) : (
              <>
                <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">
                  Choose CV to send
                </p>
                <ul className="mt-2 space-y-2 max-h-[220px] overflow-y-auto">
                  {cvs.map((cv) => {
                    const selected = modalCvId === cv.id;
                    return (
                      <li key={cv.id}>
                        <button
                          type="button"
                          onClick={() => setModalCvId(cv.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                            selected
                              ? 'border-brand-primary bg-brand-primary-faint ring-1 ring-brand-primary/20'
                              : 'border-gray-100 hover:border-gray-200 bg-white'
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 rounded-full border-2 ${
                              selected
                                ? 'border-brand-primary bg-brand-primary'
                                : 'border-gray-300'
                            }`}
                            aria-hidden
                          >
                            {selected ? (
                              <span className="m-auto block h-1.5 w-1.5 rounded-full bg-white" />
                            ) : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-brand-black truncate block">
                              {cv.display_name?.trim() || 'CV'}
                            </span>
                            <span
                              className={`ml-2 text-xs font-semibold ${
                                cv.is_parsed ? 'text-brand-primary' : 'text-amber-600'
                              }`}
                            >
                              {cv.is_parsed ? 'Analyzed' : 'Not analyzed'}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  Analyzed CVs usually get better match scores after you apply.
                </p>
              </>
            )}

            {modalError ? (
              <div className="mt-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden />
                <p>{modalError}</p>
              </div>
            ) : null}

            {cvs.length > 0 ? (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={applySubmitting}
                  onClick={closeApplyModal}
                  className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={applySubmitting || modalCvId == null}
                  onClick={() => void submitEasyApply()}
                  className="flex-1 btn-primary py-3 text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {applySubmitting ? (
                    <Loader2 className="animate-spin" size={18} aria-hidden />
                  ) : (
                    <Zap size={18} aria-hidden />
                  )}
                  Apply
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={closeApplyModal}
                className="mt-4 w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>
            )}
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
};

export default CandidateJobsPage;
