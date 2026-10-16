import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LOW_CONFIDENCE_THRESHOLD, type ScannedItem } from '@/api/types';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ItemCardProps {
  item: ScannedItem;
  sessionId: string;
  onPatch: (itemId: string, body: Record<string, unknown>) => Promise<void>;
}

// T033 (card list + confidence badge, FR-007), T039 (manual price override, FR-014).
export function ItemCard({ item, sessionId, onPatch }: ItemCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const [priceDraft, setPriceDraft] = useState(String(item.finalPrice ?? item.suggestedPrice ?? ''));

  const isLowConfidence = item.confidence !== null && item.confidence < LOW_CONFIDENCE_THRESHOLD;
  const isAccepted = item.state === 'accepted';
  const isExcluded = item.state === 'excluded';
  const isCorrected = item.state === 'corrected';

  const title = item.finalTitle ?? item.suggestedTitle ?? 'Unknown item';
  const platform = item.finalPlatform ?? item.suggestedPlatform;

  const toggleAccept = () => onPatch(item.itemId, { state: isAccepted ? 'excluded' : 'accepted' });
  const exclude = () => onPatch(item.itemId, { state: 'excluded' });
  const include = () => onPatch(item.itemId, { state: 'accepted' });

  const commitPrice = () => {
    const parsed = Number(priceDraft);
    if (!Number.isNaN(parsed)) onPatch(item.itemId, { finalPrice: parsed });
  };

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.card,
        { borderColor: isAccepted || isCorrected ? theme.tint : theme.border },
        isExcluded && styles.excluded,
      ]}
    >
      <View style={styles.headerRow}>
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
        {isLowConfidence && (
          <View style={[styles.badge, { backgroundColor: theme.warningSoft }]}>
            <ThemedText type="small" style={{ color: theme.warning }}>
              needs a look
            </ThemedText>
          </View>
        )}
        {isCorrected && (
          <View style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="small" style={{ color: theme.tint }}>
              corrected
            </ThemedText>
          </View>
        )}
      </View>

      {platform && <ThemedText type="small" themeColor="textSecondary">{platform}</ThemedText>}

      <View style={styles.priceRow}>
        <ThemedText type="small" themeColor="textSecondary">
          $
        </ThemedText>
        <TextInput
          style={[styles.priceInput, { color: theme.text, borderBottomColor: theme.border }]}
          value={priceDraft}
          placeholder="Enter price"
          placeholderTextColor={theme.textSecondary}
          onChangeText={setPriceDraft}
          onBlur={commitPrice}
          keyboardType="decimal-pad"
          editable={!isExcluded}
        />
      </View>

      <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
        {!isExcluded ? (
          <>
            <Pressable onPress={toggleAccept} style={styles.actionButton}>
              <Ionicons
                name={isAccepted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={16}
                color={isAccepted ? theme.success : theme.tint}
              />
              <ThemedText type="small" style={{ color: isAccepted ? theme.success : theme.tint, fontWeight: '600' }}>
                {isAccepted ? 'Accepted' : 'Accept'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/item-correct', params: { sessionId, itemId: item.itemId } })}
              style={styles.actionButton}
            >
              <Ionicons name="pencil-outline" size={15} color={theme.tint} />
              <ThemedText type="small" style={{ color: theme.tint, fontWeight: '600' }}>
                Correct
              </ThemedText>
            </Pressable>
            <Pressable onPress={exclude} style={styles.actionButton}>
              <Ionicons name="close-circle-outline" size={16} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                Exclude
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={include} style={styles.actionButton}>
            <Ionicons name="add-circle-outline" size={16} color={theme.tint} />
            <ThemedText type="small" style={{ color: theme.tint, fontWeight: '600' }}>
              Include again
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  excluded: {
    opacity: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  priceInput: {
    minWidth: 72,
    fontSize: 18,
    fontWeight: '600',
    paddingVertical: Spacing.half,
    borderBottomWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.four,
    marginTop: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
});
