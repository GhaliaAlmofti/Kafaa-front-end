import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Users,
  Briefcase,
  Trophy,
  AlertCircle,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import type { JobApplication, GrowthReport } from '../../types';
import type { RecruiterLayoutContext } from '../../layouts/RecruiterLayout';

const STATUS_ACTIONS: JobApplication['status'][] = ['reviewed', 'accepted', 'rejected'];

const RecruiterJobDetailPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { jobs, setJobs, loading: layoutLoading, error: layoutError } =
    useOutletContext<RecruiterLayoutContext>();

  const id = jobId ? Number(jobId) : NaN;
  const job = Number.isFinite(id) ? jobs.find((j) => j.id === id) : undefined;

  const [error, setError] = useState('');
  const [rankingId, setRankingId] = useState<number | null>(null);
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

  const handleRunAILogic = async () => {
    if (!job) return;
    try {
      setRankingId(job.id);
      setError('');
      const rankedData = await api.rankCandidates(job.id);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, applications: rankedData } : j)),
      );
      await loadApplications(job.id);
    } catch {
      setError('AI ranking failed. Ensure applicants have parsed CVs.');
    } finally {
      setRankingId(null);
    }
  };

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
      <div className="p-8 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="animate-spin text-brand-green" size={40} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-gray-600 mb-4">Job not found or you do not have access.</p>
        <button type="button" className="btn-primary" onClick={() => navigate('/recruiter')}>
          Back to all jobs
        </button>
      </div>
    );
  }

  const isOpen = job.is_active !== false;
  const apps = jobApplications;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Link
        to="/recruiter"
        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-green mb-6"
      >
        <ArrowLeft size={18} />
        All jobs
      </Link>

      {displayError && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle size={20} /> {displayError}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-white flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-brand-black">{job.title}</h1>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                  isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
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
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void toggleJobActive()}
              disabled={patchingJob}
              className="text-sm font-bold px-4 py-2 rounded-xl border border-gray-200 hover:border-brand-green hover:text-brand-green transition-colors disabled:opacity-50"
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
            <button
              type="button"
              onClick={() => void handleRunAILogic()}
              disabled={rankingId === job.id}
              className="flex items-center gap-2 bg-brand-green text-white px-5 py-2 rounded-xl font-bold hover:bg-opacity-90 disabled:bg-gray-300 transition-all text-sm"
            >
              {rankingId === job.id ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Trophy size={18} />
              )}
              {rankingId === job.id ? 'Ranking…' : 'Run AI ranking'}
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
                            className={`text-[10px] font-bold uppercase ${app.cv_is_parsed ? 'text-emerald-600' : 'text-amber-600'}`}
                          >
                            {app.cv_is_parsed ? 'Parsed' : 'Not parsed'}
                          </span>
                          {app.cv_file && (
                            <a
                              href={app.cv_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 inline-flex text-brand-green hover:underline"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {app.match_score != null ? `${app.match_score}%` : '—'}
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
                                className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-white border border-gray-200 hover:border-brand-green disabled:opacity-50"
                              >
                                {st}
                              </button>
                            ))}
                            {app.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => void openGrowthReport(app.id)}
                                className="text-[10px] font-bold uppercase px-2 py-1 rounded-lg bg-brand-black text-white hover:bg-brand-green flex items-center gap-1"
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
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            AI-ranked view (after running ranking)
          </p>
          {!job.applications || job.applications.length === 0 ? (
            <div className="text-center py-8 text-gray-400 italic text-sm">
              Run AI ranking to see scored rows here (parsed CVs only).
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="grid grid-cols-12 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="col-span-5">Candidate</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-4">Reasoning</div>
                <div className="col-span-1 text-right">CV</div>
              </div>

              {[...job.applications]
                .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
                .map((app) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={app.id}
                    className="grid grid-cols-12 items-center bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow gap-2"
                  >
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center text-white font-bold shrink-0">
                        {app.applicant_name?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-brand-black truncate">
                          {app.applicant_name || `Candidate #${app.id}`}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {app.status} · {new Date(app.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <div
                        className={`inline-block px-3 py-1 rounded-full font-black text-sm ${
                          (app.match_score ?? 0) >= 80
                            ? 'bg-emerald-100 text-emerald-700'
                            : (app.match_score ?? 0) >= 50
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {app.match_score != null ? `${app.match_score}%` : 'N/A'}
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
                          className="p-2 inline-flex hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-green"
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

      {growthForApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-8 shadow-xl"
          >
            <h3 className="text-xl font-bold text-brand-black mb-2">Growth report</h3>
            <p className="text-xs text-gray-500 mb-6">Application #{growthForApp.id}</p>
            {growthForApp.loading && (
              <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                <Loader2 className="animate-spin" /> Generating…
              </div>
            )}
            {growthForApp.error && (
              <p className="text-red-600 text-sm">{growthForApp.error}</p>
            )}
            {growthForApp.data && (
              <div className="space-y-6 text-sm">
                <div>
                  <h4 className="font-bold text-brand-black mb-2">Skill gaps</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {growthForApp.data.skill_gaps?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-brand-black mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {growthForApp.data.recommendations?.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                {growthForApp.data.suggested_resources &&
                  growthForApp.data.suggested_resources.length > 0 && (
                    <div>
                      <h4 className="font-bold text-brand-black mb-2">Suggested resources</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        {growthForApp.data.suggested_resources.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setGrowthForApp(null)}
              className="mt-8 w-full btn-secondary py-3 rounded-xl font-bold"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RecruiterJobDetailPage;
