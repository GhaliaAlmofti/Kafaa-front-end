import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Send, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { MyApplication, GrowthReport } from '../../types';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  reviewed: 'bg-sky-50 text-sky-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-50 text-red-800',
};

function formatGrowthReportApiError(e: unknown): string {
  if (e instanceof Error) {
    try {
      const parsed = JSON.parse(e.message) as { detail?: unknown };
      const d = parsed.detail;
      if (typeof d === 'string') return d;
      if (Array.isArray(d)) return d.map(String).join(' ');
    } catch {
      return e.message;
    }
  }
  return 'Failed to load growth report.';
}

const CandidateApplicationsPage = () => {
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [growthModal, setGrowthModal] = useState<{
    appId: number;
    data: GrowthReport | null;
    loading: boolean;
    error: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const appsData = await api.listMyApplications();
      setMyApps(appsData);
    } catch {
      setMyApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Calls GET /jobs/applications/:id/growth-report/ (GrowthReportView) and shows the JSON body in the modal. */
  const openGrowthReport = async (applicationId: number) => {
    setGrowthModal({ appId: applicationId, data: null, loading: true, error: '' });
    try {
      const data = await api.getGrowthReport(applicationId);
      setGrowthModal({ appId: applicationId, data, loading: false, error: '' });
    } catch (e) {
      setGrowthModal({
        appId: applicationId,
        data: null,
        loading: false,
        error: formatGrowthReportApiError(e),
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500 gap-2">
        <Loader2 className="animate-spin" size={22} />
        Loading applications…
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-black flex items-center gap-2">
          <Send className="text-brand-green" size={28} /> My applications
        </h1>
        <p className="text-gray-500 mt-2 text-sm">
          Status updates come from recruiters. Match scores appear after you apply (with an analyzed
          CV).
        </p>
      </header>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
        {myApps.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center border border-dashed border-gray-200 rounded-2xl">
            You have not applied yet.{' '}
            <Link to="/dashboard/jobs" className="text-brand-green font-semibold">
              Find jobs
            </Link>{' '}
            or visit the{' '}
            <Link to="/jobs" className="text-brand-green font-semibold">
              public catalog
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Company</th>
                  <th className="pb-3 pr-4">Applied</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Match</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myApps.map((app) => (
                  <tr key={app.id} className="border-b border-gray-100 align-middle">
                    <td className="py-3 pr-4">
                      <p className="font-bold text-brand-black">{app.job_title}</p>
                      <p className="text-xs text-gray-400">
                        {app.job_location} · {app.job_type}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{app.company_name ?? '—'}</td>
                    <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-700'}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {app.match_score != null ? (
                        <span className="font-bold text-brand-green">{app.match_score}%</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        disabled={app.cv_is_parsed === false}
                        title={
                          app.cv_is_parsed === false
                            ? 'Your CV must be analyzed first — upload again on My CV.'
                            : 'Open career growth report from the server'
                        }
                        onClick={() => void openGrowthReport(app.id)}
                        className="btn-secondary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 w-fit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-brand-green"
                      >
                        <BookOpen size={14} /> Growth report
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {growthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-8 shadow-xl"
          >
            <h3 className="text-xl font-bold text-brand-black mb-2">Your growth report</h3>
            <p className="text-xs text-gray-500 mb-6">Application #{growthModal.appId}</p>
            {growthModal.loading && (
              <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
                <Loader2 className="animate-spin" /> Loading…
              </div>
            )}
            {growthModal.error && (
              <p className="text-red-600 text-sm border border-red-100 bg-red-50/80 rounded-xl p-3">
                {growthModal.error}
              </p>
            )}
            {growthModal.data && (
              <div className="space-y-6 text-sm">
                <p className="text-xs text-gray-500">
                  From{' '}
                  <code className="text-gray-700 bg-gray-100 px-1 rounded">
                    GET /jobs/applications/{growthModal.appId}/growth-report/
                  </code>
                </p>
                <div>
                  <h4 className="font-bold text-brand-black mb-2">Skill gaps</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {(growthModal.data.skill_gaps ?? []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-brand-black mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {(growthModal.data.recommendations ?? []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                {(growthModal.data.suggested_resources?.length ?? 0) > 0 && (
                  <div>
                    <h4 className="font-bold text-brand-black mb-2">Suggested resources</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {growthModal.data.suggested_resources!.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={() => setGrowthModal(null)}
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

export default CandidateApplicationsPage;
