import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

SplashScreen.preventAutoHideAsync();

// Capture -> Review -> (Correct) is a linear stack, not tabs -- there's nothing to
// switch between in this MVP slice.
export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Scan' }} />
        <Stack.Screen name="review" options={{ title: 'Review' }} />
        <Stack.Screen name="item-correct" options={{ title: 'Correct', presentation: 'modal', headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}
