import React from 'react';
import { cn } from '../../lib/utils';

export type StepProgressProps = {
  steps: { id: string; label: string }[];
  current: number;
  className?: string;
};

/**
 * Horizontal step indicator for multi-step onboarding flows.
 */
export function StepProgress({ steps, current, className }: StepProgressProps) {
  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        {steps.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={s.id} className="flex items-center gap-3 sm:flex-1 sm:min-w-0">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black tabular-nums transition-colors',
                  done && 'bg-brand-primary text-white',
                  active && !done && 'bg-brand-primary/15 text-brand-primary ring-2 ring-brand-primary/40',
                  !done && !active && 'bg-gray-100 text-gray-400',
                )}
                aria-current={active ? 'step' : undefined}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm font-bold truncate',
                  active ? 'text-brand-black' : 'text-gray-500',
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 ? (
                <span
                  className="hidden sm:block sm:flex-1 sm:min-w-[1rem] h-px bg-gray-200 mx-1"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
