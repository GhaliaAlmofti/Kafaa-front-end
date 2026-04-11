import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { RecruiterLayoutContext } from '../../layouts/RecruiterLayout';
import PageLayout from '../../components/PageLayout';
import { api } from '../../services/api';
import type { Job, JobRecruiterAnalytics } from '../../types';

type Row = {
  job: Job;
  analytics: JobRecruiterAnalytics | null;
};

const RecruiterAnalyticsPage = () => {
  const { t } = useTranslation();
  const { jobs, loading: layoutLoading } = useOutletContext<RecruiterLayoutContext>();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (jobs.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all(
        jobs.map(async (job) => {
          try {
            const analytics = await api.getJobRecruiterAnalytics(job.id);
            return { job, analytics } satisfies Row;
          } catch {
            return { job, analytics: null } satisfies Row;
          }
        }),
      );
      setRows(results);
    } catch {
      setError(t('recruiterAnalytics.loadError'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [jobs, t]);

  useEffect(() => {
    if (layoutLoading) return;
    void load();
  }, [layoutLoading, load]);

  const maxBar = useMemo(() => {
    let m = 1;
    for (const r of rows) {
      if (!r.analytics) continue;
      m = Math.max(
        m,
        r.analytics.unique_viewers,
        r.analytics.apply_count,
        r.analytics.shortlisted_count,
      );
    }
    return m;
  }, [rows]);

  if (layoutLoading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-brand-primary" size={40} />
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title={t('recruiterAnalytics.title')}
      subtitle={t('recruiterAnalytics.subtitle')}
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="text-brand-primary shrink-0" size={22} aria-hidden />
          <p className="text-sm text-gray-600">{t('recruiterAnalytics.chartHint')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 className="animate-spin" size={22} />
            {t('recruiterAnalytics.loading')}
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-center text-gray-500 py-12">{t('recruiterAnalytics.empty')}</p>
        ) : error ? (
          <p className="text-center text-red-600 py-8">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                  <th className="pb-3 pe-4 min-w-[180px]">{t('recruiterDashboard.colJobTitle')}</th>
                  <th className="pb-3 pe-4 text-center w-28">{t('recruiterAnalytics.legendViews')}</th>
                  <th className="pb-3 pe-4 text-center w-28">{t('recruiterAnalytics.legendApplies')}</th>
                  <th className="pb-3 text-center w-28">{t('recruiterAnalytics.legendShortlist')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ job, analytics }) => (
                  <tr key={job.id} className="border-b border-gray-100 align-middle">
                    <td className="py-4 pe-4 font-semibold text-brand-black max-w-[240px]">
                      <span className="line-clamp-2">{job.title}</span>
                    </td>
                    {(['unique_viewers', 'apply_count', 'shortlisted_count'] as const).map((key) => {
                      const v = analytics ? analytics[key] : 0;
                      const pct = Math.round((v / maxBar) * 100);
                      return (
                        <td key={key} className="py-4 pe-4 last:pe-0">
                          <div className="flex flex-col items-center gap-2">
                            <div
                              className="w-full max-w-[120px] h-24 flex items-end justify-center rounded-lg bg-gray-50 border border-gray-100 px-2 pt-2"
                              role="img"
                              aria-label={`${job.title}: ${v}`}
                            >
                              <div
                                className={cnBar(key)}
                                style={{ height: `${Math.max(pct, v > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                            <span className="tabular-nums font-bold text-brand-black">{v}</span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

function cnBar(key: 'unique_viewers' | 'apply_count' | 'shortlisted_count') {
  switch (key) {
    case 'unique_viewers':
      return 'w-full rounded-t-md bg-sky-400 min-h-[2px] transition-all';
    case 'apply_count':
      return 'w-full rounded-t-md bg-brand-primary min-h-[2px] transition-all';
    default:
      return 'w-full rounded-t-md bg-amber-500 min-h-[2px] transition-all';
  }
}

export default RecruiterAnalyticsPage;
