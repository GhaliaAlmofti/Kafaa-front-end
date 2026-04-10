import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Loader2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { RecruiterLayoutContext } from '../../layouts/RecruiterLayout';
import PageLayout from '../../components/PageLayout';
import RecruiterDashboard from '../../components/recruiter/RecruiterDashboard';
import { api } from '../../services/api';
import type { Job } from '../../types';

const RecruiterIndexPage = () => {
  const { t } = useTranslation();
  const { jobs, setJobs, loading, error, refetch } = useOutletContext<RecruiterLayoutContext>();
  const [departmentLabel, setDepartmentLabel] = useState('—');

  useEffect(() => {
    let cancelled = false;
    void api
      .getMyCompany()
      .then((c) => {
        if (!cancelled) {
          const label = (c.company_field || c.name || '').trim();
          setDepartmentLabel(label || t('common.dash'));
        }
      })
      .catch(() => {
        if (!cancelled) setDepartmentLabel(t('common.dash'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const duplicateJob = useCallback(
    async (source: Job) => {
      const company = await api.getMyCompany();
      await api.createJob({
        company_id: company.id,
        title: `${source.title}${t('jobsPage.copySuffix')}`,
        description: source.description,
        location: source.location,
        job_type: source.job_type,
        salary_min: source.salary_min ?? undefined,
        salary_max: source.salary_max ?? undefined,
        seniority: source.seniority ?? undefined,
        work_mode: source.work_mode ?? undefined,
      });
      await refetch();
    },
    [refetch, t],
  );

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="full">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-brand-primary" size={40} />
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="full"
      title={t('recruiterIndex.title')}
      subtitle={t('recruiterIndex.subtitle')}
    >
      <div className="rounded-2xl border border-brand-primary-soft bg-brand-primary-faint/60 p-5 flex gap-4">
        <Info className="text-brand-primary shrink-0 mt-0.5" size={22} aria-hidden />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-bold text-brand-black">{t('recruiterIndex.howItWorks')}</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>{t('recruiterIndex.step1')}</li>
            <li>{t('recruiterIndex.step2')}</li>
            <li>{t('recruiterIndex.step3')}</li>
            <li>{t('recruiterIndex.step4')}</li>
          </ol>
        </div>
      </div>

      <RecruiterDashboard
        jobs={jobs}
        setJobs={setJobs}
        jobsLoading={false}
        jobsError={error || null}
        departmentLabel={departmentLabel}
        refetchJobs={refetch}
        loadApplications={(jobId) => api.listJobApplications(jobId)}
        patchApplication={(applicationId, status) => api.patchJobApplication(applicationId, { status })}
        patchJob={(jobId, body) => api.patchJob(jobId, body)}
        duplicateJob={duplicateJob}
        pollIntervalMs={45_000}
      />
    </PageLayout>
  );
};

export default RecruiterIndexPage;
