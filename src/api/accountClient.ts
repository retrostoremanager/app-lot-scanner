import { MYSTORE_API_BASE_URL } from './config';

export class AccountApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type LoginResponse = {
  token: string;
  companyId: number;
  email: string;
};

// fn-mystore wraps every response in ApiResponse<T>: { success, data, message, errors }.
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

// POST /accounts/login on fn-mystore -- the same employee-login endpoint RSM's web app
// uses. Login is slug-scoped (not global), so a store's employees need their company's
// URL slug, not just an email/password. Returns 200 w/ success:false AND plain 401s are
// both possible failure shapes here, so check both.
export async function login(slug: string, email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${MYSTORE_API_BASE_URL}/accounts/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, email, password }),
  });

  const body = await response.text().catch(() => '');
  let parsed: ApiResponse<LoginResponse> | undefined;
  try {
    parsed = body ? (JSON.parse(body) as ApiResponse<LoginResponse>) : undefined;
  } catch {
    // body wasn't JSON
  }

  if (!response.ok || !parsed?.success || !parsed.data) {
    throw new AccountApiError(response.status, parsed?.message || body || response.statusText);
  }

  return parsed.data;
}
