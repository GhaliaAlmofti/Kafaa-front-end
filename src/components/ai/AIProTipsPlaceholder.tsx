import React from 'react';
import { Lightbulb } from 'lucide-react';
import { AIFeatureFrame } from './AIFeatureFrame';

const PLACEHOLDER_TIPS = [
  'Tailor your headline and summary to the roles you want most.',
  'Quantify impact where you can (numbers beat vague duties).',
  'Keep formatting simple so automated parsing stays reliable.',
];

/**
 * Pro Tips from AI — backend not wired yet. Replace body when API exists.
 */
export function AIProTipsPlaceholder({ className = '' }: { className?: string }) {
  return (
    <AIFeatureFrame
      className={className}
      icon={Lightbulb}
      title="Pro tips"
      badgeLabel="Coming soon"
      description="Personalized suggestions powered by AI will appear here after we connect the service."
    >
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/90 px-3 py-3 sm:px-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">
          Preview (placeholder)
        </p>
        <ul className="space-y-2.5 text-left text-sm text-gray-600">
          {PLACEHOLDER_TIPS.map((tip) => (
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
