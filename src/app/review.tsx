import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ItemCard } from '@/components/ItemCard';
import { SelectAllBar } from '@/components/SelectAllBar';
import { UnidentifiedItemCard } from '@/components/UnidentifiedItemCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isConflict, useScanSession } from '@/state/useScanSession';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// T033-T037: the itemized review screen -- select/deselect-all, per-card
// accept/correct/exclude, confidence flags, the unidentified-item path, confirm, and
// discard (FR-015).
export default function ReviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session, loading, error, patchItem, bulkSetState, confirm, discard, startOver } = useScanSession();
  const [confirming, setConfirming] = useState(false);

  if (loading || (!session && !error)) {
    return (
      <ThemedView style={styles.center}>
        <View style={[styles.loadingIcon, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="sparkles-outline" size={26} color={theme.tint} />
        </View>
        <ThemedText type="default" themeColor="textSecondary">
          Identifying items…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <View style={[styles.loadingIcon, { backgroundColor: theme.dangerSoft }]}>
          <Ionicons name="alert-circle-outline" size={28} color={theme.danger} />
        </View>
        <ThemedText type="subtitle" style={styles.centerText}>
          Scan failed
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
          {error}
        </ThemedText>
        <View style={styles.retryButton}>
          <Button
            label="Try again"
            variant="secondary"
            onPress={async () => {
              await startOver();
              router.replace('/');
            }}
          />
        </View>
      </ThemedView>
    );
  }

  if (!session) return null;

  const acceptedCount = session.items.filter((i) => i.state === 'accepted' || i.state === 'corrected').length;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await confirm();
      Alert.alert('Lot confirmed', 'The quote is ready.', [{ text: 'OK', onPress: () => router.replace('/') }]);
    } catch (err) {
      if (isConflict(err)) {
        Alert.alert('Not quite ready', 'Finish reviewing every item before confirming.');
      } else {
        Alert.alert('Could not confirm', err instanceof Error ? err.message : 'Unknown error.');
      }
    } finally {
      setConfirming(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert('Discard this scan?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: async () => {
          await discard();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText type="subtitle" style={styles.headerTitle}>
            Review lot
          </ThemedText>
          <Pressable onPress={handleDiscard} style={styles.discardButton} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={theme.danger} />
            <ThemedText type="small" style={{ color: theme.danger }}>
              Discard
            </ThemedText>
          </Pressable>
        </View>

        <SelectAllBar
          totalCount={session.items.length}
          acceptedCount={acceptedCount}
          onSelectAll={() => bulkSetState('accepted')}
          onDeselectAll={() => bulkSetState('pending')}
        />

        <FlatList
          data={session.items}
          keyExtractor={(item) => item.itemId}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            item.state === 'unidentified' ? (
              <UnidentifiedItemCard item={item} onPatch={patchItem} />
            ) : (
              <ItemCard item={item} sessionId={session.sessionId} onPatch={patchItem} />
            )
          }
        />

        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
          <Button
            label={confirming ? 'Confirming…' : `Confirm lot (${acceptedCount})`}
            icon={confirming ? undefined : 'checkmark-circle'}
            loading={confirming}
            fullWidth
            onPress={handleConfirm}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  centerText: { textAlign: 'center' },
  loadingIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  retryButton: { marginTop: Spacing.two },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 24, lineHeight: 28 },
  discardButton: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half },
  list: { gap: Spacing.two, padding: Spacing.three, paddingBottom: Spacing.four },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
