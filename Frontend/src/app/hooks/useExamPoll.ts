import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getSessionStatus, TestStatusDto } from '../services/apiService';
import { setSessionId } from '../services/api';

const POLL_INTERVAL = 5000;
const BACKOFF_INTERVAL = 15000;
const BACKOFF_DURATION = 60000;

interface UseExamPollOptions {
  sessionId: string;
  enabled: boolean;
  onExpired?: () => void;
}

export function useExamPoll({ sessionId, enabled, onExpired }: UseExamPollOptions) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TestStatusDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffUntilRef = useRef<number>(0);

  const poll = useCallback(async () => {
    if (!enabled || !sessionId) return;

    // Rate limit backoff
    if (Date.now() < backoffUntilRef.current) return;

    try {
      const data = await getSessionStatus(sessionId);
      setStatus(data);
      setError(null);

      // Terminal states — stop polling and navigate
      if (data.status === 'Completed') {
        clearInterval(intervalRef.current!);
        setSessionId(null);
        navigate(`/test-complete/${sessionId}`);
        return;
      }

      if (data.status === 'Expired') {
        clearInterval(intervalRef.current!);
        setSessionId(null);
        onExpired?.();
        navigate(`/test-expired/${sessionId}`);
        return;
      }

    } catch (err: any) {
      // 429 — back off for 60s
      if (err?.response?.status === 429) {
        backoffUntilRef.current = Date.now() + BACKOFF_DURATION;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(poll, BACKOFF_INTERVAL);
        }
        return;
      }

      // Network error — don't stop polling, just log
      setError('Network error — retrying...');
    }
  }, [sessionId, enabled, navigate, onExpired]);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    // Immediate first poll
    poll();

    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, sessionId, poll]);

  return { status, error };
}
