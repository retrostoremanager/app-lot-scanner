import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lot-scanner.auth-session';

export type AuthSession = {
  token: string;
  companyId: number;
  email: string;
};

// Real login (Part A of the login/Stripe plan): the stored session now comes from
// fn-mystore's POST /accounts/login, the same credentials RSM web employees already use.
// fn-lot-scanner validates the identical JWT scheme, so no second auth system is needed.
let cached: AuthSession | null | undefined; // undefined = not loaded yet
const listeners = new Set<(session: AuthSession | null) => void>();

function notify(session: AuthSession | null) {
  cached = session;
  for (const listener of listeners) listener(session);
}

export function subscribeAuthSession(listener: (session: AuthSession | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  if (cached !== undefined) return cached;
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  const session = stored ? (JSON.parse(stored) as AuthSession) : null;
  cached = session;
  return session;
}

export async function getAuthToken(): Promise<string | null> {
  const session = await loadAuthSession();
  return session?.token ?? process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN ?? null;
}

export async function setAuthSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  notify(session);
}

// Called on logout and on any 401 from either backend (fn-mystore or fn-lot-scanner) --
// the JWT has no refresh mechanism, so an expired/invalid token just clears the session
// and the root layout redirects to /login.
export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  notify(null);
}
