import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import { clearAuthSession, getAuthToken } from '@/state/authToken';
import { API_BASE_URL } from './config';
import type {
  CatalogCandidate,
  ConfirmResponse,
  CreateScanResponse,
  DiscardResponse,
  LotScanSession,
  PatchItemRequest,
  ScannedItem,
  SessionSummary,
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
    // No refresh token exists for this JWT -- a 401 means the session is dead (expired or
    // revoked), so clear it now rather than let every call site fail the same way. The root
    // layout's auth-state subscription redirects to /login as soon as this fires.
    if (response.status === 401) await clearAuthSession();
    const body = await response.text().catch(() => '');
    throw new LotScanApiError(response.status, body || response.statusText);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// Neither the classic FormData.append({ uri, type, name }) object-literal shape nor
// fetch(uri).blob() reliably reads a local file:// URI on RN 0.86 -- the former throws
// ("Unsupported FormDataPart implementation"), and the latter can silently 404 against
// Expo's own ImagePicker cache path and upload the error body instead of the photo.
// expo-file-system's native upload reads the file at the native layer, bypassing both.
//
// None of that applies on web: expo-file-system has no real web implementation at all
// (its File.upload() is a no-op stub -- confirmed in node_modules, always resolves
// { status: 0 }, never touches the network). But web's `photo.uri` is always a browser
// blob:/data: URL (from expo-camera or <input type=file> under the hood), which
// fetch().blob() reads perfectly reliably -- the RN failure mode above is specific to
// native local-file:// paths, not browser object URLs. So web gets the fetch/FormData
// path that was deliberately avoided for native.
async function uploadPhoto(
  url: string,
  photo: { uri: string; type: string; name: string },
): Promise<{ status: number; body: string }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  if (Platform.OS === 'web') {
    const blob = await fetch(photo.uri).then((r) => r.blob());
    const form = new FormData();
    form.append('photo', blob, photo.name);
    const response = await fetch(url, { method: 'POST', body: form, headers });
    const body = await response.text().catch(() => '');
    return { status: response.status, body };
  }

  const result = await new File(photo.uri).upload(url, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'photo',
    mimeType: photo.type,
    headers,
  });
  return { status: result.status, body: result.body };
}

// POST /lot-scans (contracts/lot-scan-api.md). T030.
export async function createScan(photo: { uri: string; type: string; name: string }): Promise<CreateScanResponse> {
  const result = await uploadPhoto(`${API_BASE_URL}/lot-scans`, photo);
  if (result.status < 200 || result.status >= 300) {
    if (result.status === 401) await clearAuthSession();
    throw new LotScanApiError(result.status, result.body || `HTTP ${result.status}`);
  }
  return JSON.parse(result.body) as CreateScanResponse;
}

// GET /lot-scans/{id}
export function getScan(sessionId: string): Promise<LotScanSession> {
  return request<LotScanSession>(`/lot-scans/${sessionId}`);
}

// GET /lot-scans?status=&limit=&offset= -- store-scoped history, any employee at the
// company sees all of it.
export function listScans(status?: string, limit?: number, offset?: number): Promise<SessionSummary[]> {
  const qs = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(limit ? { limit: String(limit) } : {}),
    ...(offset ? { offset: String(offset) } : {}),
  });
  const query = qs.toString();
  return request<SessionSummary[]>(`/lot-scans${query ? `?${query}` : ''}`);
}

// POST /lot-scans/{id}/photos -- adds a photo to a scan that's still in_review.
export async function addPhotoToScan(
  sessionId: string,
  photo: { uri: string; type: string; name: string },
): Promise<CreateScanResponse> {
  const result = await uploadPhoto(`${API_BASE_URL}/lot-scans/${sessionId}/photos`, photo);
  if (result.status < 200 || result.status >= 300) {
    if (result.status === 401) await clearAuthSession();
    throw new LotScanApiError(result.status, result.body || `HTTP ${result.status}`);
  }
  return JSON.parse(result.body) as CreateScanResponse;
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
