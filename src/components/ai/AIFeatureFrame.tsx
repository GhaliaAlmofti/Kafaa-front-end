import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import { AIBadge } from './AIBadge';

type AIFeatureFrameProps = {
  title: string;
  description?: string;
  badgeLabel?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
};

/**
 * Standard chrome for AI-backed panels: gradient border + optional header.
 * Styling is driven by theme.css (--color-ai-*) and index.css (.ai-feature-border).
 */
export function AIFeatureFrame({
  title,
  description,
  badgeLabel = 'AI',
  icon: Icon = Sparkles,
  children,
  className = '',
}: AIFeatureFrameProps) {
  return (
    <div className={`ai-feature-border ${className}`}>
      <div className="ai-feature-border-inner relative overflow-hidden p-4 sm:p-5">
        <div className="ai-glow-orb -right-6 -top-10" aria-hidden />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-start gap-2">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{
                backgroundImage:
                  'linear-gradient(145deg, var(--color-ai-violet), var(--color-ai-fuchsia), var(--color-ai-cyan))',
              }}
              aria-hidden
            >
              <Icon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-brand-black">{title}</h3>
                <AIBadge label={badgeLabel} />
              </div>
              {description ? (
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="relative mt-4">{children}</div>
      </div>
    </div>
  );
}
