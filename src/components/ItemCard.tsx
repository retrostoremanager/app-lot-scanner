import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LOW_CONFIDENCE_THRESHOLD, type ScannedItem } from '@/api/types';
import { Spacing } from '@/constants/theme';
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
      type={isAccepted || isCorrected ? 'backgroundSelected' : 'backgroundElement'}
      style={[styles.card, isExcluded && styles.excluded]}
    >
      <View style={styles.headerRow}>
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
        {isLowConfidence && (
          <ThemedView type="background" style={styles.badge}>
            <ThemedText type="small" themeColor="textSecondary">
              needs a look
            </ThemedText>
          </ThemedView>
        )}
        {isCorrected && (
          <ThemedView type="background" style={styles.badge}>
            <ThemedText type="small" themeColor="textSecondary">
              corrected
            </ThemedText>
          </ThemedView>
        )}
      </View>

      {platform && <ThemedText type="small" themeColor="textSecondary">{platform}</ThemedText>}

      <View style={styles.priceRow}>
        <ThemedText type="small" themeColor="textSecondary">
          $
        </ThemedText>
        <TextInput
          style={[styles.priceInput, { color: theme.text }]}
          value={priceDraft}
          onChangeText={setPriceDraft}
          onBlur={commitPrice}
          keyboardType="decimal-pad"
          editable={!isExcluded}
        />
      </View>

      <View style={styles.actionsRow}>
        {!isExcluded ? (
          <>
            <Pressable onPress={toggleAccept} style={styles.actionButton}>
              <ThemedText type={isAccepted ? 'smallBold' : 'linkPrimary'}>
                {isAccepted ? '✓ Accepted' : 'Accept'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push({ pathname: '/item-correct', params: { sessionId, itemId: item.itemId } })}
              style={styles.actionButton}
            >
              <ThemedText type="linkPrimary">
                Correct
              </ThemedText>
            </Pressable>
            <Pressable onPress={exclude} style={styles.actionButton}>
              <ThemedText type="link" themeColor="textSecondary">
                Exclude
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={include} style={styles.actionButton}>
            <ThemedText type="linkPrimary">
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
    borderRadius: Spacing.three,
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
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
  },
  priceInput: {
    minWidth: 64,
    fontSize: 16,
    paddingVertical: Spacing.half,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  actionButton: {
    paddingVertical: Spacing.one,
  },
});
