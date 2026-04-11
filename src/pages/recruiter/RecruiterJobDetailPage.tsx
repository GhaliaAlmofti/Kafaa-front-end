import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  Briefcase,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import type { JobApplication, GrowthReport, JobRecruiterAnalytics } from '../../types';
import type { RecruiterLayoutContext } from '../../layouts/RecruiterLayout';
import PageLayout from '../../components/PageLayout';
import { GrowthReportModal } from '../../components/GrowthReportModal';
import { MatchScoreExplainability } from '../../components/MatchScoreExplainability';

const STATUS_ACTIONS: JobApplication['status'][] = ['reviewed', 'accepted', 'rejected'];

const RecruiterJobDetailPage = () => {
  const { t } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { jobs, setJobs, loading: layoutLoading, error: layoutError } =
    useOutletContext<RecruiterLayoutContext>();

  const id = jobId ? Number(jobId) : NaN;
  const job = Number.isFinite(id) ? jobs.find((j) => j.id === id) : undefined;

  const [error, setError] = useState('');
  const [expandedApps, setExpandedApps] = useState(true);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const [patchingApp, setPatchingApp] = useState<number | null>(null);
  const [patchingJob, setPatchingJob] = useState(false);
  const [growthForApp, setGrowthForApp] = useState<{
    id: number;
    data: GrowthReport | null;
    loading: boolean;
    error: string;
  } | null>(null);
  const [analytics, setAnalytics] = useState<JobRecruiterAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const displayError = error || layoutError;

  const loadApplications = useCallback(async (jid: number) => {
    try {
      setLoadingApps(true);
      const rows = await api.listJobApplications(jid);
      setJobApplications(rows);
      setAppsLoaded(true);
    } catch {
      setError('Could not load applications for this job.');
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (layoutLoading || !Number.isFinite(id)) return;
    void loadApplications(id);
  }, [id, layoutLoading, loadApplications]);

  useEffect(() => {
    if (layoutLoading || !Number.isFinite(id) || !job) return;
    let cancelled = false;
    setAnalyticsLoading(true);
    void api
      .getJobRecruiterAnalytics(id)
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, job, layoutLoading]);

  const scoredApps = useMemo(() => {
    return [...jobApplications]
      .filter((a) => a.match_score != null)
      .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0));
  }, [jobApplications]);

  /** Top 5 by match score among candidates who passed mandatory screening (not knockout_failed). */
  const topFiveQualified = useMemo(() => {
    return scoredApps.filter((a) => !a.knockout_failed).slice(0, 5);
  }, [scoredApps]);

  const hasAnyScore = scoredApps.length > 0;

  const handleStatus = async (appId: number, status: JobApplication['status']) => {
    if (!job) return;
    try {
      setPatchingApp(appId);
      await api.patchJobApplication(appId, { status });
      await loadApplications(job.id);
    } catch {
      setError('Could not update application status.');
    } finally {
      setPatchingApp(null);
    }
  };

  const toggleJobActive = async () => {
    if (!job) return;
    try {
      setPatchingJob(true);
      const isOpen = job.is_active !== false;
      const updated = await api.patchJob(job.id, { is_active: !isOpen });
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, ...updated } : j)));
    } catch {
      setError('Could not update job visibility.');
    } finally {
      setPatchingJob(false);
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

  if (layoutLoading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-brand-primary" size={40} />
        </div>
      </PageLayout.Shell>
    );
  }

  if (!job) {
    return (
      <PageLayout.Shell maxWidth="narrow">
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Job not found or you do not have access.</p>
          <button type="button" className="btn-primary" onClick={() => navigate('/recruiter')}>
            Back to all jobs
          </button>
        </div>
      </PageLayout.Shell>
    );
  }

  const isOpen = job.is_active !== false;
  const apps = jobApplications;

  return (
    <PageLayout
      maxWidth="wide"
      showHeader={false}
      top={
        <Link
          to="/recruiter"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-primary"
        >
          <ArrowLeft size={18} />
          All jobs
        </Link>
      }
    >
      {displayError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle size={20} /> {displayError}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-white flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-brand-black">{job.title}</h1>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isOpen ? 'bg-brand-primary-soft text-brand-primary-deep' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {isOpen ? 'Listing open' : 'Listing closed'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Briefcase size={14} /> {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} /> {appsLoaded ? apps.length : '—'} applications
              </span>
              <span className="text-xs text-gray-400">{job.job_type}</span>
            </div>
            {analyticsLoading ? (
              <p className="text-xs text-gray-400 mt-2">Loading analytics…</p>
            ) : analytics ? (
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600 mt-3">
                <span title="Distinct visitors who opened this job (candidate views)">
                  Job views: {analytics.unique_viewers}
                </span>
                <span title="Applications submitted">Apply clicks: {analytics.apply_count}</span>
                <span title="Currently shortlisted (Accepted)">Shortlisted: {analytics.shortlisted_count}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void toggleJobActive()}
              disabled={patchingJob}
              className="text-sm font-bold px-4 py-2 rounded-xl border border-gray-200 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50"
            >
              {patchingJob ? 'Saving…' : isOpen ? 'Close listing' : 'Open listing'}
            </button>
            <button
              type="button"
              onClick={() => setExpandedApps((e) => !e)}
              className="text-sm font-bold px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-1 hover:bg-gray-50"
            >
              {expandedApps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {expandedApps ? 'Hide' : 'Show'} applications
            </button>
          </div>
        </div>

        {expandedApps && (
          <div className="p-6 bg-gray-50/50 border-b border-gray-100">
            {loadingApps && !appsLoaded ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
                <Loader2 className="animate-spin" size={20} /> Loading applications…
              </div>
            ) : apps.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">
                No applications yet for this role.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                      <th className="pb-3 pr-4">Candidate</th>
                      <th className="pb-3 pr-4">Applied</th>
                      <th className="pb-3 pr-4">CV</th>
                      <th className="pb-3 pr-4">Score</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((app) => (
                      <tr key={app.id} className="border-b border-gray-100 align-top">
                        <td className="py-3 pr-4 font-medium">{app.applicant_name}</td>
                        <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                          {new Date(app.applied_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-[10px] font-bold uppercase ${app.cv_is_parsed ? 'text-brand-primary' : 'text-amber-600'}`}
                          >
                            {app.cv_is_parsed ? 'Parsed' : 'Not parsed'}
                          </span>
                          {app.cv_file && (
                            <a
                              href={app.cv_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 inline-flex text-brand-primary hover:underline"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col gap-1 items-start">
                            {app.knockout_failed ? (
                              <span
                                className="text-[10px] font-black uppercase tracking-wide text-red-800 bg-red-100 px-2 py-0.5 rounded-md"
                                title={(app.knockout_reasons ?? []).join('; ') || undefined}
                              >
                                {t('recruiterJobDetail.notQualified')}
                              </span>
                            ) : null}
                            <MatchScoreExplainability
                              score={app.match_score}
                              reason={app.match_reason}
                              matched={app.match_matched_skills}
                              missing={app.match_missing_skills}
                            />
                          </div>
                        </td>
                        <td className="py-3 pr-4 capitalize text-gray-600">{app.status}</td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {STATUS_ACTIONS.map((st) => (
                              <button
                                key={st}
                                type="button"
                                disabled={patchingApp === app.id}
                                onClick={() => void handleStatus(app.id, st)}
                                className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-white border border-gray-200 hover:border-brand-primary disabled:opacity-50"
                              >
                                {st}
                              </button>
                            ))}
                            {app.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => void openGrowthReport(app.id)}
                                className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-brand-black text-white hover:bg-brand-primary flex items-center gap-1"
                              >
                                <BookOpen size={12} /> Report
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="p-6 bg-gray-50/30">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            {t('recruiterJobDetail.topFiveTitle')}
          </p>
          <p className="text-xs text-gray-500 mb-4">{t('recruiterJobDetail.topFiveSubtitle')}</p>
          {!hasAnyScore ? (
            <div className="text-center py-8 text-gray-400 italic text-sm">
              {t('recruiterJobDetail.scoresEmpty')}
            </div>
          ) : topFiveQualified.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              {t('recruiterJobDetail.topFiveNoneQualified')}
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-12 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-1 text-center">{t('recruiterJobDetail.gridRank')}</div>
                <div className="col-span-4">{t('recruiterJobDetail.gridCandidate')}</div>
                <div className="col-span-2 text-center">{t('recruiterJobDetail.gridScore')}</div>
                <div className="col-span-4">{t('recruiterJobDetail.gridReasoning')}</div>
                <div className="col-span-1 text-right">{t('recruiterJobDetail.gridCv')}</div>
              </div>

              {topFiveQualified.map((app, rankIdx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={app.id}
                  className="grid grid-cols-12 items-center bg-white p-4 rounded-2xl border border-gray-100 transition-colors hover:border-gray-300 gap-2"
                >
                  <div className="col-span-1 flex flex-col items-center justify-center gap-1 min-w-0">
                    <span className="font-black text-brand-primary tabular-nums text-sm">
                      #{rankIdx + 1}
                    </span>
                    <MatchScoreExplainability
                      trigger="icon"
                      score={app.match_score}
                      reason={app.match_reason}
                      matched={app.match_matched_skills}
                      missing={app.match_missing_skills}
                    />
                  </div>

                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center text-white font-bold shrink-0">
                      {app.applicant_name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-brand-black truncate">
                        {app.applicant_name || `Candidate #${app.id}`}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {app.status} · {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 text-center">
                    <div
                      className={`inline-block px-3 py-1 rounded-full font-black text-sm tabular-nums ${
                        (app.match_score ?? 0) >= 80
                          ? 'bg-brand-primary-soft text-brand-primary-mid'
                          : (app.match_score ?? 0) >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {app.match_score != null ? t('matchScore.scorePercent', { score: app.match_score }) : 'N/A'}
                    </div>
                  </div>

                  <div className="col-span-4 min-w-0">
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {app.match_reason || '—'}
                    </p>
                  </div>

                  <div className="col-span-1 text-right">
                    {app.cv_file ? (
                      <a
                        href={app.cv_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 inline-flex hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-primary"
                        title="Open CV"
                      >
                        <ExternalLink size={18} />
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

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

export default RecruiterJobDetailPage;
