import { MYSTORE_WEB_URL } from './config';

// Pulled out of login.tsx as a dependency-free pure function (no react-native/expo-router
// imports) so it's unit-testable without pulling in those heavy, hard-to-transform-in-Jest
// dependencies just to check a URL string. See login.tsx's own comment for the actual bug
// this guards against: the returnTo param going missing because it was computed inline
// during Expo's static-export prerender (no `window` there).
export const DEFAULT_SIGNUP_HREF = `${MYSTORE_WEB_URL}/signup`;

export function computeSignupHref(isWeb: boolean, currentOrigin: string | null): string {
  if (!isWeb || !currentOrigin) return DEFAULT_SIGNUP_HREF;
  const returnTo = `${currentOrigin}/login`;
  return `${MYSTORE_WEB_URL}/signup?returnTo=${encodeURIComponent(returnTo)}`;
}
