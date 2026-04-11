import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Clock, Building2, RefreshCw } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../context/AuthContext';

const PendingRecruiterPage = () => {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PageLayout maxWidth="medium" title={t('pendingRecruiter.title')}>
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/90 to-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
              <Clock className="h-7 w-7" aria-hidden />
            </div>
            <div className="min-w-0 space-y-3">
              <p className="text-xl md:text-2xl font-bold leading-snug text-brand-black">
                {t('pendingRecruiter.subtitle')}
              </p>
              <p className="text-sm text-gray-600">{t('pendingRecruiter.explain')}</p>
            </div>
          </div>
          <div className="border-t border-amber-100 pt-4 space-y-3 text-sm text-gray-700">
            <p className="text-gray-500">{t('pendingRecruiter.hint')}</p>
            <Link
              to="/recruiter/company"
              className="inline-flex items-center gap-2 font-bold text-brand-primary hover:underline"
            >
              <Building2 size={18} aria-hidden />
              {t('pendingRecruiter.companyLink')}
            </Link>
            <div>
              <button
                type="button"
                disabled={refreshing}
                onClick={() => void onRefresh()}
                className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-gray-700 hover:text-brand-primary disabled:opacity-50"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden />
                {t('pendingRecruiter.refreshStatus')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default PendingRecruiterPage;
