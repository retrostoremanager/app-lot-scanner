import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// The home screen -- no camera here, just an entry point into a scan. Capture is its
// own route (/capture) so there's a real "nothing started yet" screen to land back on
// after confirming or discarding a lot.
export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.accountButton}>
          <Button label="Add-on" variant="ghost" icon="settings-outline" size="small" onPress={() => router.push('/addon')} />
        </View>

        <View style={[styles.mark, { backgroundColor: theme.tint }]}>
          <Ionicons name="game-controller" size={36} color={theme.tintText} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Lot Scanner
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Photograph a customer's game lot to get an instant AI-assisted quote.
        </ThemedText>

        <View style={styles.action}>
          <Button
            label="Start new scan"
            icon="camera"
            fullWidth
            onPress={() => router.push('/capture')}
          />
        </View>
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
    gap: Spacing.two,
  },
  accountButton: { position: 'absolute', top: Spacing.three, right: Spacing.three },
  mark: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320 },
  action: { width: '100%', maxWidth: 320, marginTop: Spacing.four },
});
