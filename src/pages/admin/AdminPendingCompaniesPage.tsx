import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PendingCompanyRow } from '../../types';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';

const AdminPendingCompaniesPage = () => {
  const { t } = useTranslation();
  const [pendingCompanies, setPendingCompanies] = useState<PendingCompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.listPendingCompanies().catch(() => [] as PendingCompanyRow[]);
      setPendingCompanies(data);
    } catch {
      setError(t('adminApprovals.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending]);

  const handleApprovePending = async (row: PendingCompanyRow) => {
    try {
      setPendingActionId(row.id);
      setError('');
      await api.approveCompany(row.id);
      setPendingCompanies((prev) => prev.filter((c) => c.id !== row.id));
    } catch {
      setError(t('adminApprovals.approveError'));
    } finally {
      setPendingActionId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    try {
      setPendingActionId(rejectModal.id);
      setError('');
      await api.rejectCompany(rejectModal.id, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      const data = await api.listPendingCompanies().catch(() => [] as PendingCompanyRow[]);
      setPendingCompanies(data);
    } catch {
      setError(t('adminApprovals.rejectError'));
    } finally {
      setPendingActionId(null);
    }
  };

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
          {t('messagesPage.loading')}
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title={t('adminApprovals.title')}
      subtitle={t('adminApprovals.subtitle')}
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {pendingCompanies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-500">{t('adminApprovals.empty')}</p>
        </div>
      ) : (
        <div className="bg-amber-50/80 rounded-3xl p-6 border border-amber-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-amber-950">
            <AlertCircle className="text-amber-600 shrink-0" aria-hidden />
            {t('adminApprovals.queueHeading', { count: pendingCompanies.length })}
          </h2>
          <p className="text-xs text-amber-900/80 mb-4">{t('adminApprovals.queueHint')}</p>
          <div className="space-y-3">
            {pendingCompanies.map((row) => (
              <div
                key={row.id}
                className="p-4 rounded-2xl bg-white border border-amber-100/80 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-brand-black">{row.name}</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    @{row.owner.username} · {row.owner.phone_number}
                    {row.owner.email ? ` · ${row.owner.email}` : ''}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {t('adminApprovals.joined')}{' '}
                    {new Date(row.owner.date_joined).toLocaleString()} ·{' '}
                    {row.owner.is_verified
                      ? t('adminApprovals.phoneVerified')
                      : t('adminApprovals.phoneNotVerified')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={pendingActionId === row.id}
                    onClick={() => void handleApprovePending(row)}
                    className="text-xs font-bold py-2 px-4 rounded-xl bg-brand-primary text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {pendingActionId === row.id ? '…' : t('adminApprovals.approve')}
                  </button>
                  <button
                    type="button"
                    disabled={pendingActionId === row.id}
                    onClick={() => {
                      setRejectModal({ id: row.id, name: row.name });
                      setRejectReason('');
                    }}
                    className="text-xs font-bold py-2 px-4 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {t('adminApprovals.reject')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl p-5 border border-gray-100"
          >
            <h2 className="text-lg font-bold text-brand-black">{t('adminApprovals.rejectModalTitle')}</h2>
            <p className="text-xs text-gray-600 mt-1 mb-3">
              {t('adminApprovals.rejectModalBody', { name: rejectModal.name })}
            </p>
            <textarea
              className="input-field min-h-[5rem] text-sm w-full"
              placeholder={t('adminApprovals.rejectReasonPlaceholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100"
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
              >
                {t('adminApprovals.cancel')}
              </button>
              <button
                type="button"
                disabled={pendingActionId === rejectModal.id}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                onClick={() => void handleConfirmReject()}
              >
                {pendingActionId === rejectModal.id ? '…' : t('adminApprovals.confirmReject')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
};

export default AdminPendingCompaniesPage;
