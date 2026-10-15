import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { ScannedItem } from '@/api/types';
import { Radius, Spacing } from '@/constants/theme';
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
  const inputStyle = [
    styles.input,
    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
  ];

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
      <ThemedView type="backgroundElement" style={[styles.card, styles.excludedCard]}>
        <ThemedText type="small" themeColor="textSecondary">
          Excluded (unidentified item)
        </ThemedText>
        <Pressable onPress={include} style={styles.inlineAction}>
          <Ionicons name="add-circle-outline" size={16} color={theme.tint} />
          <ThemedText type="small" style={{ color: theme.tint, fontWeight: '600' }}>
            Include again
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.warning }]}>
      <View style={styles.headerRow}>
        <Ionicons name="help-circle-outline" size={18} color={theme.warning} />
        <ThemedText type="smallBold">Not identified</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Enter details by hand, or exclude it from this lot.
      </ThemedText>

      <TextInput style={inputStyle} placeholder="Title" placeholderTextColor={theme.textSecondary} value={title} onChangeText={setTitle} />
      <TextInput
        style={inputStyle}
        placeholder="Platform (optional)"
        placeholderTextColor={theme.textSecondary}
        value={platform}
        onChangeText={setPlatform}
      />
      <TextInput
        style={inputStyle}
        placeholder="Price (optional)"
        placeholderTextColor={theme.textSecondary}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />

      <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
        <Pressable onPress={saveManualEntry} style={styles.inlineAction}>
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.tint} />
          <ThemedText type="small" style={{ color: theme.tint, fontWeight: '600' }}>
            Save
          </ThemedText>
        </Pressable>
        <Pressable onPress={exclude} style={styles.inlineAction}>
          <Ionicons name="close-circle-outline" size={16} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary">
            Exclude
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  excludedCard: {
    opacity: 0.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
});
