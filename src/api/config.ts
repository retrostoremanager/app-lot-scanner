// EXPO_PUBLIC_* vars are inlined at build time (Expo's env convention) -- set via
// app config / eas.json per environment, not committed here.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:7071/api';
