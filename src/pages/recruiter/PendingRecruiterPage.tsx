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
    <PageLayout
      maxWidth="md"
      title={t('pendingRecruiter.title')}
      subtitle={t('pendingRecruiter.subtitle')}
    >
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 flex gap-4">
        <Clock className="text-amber-700 shrink-0 mt-0.5" size={28} aria-hidden />
        <div className="space-y-3 text-sm text-gray-800">
          <p className="font-bold text-brand-black">{t('pendingRecruiter.explain')}</p>
          <p className="text-gray-600">{t('pendingRecruiter.hint')}</p>
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
    </PageLayout>
  );
};

export default PendingRecruiterPage;
