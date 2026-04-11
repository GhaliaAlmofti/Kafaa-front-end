import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import {
  Plus,
  Briefcase,
  MapPin,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
  Calendar,
  FileText,
  BookOpen,
} from 'lucide-react';
import { formatPostedDate } from '../../utils/formatPostedDate';
import type {
  Company,
  AdminJobRow,
  AdminGlobalApplicationRow,
  JobApplication,
  GrowthReport,
} from '../../types';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';
import { GrowthReportModal } from '../../components/GrowthReportModal';
import { MatchScoreExplainability } from '../../components/MatchScoreExplainability';

const STATUS_ACTIONS: JobApplication['status'][] = ['reviewed', 'accepted', 'rejected'];

function statusBadgeClass(status: JobApplication['status']) {
  switch (status) {
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80';
    case 'rejected':
      return 'bg-red-100 text-red-800 ring-1 ring-red-200/80';
    case 'reviewed':
      return 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80';
    default:
      return 'bg-amber-100 text-amber-900 ring-1 ring-amber-200/80';
  }
}

function scorePillClass(score: number | null) {
  if (score == null) return 'bg-gray-100 text-gray-500';
  if (score >= 80) return 'bg-brand-primary-soft text-brand-primary-mid';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-gray-200 text-gray-700';
}

const AdminJobsPage = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJobRow[]>([]);
  const [adminGlobalApps, setAdminGlobalApps] = useState<AdminGlobalApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState<{
    title: string;
    description: string;
    location: string;
    job_type: string;
  }>({
    title: '',
    description: '',
    location: '',
    job_type: 'FULL_TIME',
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<Record<number, JobApplication[]>>({});
  const [loadingAppsForJob, setLoadingAppsForJob] = useState<number | null>(null);
  const [patchingAppId, setPatchingAppId] = useState<number | null>(null);
  const [expandedReasonAppId, setExpandedReasonAppId] = useState<number | null>(null);
  const [growthForApp, setGrowthForApp] = useState<{
    id: number;
    data: GrowthReport | null;
    loading: boolean;
    error: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [companiesData, jobsData, appsData] = await Promise.all([
        api.listCompanies(),
        api.listAdminJobs(),
        api.listAdminApplications().catch(() => [] as AdminGlobalApplicationRow[]),
      ]);
      setCompanies(companiesData);
      setAdminJobs(jobsData);
      setAdminGlobalApps(appsData);
      setSelectedCompanyId((prev) => prev ?? companiesData[0]?.id ?? null);
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      setError('Select a company before posting a job.');
      return;
    }
    try {
      setError('');
      await api.createJob({ ...newJob, company_id: selectedCompanyId });
      fetchData();
      setNewJob({ title: '', description: '', location: '', job_type: 'FULL_TIME' });
      setShowJobForm(false);
    } catch {
      setError('Failed to create job');
    }
  };

  const toggleJobExpand = (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    if (!jobApplications[jobId]) {
      void loadJobApplications(jobId);
    }
  };

  const loadJobApplications = async (jobId: number, opts?: { quiet?: boolean }) => {
    try {
      if (!opts?.quiet) setLoadingAppsForJob(jobId);
      const rows = await api.listJobApplications(jobId);
      setJobApplications((prev) => ({ ...prev, [jobId]: rows }));
    } catch {
      setError('Could not load applications for this job.');
    } finally {
      if (!opts?.quiet) setLoadingAppsForJob(null);
    }
  };

  const sortedApplications = useCallback((list: JobApplication[]) => {
    return [...list].sort((a, b) => {
      const sa = a.match_score ?? -1;
      const sb = b.match_score ?? -1;
      if (sb !== sa) return sb - sa;
      return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
    });
  }, []);

  const handleApplicationStatus = async (jobId: number, appId: number, status: JobApplication['status']) => {
    try {
      setPatchingAppId(appId);
      setError('');
      await api.patchJobApplication(appId, { status });
      await loadJobApplications(jobId, { quiet: true });
    } catch {
      setError('Could not update application status.');
    } finally {
      setPatchingAppId(null);
    }
  };

  const openGrowthReport = async (applicationId: number) => {
    setGrowthForApp({ id: applicationId, data: null, loading: true, error: '' });
    try {
      const data = await api.getGrowthReport(applicationId);
      setGrowthForApp({ id: applicationId, data, loading: false, error: '' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load report';
      setGrowthForApp({ id: applicationId, data: null, loading: false, error: msg });
    }
  };

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh] text-gray-500">Loading…</div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title={t('adminSuperView.pageTitle')}
      subtitle={t('adminSuperView.pageSubtitle')}
      actions={
        <button type="button" onClick={() => setShowJobForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Post job
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 border border-gray-100 mb-8">
        <h2 className="text-lg font-black text-brand-black mb-1">{t('adminSuperView.globalIndexTitle')}</h2>
        <p className="text-sm text-gray-500 mb-4">{t('adminSuperView.globalIndexHint')}</p>
        {adminGlobalApps.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No applications yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[10px] font-black uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Applicant</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 whitespace-nowrap">Applied</th>
                </tr>
              </thead>
              <tbody>
                {adminGlobalApps.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-bold text-brand-black">
                      {row.applicant_name || `User #${row.applicant}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.job_title}</td>
                    <td className="px-4 py-3 text-gray-600">{row.company_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusBadgeClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(row.applied_at).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Briefcase className="text-brand-primary" /> Jobs ({adminJobs.length})
        </h2>
        <div className="space-y-4">
          {adminJobs.map((job) => {
            const expanded = expandedJobId === job.id;
            const apps = sortedApplications(jobApplications[job.id] ?? []);
            return (
              <div
                key={job.id}
                className="rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-6 hover:border-brand-primary transition-all">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.company_name ?? '—'} · @{job.owner_username}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {job.location}
                        </span>
                        {job.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar size={14} aria-hidden />
                            {formatPostedDate(job.created_at)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={14} /> {job.application_count ?? 0} applications
                        </span>
                        <span
                          className={`font-bold uppercase ${
                            job.is_active !== false ? 'text-brand-primary' : 'text-gray-500'
                          }`}
                        >
                          {job.is_active !== false ? 'Listing open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-brand-primary-faint text-brand-primary text-xs font-bold rounded-full uppercase">
                        {job.job_type}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleJobExpand(job.id)}
                        className="text-xs font-bold flex items-center gap-1 text-brand-primary hover:underline"
                      >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expanded ? 'Hide' : 'View'} applications
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mt-4">{job.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Posted {new Date(job.created_at).toLocaleDateString()} · Job #{job.id}
                  </p>
                </div>
                {expanded && (
                  <div className="border-t border-gray-100 bg-gradient-to-b from-gray-50/90 to-gray-50/40 px-4 py-5 sm:px-6">
                    {loadingAppsForJob === job.id ? (
                      <div className="flex items-center justify-center gap-2 py-10 text-gray-500 text-sm">
                        <Loader2 className="animate-spin" size={18} /> Loading applicants…
                      </div>
                    ) : apps.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-10 text-center">
                        <Users className="mx-auto text-gray-300 mb-2" size={32} />
                        <p className="text-sm font-medium text-gray-600">No applications yet</p>
                        <p className="text-xs text-gray-400 mt-1">Candidates will appear here after they apply.</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                              Applicants
                            </p>
                            <p className="text-sm font-bold text-brand-black">
                              {apps.length} {apps.length === 1 ? 'person' : 'people'} · sorted by match score
                            </p>
                          </div>
                        </div>
                        <ul className="grid gap-3 sm:gap-4">
                          {apps.map((app, idx) => {
                            const initial = (app.applicant_name || '?').charAt(0).toUpperCase();
                            const reasonExpanded = expandedReasonAppId === app.id;
                            const hasReason = Boolean(app.match_reason?.trim());
                            return (
                              <motion.li
                                key={app.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="flex gap-3 min-w-0">
                                    <div
                                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-black text-sm font-black text-white"
                                      aria-hidden
                                    >
                                      {initial}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-brand-black truncate">
                                        {app.applicant_name || `Applicant #${app.applicant}`}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        Applied{' '}
                                        {new Date(app.applied_at).toLocaleString(undefined, {
                                          dateStyle: 'medium',
                                          timeStyle: 'short',
                                        })}
                                        <span className="text-gray-300"> · </span>
                                        <span
                                          className={
                                            app.cv_is_parsed
                                              ? 'text-brand-primary font-semibold'
                                              : 'text-amber-700 font-semibold'
                                          }
                                        >
                                          CV {app.cv_is_parsed ? 'analyzed' : 'not analyzed'}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`self-start shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusBadgeClass(app.status)}`}
                                  >
                                    {app.status}
                                  </span>
                                </div>

                                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                  <div
                                    className={`flex shrink-0 flex-col items-center justify-center rounded-xl px-4 py-3 sm:min-w-[5.5rem] ${scorePillClass(app.match_score)}`}
                                  >
                                    <span className="text-[10px] font-black uppercase opacity-80">
                                      Match
                                    </span>
                                    <MatchScoreExplainability
                                      score={app.match_score}
                                      reason={app.match_reason}
                                      matched={app.match_matched_skills}
                                      missing={app.match_missing_skills}
                                      variant="pill"
                                      className="text-inherit"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1 rounded-xl bg-gray-50/80 px-3 py-2.5 border border-gray-100/80">
                                    {hasReason ? (
                                      <>
                                        <p
                                          className={`text-xs text-gray-600 leading-relaxed ${reasonExpanded ? '' : 'line-clamp-3'}`}
                                        >
                                          {app.match_reason}
                                        </p>
                                        {app.match_reason && app.match_reason.length > 140 && (
                                          <button
                                            type="button"
                                            className="mt-1 text-[10px] font-bold uppercase text-brand-primary hover:underline"
                                            onClick={() =>
                                              setExpandedReasonAppId(reasonExpanded ? null : app.id)
                                            }
                                          >
                                            {reasonExpanded ? 'Show less' : 'Show full reason'}
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <p className="text-xs text-gray-400 italic">
                                        No match summary yet (often appears after CV analysis).
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                  {app.cv_file ? (
                                    <a
                                      href={app.cv_file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-brand-black transition hover:border-brand-primary hover:text-brand-primary"
                                    >
                                      <FileText size={16} className="text-brand-primary" />
                                      Open CV
                                      <ExternalLink size={14} className="opacity-50" />
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-400">No CV file link</span>
                                  )}
                                  <div className="ml-auto flex flex-wrap justify-end gap-1.5">
                                    {STATUS_ACTIONS.map((st) => (
                                      <button
                                        key={st}
                                        type="button"
                                        disabled={patchingAppId === app.id || app.status === st}
                                        onClick={() => void handleApplicationStatus(job.id, app.id, st)}
                                        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-gray-700 transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-40 disabled:pointer-events-none"
                                      >
                                        {st}
                                      </button>
                                    ))}
                                    {app.status === 'rejected' && (
                                      <button
                                        type="button"
                                        onClick={() => void openGrowthReport(app.id)}
                                        className="inline-flex items-center gap-1 rounded-lg bg-brand-black px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-brand-primary"
                                      >
                                        <BookOpen size={12} />
                                        Growth report
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </motion.li>
                            );
                          })}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {adminJobs.length === 0 && (
            <p className="text-center text-gray-400 py-12">No jobs posted yet.</p>
          )}
        </div>
      </div>

      {showJobForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 w-full max-w-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Post job</h2>
            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field"
                  placeholder="Job title"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
                <select
                  className="input-field"
                  required
                  value={selectedCompanyId ?? ''}
                  onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                >
                  <option value="" disabled>
                    Select company
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                      {company.is_blocked ? ' (blocked)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="input-field"
                  value={newJob.job_type}
                  onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
              <input
                className="input-field"
                placeholder="Location"
                required
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              />
              <textarea
                className="input-field h-32 resize-none"
                placeholder="Job description"
                required
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="flex-1 py-2 text-gray-500 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Post job
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <GrowthReportModal
        open={growthForApp !== null}
        onClose={() => setGrowthForApp(null)}
        title={t('candidateGrowth.title')}
        applicationId={growthForApp?.id ?? null}
        showApplicationId
        loading={growthForApp?.loading ?? false}
        error={growthForApp?.error ?? ''}
        data={growthForApp?.data ?? null}
        dismissLabel={t('common.close')}
      />
    </PageLayout>
  );
};

export default AdminJobsPage;
