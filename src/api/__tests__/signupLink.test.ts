import { computeSignupHref, DEFAULT_SIGNUP_HREF } from '@/api/signupLink';
import { MYSTORE_WEB_URL } from '@/api/config';

// Covers the actual bug login.tsx shipped with: the sign-up link's returnTo query param
// silently went missing because it was computed inline during render, which runs during
// Expo's static-export prerender (no `window`) and never updated on hydration. Fixed by
// moving the computation into a useEffect (client-only) calling this function -- kept in
// its own dependency-free module (no react-native/expo-router imports) specifically so it
// can be tested in isolation without those heavy dependencies breaking Jest's transform.
describe('computeSignupHref', () => {
  it('includes a returnTo pointing back to /login on web, with a known origin', () => {
    const href = computeSignupHref(true, 'http://localhost:8081');

    expect(href).toBe(
      `${MYSTORE_WEB_URL}/signup?returnTo=${encodeURIComponent('http://localhost:8081/login')}`,
    );
  });

  it('falls back to the plain signup URL (no returnTo) on native', () => {
    const href = computeSignupHref(false, 'http://localhost:8081');

    expect(href).toBe(DEFAULT_SIGNUP_HREF);
    expect(href).not.toContain('returnTo');
  });

  it('falls back to the plain signup URL when no origin is available', () => {
    const href = computeSignupHref(true, null);

    expect(href).toBe(DEFAULT_SIGNUP_HREF);
    expect(href).not.toContain('returnTo');
  });

  it('URL-encodes the origin so query-string characters cannot break the returnTo param', () => {
    const href = computeSignupHref(true, 'http://localhost:8081');

    // A raw, unencoded origin would terminate the query string at the first special char
    // and/or let a malicious origin inject extra params -- assert the encoding actually ran.
    expect(href).toContain(encodeURIComponent('http://localhost:8081/login'));
    expect(href).not.toContain('returnTo=http://localhost:8081/login');
  });
});
