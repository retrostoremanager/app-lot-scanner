import { getAuthToken } from '@/state/authToken';
import { API_BASE_URL } from './config';
import type {
  CatalogCandidate,
  ConfirmResponse,
  CreateScanResponse,
  DiscardResponse,
  LotScanSession,
  PatchItemRequest,
  ScannedItem,
} from './types';

export class LotScanApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new LotScanApiError(response.status, body || response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// POST /lot-scans (contracts/lot-scan-api.md). T030.
export async function createScan(photo: { uri: string; type: string; name: string }): Promise<CreateScanResponse> {
  const form = new FormData();
  // React Native's FormData accepts this { uri, type, name } shape directly.
  form.append('photo', photo as unknown as Blob);
  return request<CreateScanResponse>('/lot-scans', { method: 'POST', body: form });
}

// GET /lot-scans/{id}
export function getScan(sessionId: string): Promise<LotScanSession> {
  return request<LotScanSession>(`/lot-scans/${sessionId}`);
}

// PATCH /lot-scans/{id}/items/{itemId}
export function updateItem(sessionId: string, itemId: string, body: PatchItemRequest): Promise<ScannedItem> {
  return request<ScannedItem>(`/lot-scans/${sessionId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

// PATCH /lot-scans/{id}/items:bulk
export function bulkUpdateItems(
  sessionId: string,
  itemIds: string[],
  state: 'accepted' | 'pending',
): Promise<ScannedItem[]> {
  return request<ScannedItem[]>(`/lot-scans/${sessionId}/items:bulk`, {
    method: 'PATCH',
    body: JSON.stringify({ state, itemIds }),
  });
}

// POST /lot-scans/{id}/confirm
export function confirmScan(sessionId: string): Promise<ConfirmResponse> {
  return request<ConfirmResponse>(`/lot-scans/${sessionId}/confirm`, { method: 'POST' });
}

// POST /lot-scans/{id}/discard (FR-015)
export function discardScan(sessionId: string): Promise<DiscardResponse> {
  return request<DiscardResponse>(`/lot-scans/${sessionId}/discard`, { method: 'POST' });
}

// GET /lot-scans/catalog-search?q= (FR-006)
export function searchCatalog(query: string, platform?: string): Promise<CatalogCandidate[]> {
  const qs = new URLSearchParams({ q: query, ...(platform ? { platform } : {}) });
  return request<CatalogCandidate[]>(`/lot-scans/catalog-search?${qs.toString()}`);
}
