import i18n from '../i18n';

/** Human-readable label for job listing `created_at` (ISO string). */
export function formatPostedDate(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const t = i18n.getFixedT(i18n.language);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  if (diffDays <= 0) return t('dates.postedToday');
  if (diffDays === 1) return t('dates.postedYesterday');
  if (diffDays < 7) return t('dates.postedDaysAgo', { count: diffDays });
  return t('dates.postedOn', {
    date: d.toLocaleDateString(locale, { dateStyle: 'medium' }),
  });
}
