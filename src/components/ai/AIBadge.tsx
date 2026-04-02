import React from 'react';
import { Sparkles } from 'lucide-react';

type AIBadgeProps = {
  className?: string;
  label?: string;
};

/** Compact pill marking AI-powered UI — uses global gradient tokens from theme.css + index.css */
export function AIBadge({ className = '', label = 'AI' }: AIBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(115deg, var(--color-ai-indigo), var(--color-ai-violet), var(--color-ai-fuchsia))',
      }}
    >
      <Sparkles size={11} className="shrink-0 opacity-95" aria-hidden />
      {label}
    </span>
  );
}
