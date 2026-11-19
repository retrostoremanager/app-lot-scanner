import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/Button';
import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/state/AuthContext';
import { AccountApiError } from '@/api/accountClient';
import { MYSTORE_WEB_URL } from '@/api/config';

// Sign-up (new company + Stripe subscription) belongs to RSM proper, not this app -- link
// out to web-mystore's real signup page rather than duplicating that flow here. returnTo
// only makes sense on web (there's no page to redirect back to on native); on return,
// VerifyEmailPage appends ?slug=<new slug> so login can prefill the Store ID field below.
function buildSignupHref(): Href & string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const returnTo = `${window.location.origin}/login`;
    return `${MYSTORE_WEB_URL}/signup?returnTo=${encodeURIComponent(returnTo)}` as Href & string;
  }
  return `${MYSTORE_WEB_URL}/signup` as Href & string;
}

// Login is slug-scoped on fn-mystore (not a global email/password lookup), so employees
// need their store's URL slug too -- there's no URL path here to read it from like the
// web app has.
export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { login } = useAuth();
  const { slug: slugParam } = useLocalSearchParams<{ slug?: string }>();

  const [slug, setSlug] = useState(slugParam ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = slug.trim().length > 0 && email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(slug.trim(), email.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof AccountApiError ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.content}>
        <View style={[styles.mark, { backgroundColor: theme.tint }]}>
          <Ionicons name="game-controller" size={36} color={theme.tintText} />
        </View>

        <ThemedText type="title" style={styles.title}>
          Sign in
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Use your RetroStoreManager employee login.
        </ThemedText>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={slug}
            onChangeText={setSlug}
            placeholder="Store ID"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!submitting}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={!submitting}
          />
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            editable={!submitting}
            onSubmitEditing={handleSubmit}
          />

          {error && (
            <ThemedText type="small" themeColor="danger" style={styles.error}>
              {error}
            </ThemedText>
          )}

          <Button label="Sign in" fullWidth loading={submitting} disabled={!canSubmit} onPress={handleSubmit} />

          <View style={styles.signupRow}>
            <ThemedText type="small" themeColor="textSecondary">
              Don&apos;t have an account?{' '}
            </ThemedText>
            <ExternalLink href={buildSignupHref()}>
              <ThemedText type="smallBold" themeColor="tint">
                Sign up
              </ThemedText>
            </ExternalLink>
          </View>
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
  mark: {
    width: 76,
    height: 76,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320, marginBottom: Spacing.three },
  form: { width: '100%', maxWidth: 320, gap: Spacing.two },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 16,
  },
  error: { textAlign: 'center' },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Spacing.two,
  },
});
