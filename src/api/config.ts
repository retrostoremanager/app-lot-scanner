// EXPO_PUBLIC_* vars are inlined at build time (Expo's env convention) -- set via
// app config / eas.json per environment, not committed here.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:7071/api';

// Login and the Lot Scanner add-on live on fn-mystore, not fn-lot-scanner -- a separate
// base URL since this app talks to both backends.
export const MYSTORE_API_BASE_URL = process.env.EXPO_PUBLIC_MYSTORE_API_BASE_URL ?? 'http://localhost:7072/api';
