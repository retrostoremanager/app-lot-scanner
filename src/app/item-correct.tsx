import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { searchCatalog, updateItem } from '@/api/lotScanClient';
import type { CatalogCandidate } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
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
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle">Correct item</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Search by title…"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {searching && <ActivityIndicator size="small" />}
        </View>

        <FlatList
          data={results}
          keyExtractor={(c) => String(c.gameId)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => selectCandidate(item)} disabled={applying !== null}>
              <ThemedView
                type="backgroundElement"
                style={[styles.resultCard, { borderColor: theme.border }]}
              >
                <View style={styles.resultText}>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                  {item.system && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.system}
                      {item.variant ? ` · ${item.variant}` : ''}
                    </ThemedText>
                  )}
                  {item.looseMedianCents !== null && (
                    <ThemedText type="small" style={{ color: theme.success, fontWeight: '600' }}>
                      ~${(item.looseMedianCents / 100).toFixed(2)} loose
                    </ThemedText>
                  )}
                </View>
                {applying === item.gameId ? (
                  <ActivityIndicator />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                )}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.three },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  closeButton: { padding: Spacing.one },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  list: { gap: Spacing.two, paddingBottom: Spacing.four },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  resultText: { flex: 1, gap: Spacing.half },
  empty: { textAlign: 'center', marginTop: Spacing.four },
});
