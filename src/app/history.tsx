import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useScanSession } from '@/state/useScanSession';
import { listScans, LotScanApiError } from '@/api/lotScanClient';
import type { SessionStatus, SessionSummary } from '@/api/types';

const STATUS_LABEL: Record<SessionStatus, string> = {
  processing: 'Processing',
  in_review: 'In review',
  confirmed: 'Confirmed',
  discarded: 'Discarded',
  failed: 'Failed',
};

function statusColorKey(status: SessionStatus): 'tint' | 'success' | 'textSecondary' | 'danger' {
  if (status === 'in_review' || status === 'processing') return 'tint';
  if (status === 'confirmed') return 'success';
  if (status === 'failed') return 'danger';
  return 'textSecondary';
}

export default function HistoryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { openScan } = useScanSession();

  const [scans, setScans] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setScans(await listScans());
    } catch (err) {
      setScans([]);
      setError(err instanceof LotScanApiError ? err.message : 'Could not load scan history.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openRow = async (sessionId: string) => {
    await openScan(sessionId);
    router.push('/review');
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Scan history
          </ThemedText>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
            <Button label="Retry" size="small" variant="secondary" onPress={load} />
          </View>
        )}

        <FlatList
          data={scans ?? []}
          keyExtractor={(item) => item.sessionId}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            scans !== null ? (
              <View style={styles.empty}>
                <ThemedText type="default" themeColor="textSecondary">
                  No scans yet. Start one from the home screen.
                </ThemedText>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openRow(item.sessionId)}
              style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={styles.rowMain}>
                <ThemedText type="smallBold">{new Date(item.createdAt).toLocaleString()}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.employeeId} · {item.photoCount} photo{item.photoCount === 1 ? '' : 's'} ·{' '}
                  {item.itemCount} item{item.itemCount === 1 ? '' : 's'}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" themeColor={statusColorKey(item.status)}>
                {STATUS_LABEL[item.status]}
              </ThemedText>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 20, lineHeight: 24 },
  errorBox: { padding: Spacing.three, gap: Spacing.two, alignItems: 'flex-start' },
  list: { gap: Spacing.two, padding: Spacing.three, paddingBottom: Spacing.five },
  empty: { paddingTop: Spacing.five, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowMain: { flex: 1, gap: Spacing.half },
});
