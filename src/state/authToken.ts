import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'lot-scanner.auth-token';

// NOTE: real employee login/SSO against RetroStoreManager's auth is out of scope for
// this slice (contracts/lot-scan-api.md: "mechanism TBD at implementation -- not
// re-decided here"). For now a token is set manually (dev tooling / a future deep link
// from mystore's own login) and just persisted here; fn-lot-scanner validates whatever
// Bearer token is sent the same way fn-mystore does.
export async function getAuthToken(): Promise<string | null> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  return stored ?? process.env.EXPO_PUBLIC_DEV_AUTH_TOKEN ?? null;
}

export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, token);
}
