import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ItemCard } from '@/components/ItemCard';
import { SelectAllBar } from '@/components/SelectAllBar';
import { UnidentifiedItemCard } from '@/components/UnidentifiedItemCard';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { isConflict, useScanSession } from '@/state/useScanSession';
import { Spacing } from '@/constants/theme';

// T033-T037: the itemized review screen -- select/deselect-all, per-card
// accept/correct/exclude, confidence flags, the unidentified-item path, confirm, and
// discard (FR-015).
export default function ReviewScreen() {
  const router = useRouter();
  const { session, loading, error, patchItem, bulkSetState, confirm, discard, startOver } = useScanSession();
  const [confirming, setConfirming] = useState(false);

  if (loading || (!session && !error)) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="default" themeColor="textSecondary">
          Identifying items…
        </ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText type="subtitle" style={styles.centerText}>
          Scan failed
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.centerText}>
          {error}
        </ThemedText>
        <Pressable
          onPress={async () => {
            await startOver();
            router.replace('/');
          }}
          style={styles.retryButton}
        >
          <ThemedText type="linkPrimary">
            Try again
          </ThemedText>
        </Pressable>
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
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Review lot
        </ThemedText>
        <Pressable onPress={handleDiscard}>
          <ThemedText type="link" themeColor="textSecondary">
            Discard
          </ThemedText>
        </Pressable>
      </ThemedView>

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

      <Pressable onPress={handleConfirm} disabled={confirming} style={styles.confirmButton}>
        <ThemedText type="linkPrimary">
          {confirming ? 'Confirming…' : 'Confirm lot'}
        </ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.three },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three, padding: Spacing.four },
  centerText: { textAlign: 'center' },
  retryButton: { marginTop: Spacing.two },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.three },
  headerTitle: { fontSize: 28, lineHeight: 32 },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  confirmButton: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
