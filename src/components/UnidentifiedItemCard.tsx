import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ScannedItem } from '@/api/types';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface UnidentifiedItemCardProps {
  item: ScannedItem;
  onPatch: (itemId: string, body: Record<string, unknown>) => Promise<void>;
}

// T040: FR-008 -- an item the AI couldn't match at all. Employee either types in
// details manually or excludes it; either way the rest of the lot can still confirm.
export function UnidentifiedItemCard({ item, onPatch }: UnidentifiedItemCardProps) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [price, setPrice] = useState('');

  const isExcluded = item.state === 'excluded';
  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.textSecondary }];

  const saveManualEntry = () => {
    if (!title.trim()) return;
    onPatch(item.itemId, {
      state: 'accepted',
      finalTitle: title.trim(),
      finalPlatform: platform.trim() || null,
      finalPrice: price ? Number(price) : null,
    });
  };

  const exclude = () => onPatch(item.itemId, { state: 'excluded' });
  const include = () => onPatch(item.itemId, { state: 'accepted' });

  if (isExcluded) {
    return (
      <ThemedView type="backgroundElement" style={[styles.card, styles.excluded]}>
        <ThemedText type="small" themeColor="textSecondary">
          Excluded (unidentified item)
        </ThemedText>
        <Pressable onPress={include}>
          <ThemedText type="linkPrimary">
            Include again
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Not identified</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Enter details by hand, or exclude it from this lot.
      </ThemedText>

      <TextInput style={inputStyle} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={inputStyle} placeholder="Platform (optional)" value={platform} onChangeText={setPlatform} />
      <TextInput
        style={inputStyle}
        placeholder="Price (optional)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />

      <View style={styles.actionsRow}>
        <Pressable onPress={saveManualEntry} style={styles.actionButton}>
          <ThemedText type="linkPrimary">
            Save
          </ThemedText>
        </Pressable>
        <Pressable onPress={exclude} style={styles.actionButton}>
          <ThemedText type="link" themeColor="textSecondary">
            Exclude
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  excluded: {
    opacity: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  actionButton: {
    paddingVertical: Spacing.one,
  },
});
