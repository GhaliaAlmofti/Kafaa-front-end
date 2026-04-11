import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Briefcase, Building2 } from 'lucide-react';

type SignUpRoleModalProps = {
  open: boolean;
  onClose: () => void;
};

export function SignUpRoleModal({ open, onClose }: SignUpRoleModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/45 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-role-modal-title"
    >
      <div className="flex min-h-full items-center justify-center p-4 sm:p-8" onClick={onClose}>
        <div
          className="relative w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl sm:p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute end-4 top-4 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
            aria-label={t('common.close')}
          >
            <X size={22} aria-hidden />
          </button>

          <h2 id="signup-role-modal-title" className="pe-10 text-xl font-black text-brand-black sm:text-2xl">
            {t('nav.signUpModalTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-500">{t('nav.signUpModalSubtitle')}</p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => go('/signup')}
              className="group flex w-full items-start gap-4 rounded-xl border-2 border-gray-100 bg-white p-5 text-start transition-all hover:border-brand-primary hover:bg-brand-primary/5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary transition-colors group-hover:bg-brand-primary group-hover:text-white">
                <Briefcase size={24} aria-hidden />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block font-bold text-gray-900">{t('nav.signUpLookingForJob')}</span>
                <span className="mt-1 block text-sm text-gray-500">{t('nav.signUpLookingForJobHint')}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => go('/recruiter/register')}
              className="group flex w-full items-start gap-4 rounded-xl border-2 border-gray-100 bg-white p-5 text-start transition-all hover:border-brand-primary hover:bg-brand-primary/5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                <Building2 size={24} aria-hidden />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block font-bold text-gray-900">{t('nav.signUpHiring')}</span>
                <span className="mt-1 block text-sm text-gray-500">{t('nav.signUpHiringHint')}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
