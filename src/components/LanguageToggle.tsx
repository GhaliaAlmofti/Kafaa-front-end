import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

type LanguageToggleProps = {
  className?: string;
  /** Smaller padding for dense toolbars */
  compact?: boolean;
};

export function LanguageToggle({ className = '', compact }: LanguageToggleProps) {
  const { i18n, t } = useTranslation();
  const isEn = i18n.language.startsWith('en');
  const isAr = i18n.language.startsWith('ar');

  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-[11px] font-black uppercase tracking-wide shadow-sm',
        compact && 'text-[10px]',
        className,
      )}
      role="group"
      aria-label={t('language.switch')}
    >
      <button
        type="button"
        onClick={() => void i18n.changeLanguage('en')}
        className={cn(
          'rounded-md px-2.5 py-1 transition-colors',
          isEn ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-50',
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => void i18n.changeLanguage('ar')}
        className={cn(
          'rounded-md px-2.5 py-1 transition-colors',
          isAr ? 'bg-brand-primary text-white' : 'text-gray-600 hover:bg-gray-50',
        )}
      >
        عربي
      </button>
    </div>
  );
}
