import { File, UploadType } from 'expo-file-system';
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
  // Neither the classic FormData.append({ uri, type, name }) object-literal shape nor
  // fetch(uri).blob() reliably reads a local file:// URI on RN 0.86 -- the former throws
  // ("Unsupported FormDataPart implementation"), and the latter can silently 404 against
  // Expo's own ImagePicker cache path and upload the error body instead of the photo.
  // expo-file-system's native upload reads the file at the native layer, bypassing both.
  const token = await getAuthToken();
  const result = await new File(photo.uri).upload(`${API_BASE_URL}/lot-scans`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'photo',
    mimeType: photo.type,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (result.status < 200 || result.status >= 300) {
    throw new LotScanApiError(result.status, result.body || `HTTP ${result.status}`);
  }
  return JSON.parse(result.body) as CreateScanResponse;
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
