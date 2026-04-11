import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Ban, RefreshCw } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Company } from '../../types';

const RejectedRecruiterPage = () => {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [company, setCompany] = useState<Company | null>(undefined);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void api
      .getMyCompany()
      .then((c) => {
        if (!cancelled) setCompany(c);
      })
      .catch(() => {
        if (!cancelled) setCompany(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
      const c = await api.getMyCompany();
      setCompany(c);
    } catch {
      setCompany(null);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PageLayout maxWidth="medium" title={t('rejectedRecruiter.title')}>
      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50/90 to-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-800">
              <Ban className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0 space-y-3">
              <p className="text-xl md:text-2xl font-bold leading-snug text-brand-black">
                {t('rejectedRecruiter.subtitle')}
              </p>
              <p className="text-sm text-gray-600">{t('rejectedRecruiter.explain')}</p>
            </div>
          </div>
          {company === undefined ? (
            <p className="text-sm text-gray-500">{t('common.loading')}</p>
          ) : company?.rejection_reason?.trim() ? (
            <div className="rounded-xl border border-red-100 bg-white/80 px-4 py-3 text-sm text-gray-800">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-600 mb-1">
                {t('rejectedRecruiter.reasonLabel')}
              </p>
              <p className="whitespace-pre-wrap">{company.rejection_reason.trim()}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('rejectedRecruiter.noReason')}</p>
          )}
          <div className="border-t border-red-100 pt-4">
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void onRefresh()}
              className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-brand-primary disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden />
              {t('pendingRecruiter.refreshStatus')}
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default RejectedRecruiterPage;
