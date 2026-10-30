import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  BillingApiError,
  cancelLotScannerAddOn,
  getSubscriptionStatus,
  subscribeLotScannerAddOn,
} from '@/api/billingClient';

const ADDON_TYPE = 'lot_scanner';

export default function AddOnScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [active, setActive] = useState<boolean | null>(null); // null = loading
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const status = await getSubscriptionStatus();
      setActive(status.addOns.some((a) => a.addonType === ADDON_TYPE && a.active));
    } catch (err) {
      setActive(false);
      setError(err instanceof BillingApiError ? err.message : 'Could not load add-on status.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleToggle() {
    setSubmitting(true);
    setError(null);
    try {
      const result = active ? await cancelLotScannerAddOn() : await subscribeLotScannerAddOn();
      if (!result.success) {
        setError(result.message ?? 'Something went wrong.');
      }
      await refresh();
    } catch (err) {
      setError(err instanceof BillingApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={styles.back}>
          <Button label="Back" variant="ghost" icon="chevron-back" onPress={() => router.back()} />
        </View>

        <View style={[styles.mark, { backgroundColor: theme.tint }]}>
          <Ionicons name="scan" size={36} color={theme.tintText} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Lot Scanner
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          AI-assisted lot scanning for your store. $49/month, billed with your RetroStoreManager
          subscription.
        </ThemedText>

        {active !== null && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: active ? theme.successSoft : theme.backgroundSelected },
            ]}
          >
            <ThemedText type="smallBold" themeColor={active ? 'success' : 'textSecondary'}>
              {active ? 'Active' : 'Not active'}
            </ThemedText>
          </View>
        )}

        {error && (
          <ThemedText type="small" themeColor="danger" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <View style={styles.action}>
          <Button
            label={active ? 'Cancel add-on' : 'Enable add-on'}
            variant={active ? 'destructive' : 'primary'}
            fullWidth
            loading={submitting || active === null}
            disabled={active === null}
            onPress={handleToggle}
          />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  back: { position: 'absolute', top: Spacing.three, left: Spacing.three },
  mark: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320 },
  statusBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    marginTop: Spacing.two,
  },
  error: { textAlign: 'center', maxWidth: 320 },
  action: { width: '100%', maxWidth: 320, marginTop: Spacing.four },
});
