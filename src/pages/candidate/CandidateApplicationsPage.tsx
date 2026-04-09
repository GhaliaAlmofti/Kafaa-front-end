import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Loader2, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';
import { GrowthReportModal } from '../../components/GrowthReportModal';
import { MatchScoreExplainability } from '../../components/MatchScoreExplainability';
import {
  ApplicationTimeline,
  buildApplicationTimelineEvents,
} from '../../components/ApplicationTimeline';
import type { MyApplication, GrowthReport, JobApplication } from '../../types';
import { formatApiErrorBody } from '../../utils/apiErrorMessage';
import i18n from '../../i18n';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  reviewed: 'bg-sky-50 text-sky-800',
  accepted: 'bg-brand-primary-soft text-brand-primary-deep',
  rejected: 'bg-red-50 text-red-800',
};

function statusLabelKey(status: JobApplication['status']): string {
  const map: Record<JobApplication['status'], string> = {
    pending: 'statusPending',
    reviewed: 'statusReviewed',
    accepted: 'statusAccepted',
    rejected: 'statusRejected',
  };
  return map[status] ?? 'statusPending';
}

function formatGrowthReportApiError(e: unknown): string {
  if (e instanceof Error) {
    return formatApiErrorBody(e.message, e.message || i18n.t('candidateApplications.growthError'));
  }
  return i18n.t('candidateApplications.growthError');
}

const CandidateApplicationsPage = () => {
  const { t, i18n: i18nInstance } = useTranslation();
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [expandedAppId, setExpandedAppId] = useState<number | null>(null);
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

  const dateLocale = i18nInstance.language === 'ar' ? 'ar' : 'en';

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex justify-center min-h-[40vh] items-center text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} />
          {t('candidateApplications.loading')}
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title={t('candidateApplications.title')}
      subtitle={t('candidateApplications.subtitle')}
    >
      <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 flex flex-col gap-6">
        {myApps.length === 0 ? (
          <p className="text-gray-400 text-sm py-12 text-center border border-dashed border-gray-200 rounded-2xl">
            {t('candidateApplications.empty')}{' '}
            <Link to="/dashboard/jobs" className="text-brand-primary font-semibold">
              {t('candidateApplications.findJobs')}
            </Link>{' '}
            {t('candidateApplications.emptyOr')}{' '}
            <Link to="/jobs" className="text-brand-primary font-semibold">
              {t('candidateApplications.publicCatalog')}
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-start text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                  <th className="pb-3 pe-2 w-10" aria-label={t('common.expandRow')} />
                  <th className="pb-3 pe-4">{t('candidateApplications.colRole')}</th>
                  <th className="pb-3 pe-4">{t('candidateApplications.colCompany')}</th>
                  <th className="pb-3 pe-4">{t('candidateApplications.colApplied')}</th>
                  <th className="pb-3 pe-4">{t('candidateApplications.colStatus')}</th>
                  <th className="pb-3 pe-4">{t('candidateApplications.colMatch')}</th>
                  <th className="pb-3">{t('candidateApplications.colActions')}</th>
                </tr>
              </thead>
              <tbody>
                {myApps.map((app) => (
                  <React.Fragment key={app.id}>
                    <tr className="border-b border-gray-100 align-middle">
                      <td className="py-3 pe-2 align-middle">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAppId((id) => (id === app.id ? null : app.id))
                          }
                          className="p-1 rounded-lg text-gray-400 hover:text-brand-primary hover:bg-brand-primary-faint"
                          aria-expanded={expandedAppId === app.id}
                          aria-controls={`app-trail-${app.id}`}
                          title={
                            expandedAppId === app.id
                              ? t('candidateApplications.expandHide')
                              : t('candidateApplications.expandShow')
                          }
                        >
                          {expandedAppId === app.id ? (
                            <ChevronDown size={18} />
                          ) : (
                            <ChevronRight size={18} />
                          )}
                        </button>
                      </td>
                      <td className="py-3 pe-4">
                        <p className="font-bold text-brand-black">{app.job_title}</p>
                        <p className="text-xs text-gray-400">
                          {app.job_location} · {app.job_type}
                        </p>
                      </td>
                      <td className="py-3 pe-4 text-gray-600">
                        {app.company_name ?? t('common.dash')}
                      </td>
                      <td className="py-3 pe-4 text-gray-500 whitespace-nowrap">
                        {new Date(app.applied_at).toLocaleDateString(dateLocale)}
                      </td>
                      <td className="py-3 pe-4">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-700'}`}
                        >
                          {t(`candidateApplications.${statusLabelKey(app.status)}`)}
                        </span>
                      </td>
                      <td className="py-3 pe-4">
                        <MatchScoreExplainability
                          score={app.match_score}
                          matched={app.match_matched_skills}
                          missing={app.match_missing_skills}
                        />
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-2 items-start">
                          <button
                            type="button"
                            disabled={app.cv_is_parsed === false}
                            title={
                              app.cv_is_parsed === false
                                ? t('candidateApplications.growthCvRequired')
                                : t('candidateApplications.growthOpen')
                            }
                            onClick={() => void openGrowthReport(app.id)}
                            className="btn-secondary text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 w-fit disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-brand-primary"
                          >
                            <BookOpen size={14} /> {t('candidateApplications.growthReport')}
                          </button>
                          <Link
                            to={`/dashboard/applications/growth/${app.id}`}
                            className={`inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 ${app.cv_is_parsed === false ? 'pointer-events-none opacity-40' : ''}`}
                            aria-disabled={app.cv_is_parsed === false}
                            title={
                              app.cv_is_parsed === false
                                ? t('candidateApplications.growthCvShort')
                                : t('candidateApplications.fullReportTitle')
                            }
                          >
                            <ExternalLink size={12} aria-hidden />
                            {t('candidateApplications.fullReportLink')}
                          </Link>
                        </div>
                      </td>
                    </tr>
                    {expandedAppId === app.id ? (
                      <tr className="border-b border-gray-100 bg-gray-50/80">
                        <td colSpan={7} className="px-4 pb-4 pt-0">
                          <div
                            id={`app-trail-${app.id}`}
                            className="ps-8 md:ps-10 pe-2 pt-2 border-t border-gray-100/80"
                          >
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">
                              {t('candidateApplications.activityTrail')}
                            </p>
                            <ApplicationTimeline
                              events={buildApplicationTimelineEvents(app)}
                              className="max-w-md"
                            />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <GrowthReportModal
        open={growthModal !== null}
        onClose={() => setGrowthModal(null)}
        title={t('candidateApplications.modalTitle')}
        applicationId={growthModal?.appId ?? null}
        loading={growthModal?.loading ?? false}
        error={growthModal?.error ?? ''}
        data={growthModal?.data ?? null}
      />
    </PageLayout>
  );
};

export default CandidateApplicationsPage;
