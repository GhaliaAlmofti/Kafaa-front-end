import React from 'react';
import { CircleDot, Eye, Send, ThumbsDown, ThumbsUp, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { JobApplication } from '../types';

export type ApplicationTimelineEvent = {
  id: string;
  /** Short label shown on the timeline (e.g. "Submitted", "Viewed"). */
  title: string;
  /** ISO date string or Date; omit or null when the backend has not logged a time yet. */
  occurredAt?: string | Date | null;
  /** Optional one-line detail under the title. */
  detail?: string;
};

type ApplicationTimelineProps = {
  events: ApplicationTimelineEvent[];
  className?: string;
  /** Accessible label for the list (defaults to "Application activity"). */
  ariaLabel?: string;
  /** Empty state when `events` has length 0 */
  emptyMessage?: string;
};

function formatEventTime(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function iconForEvent(title: string, index: number): LucideIcon {
  const t = title.toLowerCase();
  if (t.includes('submit')) return Send;
  if (t.includes('view')) return Eye;
  if (t.includes('accept')) return ThumbsUp;
  if (t.includes('reject') || t.includes('not selected') || t.includes('closed')) return ThumbsDown;
  return index === 0 ? Send : CircleDot;
}

/**
 * Vertical audit trail for application status changes (submitted → viewed → outcome).
 * Pass ordered events oldest-first; the connector line runs between items.
 */
export function ApplicationTimeline({
  events,
  className,
  ariaLabel = 'Application activity',
  emptyMessage = 'No activity recorded yet.',
}: ApplicationTimelineProps) {
  if (events.length === 0) {
    return (
      <p className={cn('text-xs text-gray-400 py-2', className)} role="status">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ol
      className={cn('relative border-l-2 border-gray-200 pl-5 space-y-0', className)}
      aria-label={ariaLabel}
    >
      {events.map((ev, index) => {
        const isLast = index === events.length - 1;
        const Icon = iconForEvent(ev.title, index);
        const hasTime = ev.occurredAt != null && ev.occurredAt !== '';
        return (
          <li key={ev.id} className={cn(!isLast && 'pb-5')}>
            <span
              className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-gray-200 text-brand-primary"
              aria-hidden
            >
              <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
            </span>
            <div className="-mt-0.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-bold text-brand-black">{ev.title}</span>
                {hasTime ? (
                  <time
                    className="text-xs font-semibold tabular-nums text-gray-500"
                    dateTime={
                      typeof ev.occurredAt === 'string'
                        ? ev.occurredAt
                        : ev.occurredAt!.toISOString()
                    }
                  >
                    {formatEventTime(ev.occurredAt as string | Date)}
                  </time>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    Time not logged
                  </span>
                )}
              </div>
              {ev.detail ? (
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{ev.detail}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

const STATUS_TIMELINE_LABEL: Record<JobApplication['status'], { title: string; detail?: string }> = {
  pending: { title: 'Awaiting review' },
  reviewed: { title: 'Viewed', detail: 'Recruiter opened your application.' },
  accepted: { title: 'Accepted', detail: 'This application was marked as accepted.' },
  rejected: { title: 'Not selected', detail: 'This application was closed for this role.' },
};

/**
 * Builds a minimal timeline from fields available on list endpoints.
 * When the API adds per-event timestamps, pass those into {@link ApplicationTimeline} instead.
 */
export function buildApplicationTimelineEvents(app: {
  applied_at: string;
  status: JobApplication['status'];
}): ApplicationTimelineEvent[] {
  const submitted: ApplicationTimelineEvent = {
    id: 'submitted',
    title: 'Submitted',
    occurredAt: app.applied_at,
  };

  if (app.status === 'pending') {
    return [submitted];
  }

  const meta = STATUS_TIMELINE_LABEL[app.status];
  return [
    submitted,
    {
      id: `status-${app.status}`,
      title: meta.title,
      occurredAt: null,
      detail: meta.detail,
    },
  ];
}
