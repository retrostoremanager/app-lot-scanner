import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'small';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  fullWidth?: boolean;
}

// A real button primitive -- filled/outline/ghost/destructive -- to replace the bare
// Pressable + ThemedText "link" pattern that made every action in the app look like
// unstyled text rather than something tappable.
export function Button({
  label,
  variant = 'primary',
  size = 'default',
  icon,
  loading = false,
  fullWidth = false,
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; border?: string; text: string }> = {
    primary: { bg: theme.tint, text: theme.tintText },
    secondary: { bg: theme.backgroundSelected, border: theme.border, text: theme.tint },
    ghost: { bg: 'transparent', text: theme.textSecondary },
    destructive: { bg: theme.dangerSoft, text: theme.danger },
  };
  const colors = palette[variant];

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'small' ? styles.small : styles.default,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border ?? 'transparent',
          borderWidth: colors.border ? 1 : 0,
          opacity: isDisabled ? 0.5 : pressed ? 0.75 : 1,
        },
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === 'small' ? 15 : 18} color={colors.text} />}
          <ThemedText
            type={size === 'small' ? 'smallBold' : 'default'}
            style={[styles.label, { color: colors.text }]}
          >
            {label}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderRadius: Radius.md,
  },
  default: {
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
  },
  small: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  label: {
    fontWeight: '600',
  },
});
