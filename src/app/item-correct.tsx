import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { searchCatalog, updateItem } from '@/api/lotScanClient';
import type { CatalogCandidate } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// T038 (FR-006): search the catalog and swap in the correct game for one card,
// without touching any other item in the lot.
export default function ItemCorrectScreen() {
  const { sessionId, itemId } = useLocalSearchParams<{ sessionId: string; itemId: string }>();
  const router = useRouter();
  const theme = useTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [applying, setApplying] = useState<number | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchCatalog(query.trim()));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const selectCandidate = async (candidate: CatalogCandidate) => {
    setApplying(candidate.gameId);
    try {
      await updateItem(sessionId, itemId, {
        state: 'corrected',
        finalCatalogGameId: String(candidate.gameId),
      });
      router.replace('/review');
    } finally {
      setApplying(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Correct item
      </ThemedText>
      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.textSecondary }]}
        placeholder="Search by title…"
        value={query}
        onChangeText={setQuery}
        autoFocus
      />

      {searching && <ActivityIndicator style={styles.spinner} />}

      <FlatList
        data={results}
        keyExtractor={(c) => String(c.gameId)}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => selectCandidate(item)}
            disabled={applying !== null}
            style={styles.resultRow}
          >
            <ThemedView type="backgroundElement" style={styles.resultCard}>
              <ThemedText type="smallBold">{item.title}</ThemedText>
              {item.system && (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.system}
                  {item.variant ? ` · ${item.variant}` : ''}
                </ThemedText>
              )}
              {item.looseMedianCents !== null && (
                <ThemedText type="small" themeColor="textSecondary">
                  ~${(item.looseMedianCents / 100).toFixed(2)} loose
                </ThemedText>
              )}
              {applying === item.gameId && <ActivityIndicator />}
            </ThemedView>
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length >= 2 && !searching ? (
            <ThemedText type="default" themeColor="textSecondary" style={styles.empty}>
              No matches.
            </ThemedText>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.three },
  title: { fontSize: 28, lineHeight: 32, paddingVertical: Spacing.three },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  spinner: { marginBottom: Spacing.two },
  resultRow: { marginBottom: Spacing.two },
  resultCard: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.half },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
