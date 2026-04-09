import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export type MatchScoreExplainabilityProps = {
  score: number | null;
  matched?: string[] | null;
  missing?: string[] | null;
  /** Larger score text for dashboard cards */
  variant?: 'inline' | 'pill';
  className?: string;
};

function SkillList({
  title,
  icon: Icon,
  items,
  tone,
  noneListed,
}: {
  title: string;
  icon: typeof CheckCircle2;
  items: string[];
  tone: 'ok' | 'gap';
  noneListed: string;
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wide text-gray-400 mb-1">
          <Icon size={12} className={tone === 'ok' ? 'text-emerald-600' : 'text-amber-600'} aria-hidden />
          {title}
        </p>
        <p className="text-[11px] text-gray-400 italic">{noneListed}</p>
      </div>
    );
  }
  return (
    <div>
      <p className="flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wide text-gray-500 mb-1.5">
        <Icon size={12} className={tone === 'ok' ? 'text-emerald-600' : 'text-amber-600'} aria-hidden />
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((s, idx) => (
          <li
            key={`${title}-${idx}-${s}`}
            className={cn(
              'text-[11px] leading-snug ps-2 border-s-2',
              tone === 'ok' ? 'border-emerald-400 text-gray-700' : 'border-amber-400 text-gray-700',
            )}
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Shows an AI match score with a hover/focus tooltip listing matched vs missing skills (when provided by the API).
 */
export function MatchScoreExplainability({
  score,
  matched,
  missing,
  variant = 'inline',
  className,
}: MatchScoreExplainabilityProps) {
  const { t } = useTranslation();
  const m = (matched ?? []).filter((x) => String(x).trim());
  const n = (missing ?? []).filter((x) => String(x).trim());
  const hasExplain = m.length > 0 || n.length > 0;

  if (score == null) {
    return <span className={cn('text-gray-400 tabular-nums', className)}>{t('common.dash')}</span>;
  }

  const scoreEl =
    variant === 'pill' ? (
      <span className="text-xl font-black tabular-nums text-inherit">{t('matchScore.scorePercent', { score })}</span>
    ) : (
      <span className="font-bold tabular-nums text-brand-primary">{t('matchScore.scorePercent', { score })}</span>
    );

  if (!hasExplain) {
    return <span className={cn('tabular-nums', className)}>{scoreEl}</span>;
  }

  return (
    <span className={cn('relative inline-flex items-center group/score', className)}>
      <button
        type="button"
        className={cn(
          'rounded outline-none text-left',
          variant === 'pill'
            ? 'text-inherit cursor-help focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-2'
            : 'cursor-help border-b border-dotted border-brand-primary/35 hover:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2',
        )}
        aria-label={t('matchScore.ariaLabel', { score })}
      >
        {scoreEl}
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none invisible opacity-0 scale-[0.98] transition duration-150',
          'group-hover/score:visible group-hover/score:opacity-100 group-hover/score:scale-100 group-hover/score:pointer-events-auto',
          'group-focus-within/score:visible group-focus-within/score:opacity-100 group-focus-within/score:scale-100 group-focus-within/score:pointer-events-auto',
          'absolute z-[200] left-1/2 top-full mt-2 w-[min(calc(100vw-2rem),19rem)] -translate-x-1/2',
          'rounded-xl border border-gray-200 bg-white p-3 shadow-xl',
        )}
      >
        <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
          {t('matchScore.explainTitle')}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
          <SkillList
            title={t('matchScore.matched')}
            icon={CheckCircle2}
            items={m}
            tone="ok"
            noneListed={t('matchScore.noneListed')}
          />
          <SkillList
            title={t('matchScore.missingGaps')}
            icon={XCircle}
            items={n}
            tone="gap"
            noneListed={t('matchScore.noneListed')}
          />
        </div>
      </span>
    </span>
  );
}
