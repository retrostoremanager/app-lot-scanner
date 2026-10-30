import { getAuthToken } from '@/state/authToken';
import { MYSTORE_API_BASE_URL } from './config';

export class BillingApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type AddOnStatus = {
  addonType: string;
  active: boolean;
  status: string | null;
};

type SubscriptionStatus = {
  planName: string | null;
  status: string;
  addOns: AddOnStatus[];
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(`${MYSTORE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  const body = await response.text().catch(() => '');
  let parsed: ApiResponse<T> | undefined;
  try {
    parsed = body ? (JSON.parse(body) as ApiResponse<T>) : undefined;
  } catch {
    // body wasn't JSON
  }

  if (!response.ok || parsed?.success === false) {
    throw new BillingApiError(response.status, parsed?.message || body || response.statusText);
  }
  return (parsed?.data ?? (undefined as T));
}

export function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return request<SubscriptionStatus>('/billing/subscription');
}

export function subscribeLotScannerAddOn(): Promise<{ success: boolean; message?: string }> {
  return request('/billing/addons/lot-scanner', { method: 'POST' });
}

export function cancelLotScannerAddOn(): Promise<{ success: boolean; message?: string }> {
  return request('/billing/addons/lot-scanner', { method: 'DELETE' });
}
