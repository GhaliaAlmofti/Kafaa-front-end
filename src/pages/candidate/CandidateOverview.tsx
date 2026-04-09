import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Info, Loader2, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import type { Job, CV, MyApplication } from '../../types';

const CandidateOverview = () => {
  const { t } = useTranslation();
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
          {t('candidateOverview.loading')}
        </div>
      </PageLayout.Shell>
    );
  }

  const displayName = user?.username ?? t('candidateOverview.there');

  const quick = [
    {
      to: '/dashboard/applications',
      title: t('candidateOverview.quickAppsTitle'),
      desc: t('candidateOverview.quickAppsDesc', { count: myApps.length }),
    },
    {
      to: '/dashboard/cv',
      title: t('candidateOverview.quickCvTitle'),
      desc: t('candidateOverview.quickCvDesc', { count: cvs.length }),
    },
    {
      to: '/dashboard/jobs',
      title: t('candidateOverview.quickJobsTitle'),
      desc: t('candidateOverview.quickJobsDesc', { count: jobs.length }),
    },
  ];

  return (
    <PageLayout
      maxWidth="medium"
      title={t('candidateOverview.title')}
      subtitle={t('candidateOverview.subtitle', { name: displayName })}
    >
      <div className="rounded-3xl border border-brand-primary-soft bg-brand-primary-faint/60 p-5 md:p-6 flex gap-4">
        <Info className="text-brand-primary shrink-0 mt-0.5" size={22} />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-bold text-brand-black">{t('candidateOverview.howItWorks')}</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>
              {t('candidateOverview.step1Before')}{' '}
              <span className="ai-text-gradient font-bold">{t('candidateOverview.aiLabel')}</span>{' '}
              {t('candidateOverview.step1After')}
            </li>
            <li>
              {t('candidateOverview.step2Before')}{' '}
              <strong>{t('candidateOverview.easyApply')}</strong> {t('candidateOverview.step2After')}
            </li>
            <li>{t('candidateOverview.step3')}</li>
            <li>
              {t('candidateOverview.step4Before')}{' '}
              <strong>{t('candidateOverview.rejected')}</strong>
              {t('candidateOverview.step4After')}
            </li>
          </ol>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">{t('candidateOverview.statOpenRoles')}</p>
          <p className="text-2xl font-black text-brand-black">{jobs.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">{t('candidateOverview.statApplications')}</p>
          <p className="text-2xl font-black text-brand-primary">{myApps.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">{t('candidateOverview.statCvs')}</p>
          <p className="text-2xl font-black text-brand-black">{cvs.length}</p>
        </div>
        <div className="rounded-3xl bg-white border border-gray-100 p-4 md:p-5">
          <p className="text-[10px] font-black uppercase text-gray-400">{t('candidateOverview.statAnalyzed')}</p>
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
        {t('candidateOverview.publicCatalog')}{' '}
        <Link to="/jobs" className="text-brand-primary font-semibold hover:underline">
          {t('candidateOverview.browseAllJobs')}
        </Link>
      </p>
    </PageLayout>
  );
};

export default CandidateOverview;
