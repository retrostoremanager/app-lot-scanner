import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// The home screen -- no camera here, just an entry point into a scan. Capture is its
// own route (/capture) so there's a real "nothing started yet" screen to land back on
// after confirming or discarding a lot.
export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Lot Scanner
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Photograph a customer's game lot to get an instant AI-assisted quote.
        </ThemedText>
        <Pressable onPress={() => router.push('/capture')} style={styles.startButton}>
          <ThemedText type="linkPrimary" style={styles.startButtonText}>
            Start new scan
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.three,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  startButton: { marginTop: Spacing.three },
  startButtonText: { fontSize: 18 },
});
