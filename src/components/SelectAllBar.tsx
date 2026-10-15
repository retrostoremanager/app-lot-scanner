import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {acceptedCount} / {totalCount} accepted
      </ThemedText>
      <View style={styles.actions}>
        <Pressable onPress={onSelectAll} style={styles.button}>
          <Ionicons name="checkmark-done-outline" size={14} color={theme.tint} />
          <ThemedText type="small" style={{ color: theme.tint, fontWeight: '600' }}>
            Select all
          </ThemedText>
        </Pressable>
        <Pressable onPress={onDeselectAll} style={styles.button}>
          <ThemedText type="small" themeColor="textSecondary">
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
});
