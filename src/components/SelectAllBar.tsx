import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface SelectAllBarProps {
  onSelectAll: () => void;
  onDeselectAll: () => void;
  acceptedCount: number;
  totalCount: number;
}

// T034 (FR-004). Bulk actions are scoped server-side to pending/accepted items only
// (contracts/lot-scan-api.md), so this bar is safe to wire to "every item id" without
// the client needing to know which items are already corrected/excluded.
export function SelectAllBar({ onSelectAll, onDeselectAll, acceptedCount, totalCount }: SelectAllBarProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {acceptedCount} / {totalCount} accepted
      </ThemedText>
      <View style={styles.actions}>
        <Pressable onPress={onSelectAll} style={styles.button}>
          <ThemedText type="linkPrimary">
            Select all
          </ThemedText>
        </Pressable>
        <Pressable onPress={onDeselectAll} style={styles.button}>
          <ThemedText type="link" themeColor="textSecondary">
            Deselect all
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    paddingVertical: Spacing.one,
  },
});
