import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/state/AuthContext';

SplashScreen.preventAutoHideAsync();

const LightNavTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: Colors.light.background, primary: Colors.light.tint, card: Colors.light.backgroundElement, border: Colors.light.border, text: Colors.light.text } };
const DarkNavTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: Colors.dark.background, primary: Colors.dark.tint, card: Colors.dark.backgroundElement, border: Colors.dark.border, text: Colors.dark.text } };

// Home -> Capture -> Review -> (Correct) is a linear stack, not tabs -- there's nothing
// to switch between in this MVP slice. Login sits outside that flow.
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" options={{ title: 'Sign in' }} />
            <Stack.Screen name="index" options={{ title: 'Lot Scanner' }} />
            <Stack.Screen name="capture" options={{ title: 'Scan' }} />
            <Stack.Screen name="review" options={{ title: 'Review' }} />
            <Stack.Screen name="item-correct" options={{ title: 'Correct', presentation: 'modal' }} />
            <Stack.Screen name="addon" options={{ title: 'Lot Scanner Add-on', presentation: 'modal' }} />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Redirects to /login whenever there's no session -- on first launch, and reactively if
// a 401 clears an existing one mid-use (see clearAuthSession in state/authToken.ts).
function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const onLoginScreen = segments[0] === 'login';
    if (!session && !onLoginScreen) {
      router.replace('/login');
    } else if (session && onLoginScreen) {
      router.replace('/');
    }
  }, [loading, session, segments, router]);

  return <>{children}</>;
}
