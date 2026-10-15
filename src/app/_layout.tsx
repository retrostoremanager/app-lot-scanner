import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const LightNavTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: Colors.light.background, primary: Colors.light.tint, card: Colors.light.backgroundElement, border: Colors.light.border, text: Colors.light.text } };
const DarkNavTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: Colors.dark.background, primary: Colors.dark.tint, card: Colors.dark.backgroundElement, border: Colors.dark.border, text: Colors.dark.text } };

// Home -> Capture -> Review -> (Correct) is a linear stack, not tabs -- there's nothing
// to switch between in this MVP slice.
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkNavTheme : LightNavTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Lot Scanner' }} />
        <Stack.Screen name="capture" options={{ title: 'Scan' }} />
        <Stack.Screen name="review" options={{ title: 'Review' }} />
        <Stack.Screen name="item-correct" options={{ title: 'Correct', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
