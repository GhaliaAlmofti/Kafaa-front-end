import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Inbox, Loader2, Mail, Send } from 'lucide-react';
import { api } from '../services/api';
import type { InAppNotification } from '../types';
import { useAuth } from '../context/AuthContext';

type Box = 'inbox' | 'sent';

function formatWhen(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const MessagesPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [box, setBox] = useState<Box>('inbox');
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const isCandidate = user?.role === 'CANDIDATE';

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.listNotifications(box);
      setItems(data);
      if (box === 'inbox') {
        const u = await api.getUnreadNotificationCount();
        setUnreadCount(u.unread_count);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t('messagesPage.loadError'));
    } finally {
      setLoading(false);
    }
  }, [box, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onMarkRead = async (n: InAppNotification) => {
    if (n.read_at || box !== 'inbox') return;
    try {
      const updated = await api.markNotificationRead(n.id, true);
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      const u = await api.getUnreadNotificationCount();
      setUnreadCount(u.unread_count);
    } catch {
      /* ignore */
    }
  };

  const onRespond = async (invitationId: number, status: 'accepted' | 'declined') => {
    try {
      setRespondingId(invitationId);
      await api.respondToInterviewInvitation(invitationId, { status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('messagesPage.respondError'));
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
          <Mail size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-brand-black tracking-tight">{t('messagesPage.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('messagesPage.subtitle')}</p>
          {box === 'inbox' && unreadCount !== null && unreadCount > 0 && (
            <p className="text-xs font-bold text-brand-primary mt-2">
              {t('messagesPage.unreadBadge', { count: unreadCount })}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setBox('inbox')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            box === 'inbox'
              ? 'bg-brand-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Inbox size={18} />
          {t('messagesPage.inbox')}
        </button>
        <button
          type="button"
          onClick={() => setBox('sent')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            box === 'sent'
              ? 'bg-brand-primary text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Send size={18} />
          {t('messagesPage.sent')}
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} />
          <span>{t('messagesPage.loading')}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-gray-500 text-sm">
          {t('messagesPage.empty')}
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => {
            const inv = n.interview_invitation;
            const showRespond =
              isCandidate &&
              box === 'inbox' &&
              inv &&
              inv.status === 'pending' &&
              n.kind === 'interview_invite';

            return (
              <li key={n.id}>
                <article
                  className={`rounded-2xl border bg-white px-4 py-4 shadow-sm transition-colors ${
                    !n.read_at && box === 'inbox' ? 'border-brand-primary/30 bg-brand-primary/[0.03]' : 'border-gray-100'
                  }`}
                  onFocus={() => void onMarkRead(n)}
                  onMouseEnter={() => void onMarkRead(n)}
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {n.kind === 'interview_invite'
                          ? t('messagesPage.kindInterview')
                          : n.kind === 'message'
                            ? t('messagesPage.kindMessage')
                            : t('messagesPage.kindSystem')}
                      </p>
                      <h2 className="font-bold text-brand-black mt-1">{n.title}</h2>
                      {n.body ? (
                        <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{n.body}</p>
                      ) : null}
                      {inv ? (
                        <dl className="mt-3 text-sm text-gray-600 space-y-1">
                          <div>
                            <dt className="inline font-semibold text-gray-700">{t('messagesPage.job')}: </dt>
                            <dd className="inline">{inv.job_title}</dd>
                          </div>
                          <div>
                            <dt className="inline font-semibold text-gray-700">{t('messagesPage.when')}: </dt>
                            <dd className="inline">
                              {formatWhen(inv.proposed_start, i18n.language)} ({inv.timezone})
                            </dd>
                          </div>
                          {inv.location ? (
                            <div>
                              <dt className="inline font-semibold text-gray-700">{t('messagesPage.where')}: </dt>
                              <dd className="inline">{inv.location}</dd>
                            </div>
                          ) : null}
                          {inv.meeting_url ? (
                            <div>
                              <dt className="inline font-semibold text-gray-700">{t('messagesPage.link')}: </dt>
                              <dd className="inline">
                                <a
                                  href={inv.meeting_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-primary underline font-medium"
                                >
                                  {t('messagesPage.openLink')}
                                </a>
                              </dd>
                            </div>
                          ) : null}
                          <div>
                            <dt className="inline font-semibold text-gray-700">{t('messagesPage.status')}: </dt>
                            <dd className="inline capitalize">{inv.status}</dd>
                          </div>
                        </dl>
                      ) : null}
                    </div>
                    <time
                      className="text-xs text-gray-400 shrink-0 whitespace-nowrap"
                      dateTime={n.created_at}
                    >
                      {formatWhen(n.created_at, i18n.language)}
                    </time>
                  </div>

                  {showRespond && inv ? (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={respondingId === inv.id}
                        onClick={() => void onRespond(inv.id, 'accepted')}
                        className="rounded-xl px-4 py-2 text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {respondingId === inv.id ? t('messagesPage.working') : t('messagesPage.accept')}
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === inv.id}
                        onClick={() => void onRespond(inv.id, 'declined')}
                        className="rounded-xl px-4 py-2 text-sm font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {t('messagesPage.decline')}
                      </button>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default MessagesPage;
