import { useEffect, useRef } from 'react';

type Options = {
  enabled: boolean;
  pollIntervalMs: number;
  onSync: () => void | Promise<void>;
};

/**
 * Periodic refresh for the recruiter dashboard. WebSocket support can be added later via env.
 */
export function useRecruiterLiveSync({ enabled, pollIntervalMs, onSync }: Options) {
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;
    const id = window.setInterval(() => void onSyncRef.current(), pollIntervalMs);
    return () => clearInterval(id);
  }, [enabled, pollIntervalMs]);
}
