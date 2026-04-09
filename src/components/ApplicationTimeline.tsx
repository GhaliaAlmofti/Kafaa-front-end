import React from 'react';
import { CircleDot, Eye, Send, ThumbsDown, ThumbsUp, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import type { JobApplication } from '../types';
import i18n from '../i18n';

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
  const loc = i18n.language.startsWith('ar') ? 'ar' : 'en';
  return d.toLocaleString(loc, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function iconForEvent(eventId: string, index: number): LucideIcon {
  if (eventId === 'submitted') return Send;
  if (eventId === 'status-reviewed') return Eye;
  if (eventId === 'status-accepted') return ThumbsUp;
  if (eventId === 'status-rejected') return ThumbsDown;
  if (eventId.startsWith('status-')) return CircleDot;
  return index === 0 ? Send : CircleDot;
}

/**
 * Vertical audit trail for application status changes (submitted → viewed → outcome).
 * Pass ordered events oldest-first; the connector line runs between items.
 */
export function ApplicationTimeline({
  events,
  className,
  ariaLabel,
  emptyMessage,
}: ApplicationTimelineProps) {
  const aria = ariaLabel ?? i18n.t('timeline.activityLabel');
  const empty = emptyMessage ?? i18n.t('timeline.empty');
  if (events.length === 0) {
    return (
      <p className={cn('text-xs text-gray-400 py-2', className)} role="status">
        {empty}
      </p>
    );
  }

  return (
    <ol
      className={cn('relative border-l-2 border-gray-200 pl-5 space-y-0', className)}
      aria-label={aria}
    >
      {events.map((ev, index) => {
        const isLast = index === events.length - 1;
        const Icon = iconForEvent(ev.id, index);
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
                    {i18n.t('timeline.timeNotLogged')}
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

/**
 * Builds a minimal timeline from fields available on list endpoints.
 * When the API adds per-event timestamps, pass those into {@link ApplicationTimeline} instead.
 */
export function buildApplicationTimelineEvents(app: {
  applied_at: string;
  status: JobApplication['status'];
}): ApplicationTimelineEvent[] {
  const t = i18n.getFixedT(i18n.language);
  const submitted: ApplicationTimelineEvent = {
    id: 'submitted',
    title: t('timeline.submitted'),
    occurredAt: app.applied_at,
  };

  if (app.status === 'pending') {
    return [submitted];
  }

  const meta: Record<JobApplication['status'], { title: string; detail?: string }> = {
    pending: { title: t('timeline.awaitingReview') },
    reviewed: { title: t('timeline.viewed'), detail: t('timeline.viewedDetail') },
    accepted: { title: t('timeline.accepted'), detail: t('timeline.acceptedDetail') },
    rejected: { title: t('timeline.notSelected'), detail: t('timeline.notSelectedDetail') },
  };

  const m = meta[app.status];
  return [
    submitted,
    {
      id: `status-${app.status}`,
      title: m.title,
      occurredAt: null,
      detail: m.detail,
    },
  ];
}
