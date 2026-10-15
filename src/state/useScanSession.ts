import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  bulkUpdateItems,
  confirmScan,
  createScan,
  discardScan,
  getScan,
  LotScanApiError,
  updateItem,
} from '@/api/lotScanClient';
import type { ConfirmResponse, ItemState, LotScanSession, PatchItemRequest } from '@/api/types';

const ACTIVE_SESSION_KEY = 'lot-scanner.active-session-id';
const POLL_INTERVAL_MS = 2000;

// T032, T036: polls GET /lot-scans/{id} while processing, surfaces `failed` as a
// retry-able error instead of polling forever (spec.md Edge Case), and persists the
// active session id so backgrounding/closing the app before confirming doesn't lose
// the employee's place (FR-010).
export function useScanSession() {
  const [session, setSession] = useState<LotScanSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = null;
  }, []);

  const refresh = useCallback(async (sessionId: string) => {
    try {
      const latest = await getScan(sessionId);
      setSession(latest);
      if (latest.status === 'processing') {
        pollTimer.current = setTimeout(() => refresh(sessionId), POLL_INTERVAL_MS);
      } else if (latest.status === 'failed') {
        setError(latest.errorMessage ?? 'The scan failed. Try again with a new photo.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the scan.');
    }
  }, []);

  // FR-010: resume an in-progress session on mount if one was left unfinished.
  useEffect(() => {
    (async () => {
      const storedId = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (!storedId) return;
      setLoading(true);
      await refresh(storedId);
      setLoading(false);
    })();
    return () => stopPolling();
  }, [refresh, stopPolling]);

  const startScan = useCallback(
    async (photo: { uri: string; type: string; name: string }) => {
      setLoading(true);
      setError(null);
      try {
        const created = await createScan(photo);
        await AsyncStorage.setItem(ACTIVE_SESSION_KEY, created.sessionId);
        await refresh(created.sessionId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not start the scan.';
        setError(message);
        // Re-thrown so the caller (capture screen) doesn't navigate to a review screen
        // for a session that was never actually created -- without this, a failed
        // upload left the user stuck on review's "Identifying items..." forever, since
        // no session id was ever stored for it to resume from.
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const patchItem = useCallback(
    async (itemId: string, body: PatchItemRequest) => {
      if (!session) return;
      const updated = await updateItem(session.sessionId, itemId, body);
      setSession((prev) =>
        prev ? { ...prev, items: prev.items.map((i) => (i.itemId === itemId ? updated : i)) } : prev,
      );
    },
    [session],
  );

  // Select-all / deselect-all (FR-004): send every item id, server-side scoping rule
  // (contracts/lot-scan-api.md) ensures corrected/excluded/unidentified items are left
  // untouched regardless of what's in this list.
  const bulkSetState = useCallback(
    async (state: 'accepted' | 'pending') => {
      if (!session) return;
      const updatedItems = await bulkUpdateItems(session.sessionId, session.items.map((i) => i.itemId), state);
      setSession((prev) => (prev ? { ...prev, items: updatedItems } : prev));
    },
    [session],
  );

  const confirm = useCallback(async (): Promise<ConfirmResponse> => {
    if (!session) throw new Error('No active session.');
    const result = await confirmScan(session.sessionId);
    setSession((prev) => (prev ? { ...prev, status: result.status } : prev));
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
    return result;
  }, [session]);

  const discard = useCallback(async () => {
    if (!session) return;
    const result = await discardScan(session.sessionId);
    setSession((prev) => (prev ? { ...prev, status: result.status } : prev));
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [session]);

  const startOver = useCallback(async () => {
    stopPolling();
    setSession(null);
    setError(null);
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [stopPolling]);

  return { session, loading, error, startScan, patchItem, bulkSetState, confirm, discard, startOver };
}

export function isConflict(err: unknown): boolean {
  return err instanceof LotScanApiError && err.status === 409;
}

export const BULK_ELIGIBLE: ItemState[] = ['pending', 'accepted'];
