import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lightbulb } from 'lucide-react';
import { AIFeatureFrame } from './AIFeatureFrame';

/**
 * Pro Tips from AI — backend not wired yet. Replace body when API exists.
 */
export function AIProTipsPlaceholder({ className = '' }: { className?: string }) {
  const { t } = useTranslation();
  const tips = [t('ai.tip1'), t('ai.tip2'), t('ai.tip3')];
  return (
    <AIFeatureFrame
      className={className}
      icon={Lightbulb}
      title={t('ai.proTips')}
      badgeLabel={t('ai.comingSoon')}
      description={t('ai.proTipsDesc')}
    >
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/90 px-3 py-3 sm:px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
          {t('ai.previewPlaceholder')}
        </p>
        <ul className="space-y-2.5 text-left text-sm text-gray-600">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundImage:
                    'linear-gradient(135deg, var(--color-ai-violet), var(--color-ai-cyan))',
                }}
                aria-hidden
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </AIFeatureFrame>
  );
}
