import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';
import { GrowthReportModal } from '../../components/GrowthReportModal';
import type { MyApplication, GrowthReport } from '../../types';
import { formatApiErrorBody } from '../../utils/apiErrorMessage';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  reviewed: 'bg-sky-50 text-sky-800',
  accepted: 'bg-brand-primary-soft text-brand-primary-deep',
  rejected: 'bg-red-50 text-red-800',
};

function formatGrowthReportApiError(e: unknown): string {
  if (e instanceof Error) {
    return formatApiErrorBody(e.message, e.message || 'Failed to load growth report.');
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
      <PageLayout.Shell maxWidth="wide">
        <div className="flex justify-center min-h-[40vh] items-center text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} />
          Loading applications…
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="My applications"
      subtitle="Status updates come from recruiters. Match scores appear after you apply (with an analyzed CV)."
    >
      <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col gap-6">
        {myApps.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center border border-dashed border-gray-200 rounded-2xl">
            You have not applied yet.{' '}
            <Link to="/dashboard/jobs" className="text-brand-primary font-semibold">
              Find jobs
            </Link>{' '}
            or visit the{' '}
            <Link to="/jobs" className="text-brand-primary font-semibold">
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
                        <span className="font-bold text-brand-primary">{app.match_score}%</span>
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
                        className="btn-secondary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 w-fit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-brand-primary"
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

      <GrowthReportModal
        open={growthModal !== null}
        onClose={() => setGrowthModal(null)}
        title="Your growth report"
        applicationId={growthModal?.appId ?? null}
        loading={growthModal?.loading ?? false}
        error={growthModal?.error ?? ''}
        data={growthModal?.data ?? null}
      />
    </PageLayout>
  );
};

export default CandidateApplicationsPage;
