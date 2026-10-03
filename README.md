# app-lot-scanner

React Native (Expo, Expo Router) app for AI game lot scanning. Implements
[retrostoremanager/lot-scanner](https://github.com/retrostoremanager/lot-scanner)'s
`specs/001-lot-scan-review/` user stories against `fn-lot-scanner`'s API.

## Flow

`src/app/index.tsx` (capture) → `src/app/review.tsx` (itemized review:
select/deselect-all, per-card accept/correct/exclude, confirm/discard) →
`src/app/item-correct.tsx` (catalog search, modal).

A linear Stack, not tabs — there's nothing to switch between in this slice.

## Structure

- `src/api/` — `lotScanClient.ts` (typed client for every endpoint in
  `contracts/lot-scan-api.md`), `types.ts`, `config.ts` (`EXPO_PUBLIC_API_BASE_URL`).
- `src/state/useScanSession.ts` — polling while a scan is `processing`, surfaces
  `failed` as a retryable error, persists the active session id to AsyncStorage so
  backgrounding/closing the app doesn't lose the employee's place (FR-010).
- `src/state/authToken.ts` — **placeholder**. Real employee login/SSO against
  RetroStoreManager's auth is out of scope for this slice (the contract says "mechanism
  TBD"); this just persists whatever Bearer token is set, the same way `fn-lot-scanner`
  validates it (ported `fn-mystore` JWT logic).
- `src/components/` — `ItemCard`, `SelectAllBar`, `UnidentifiedItemCard`.

## Known deviation from tasks.md

`tasks.md` sketches `app/` and `src/components/...` as sibling top-level dirs; the
actual Expo CLI template puts the router directory under `src/app/` (with `src/` as the
project root for everything, via the `@/` → `./src/*` path alias). Same architecture,
just one directory level different from what was sketched during planning.

## Local development

```bash
npm install
npx expo install   # keeps native deps SDK-aligned after any changes
npm start
npm test
npx tsc --noEmit
```

Set `EXPO_PUBLIC_API_BASE_URL` (e.g. via `.env.local` or `eas.json` per environment) to
point at a running `fn-lot-scanner` instance. For local dev without real employee auth
wired up yet, `EXPO_PUBLIC_DEV_AUTH_TOKEN` is read as a fallback Bearer token.

## Testing notes

Jest config lives in `package.json` (`jest-expo` preset). Two environment-specific
things were needed beyond the defaults, both because `@testing-library/react-native`
v14 and this Expo SDK 57 / React 19 stack are both very new:

- `render()` and `renderHook()` are now **async** in RNTL v14 — every test call awaits
  them.
- `test-renderer` (not the older `react-test-renderer`) is RNTL v14's actual peer
  dependency; it's a separate package and had to be installed explicitly.
- AsyncStorage's official Jest mock (`@react-native-async-storage/async-storage/jest/async-storage-mock`)
  is wired in via `moduleNameMapper`, not `setupFiles` — the mock file is a module
  replacement, not a script.
