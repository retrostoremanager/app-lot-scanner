/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#15181D',
    background: '#F7F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EAF1FF',
    textSecondary: '#5B616E',
    border: '#E2E5EA',
    tint: '#2F5FE0',
    tintText: '#FFFFFF',
    success: '#1E9E6B',
    successSoft: '#E3F6ED',
    danger: '#D9402A',
    dangerSoft: '#FCE8E5',
    warning: '#B6730A',
    warningSoft: '#FBF0DB',
  },
  dark: {
    text: '#F2F3F5',
    background: '#111317',
    backgroundElement: '#1B1E24',
    backgroundSelected: '#1E2A47',
    textSecondary: '#9499A3',
    border: '#2A2E36',
    tint: '#5B84EE',
    tintText: '#FFFFFF',
    success: '#3FC388',
    successSoft: '#163327',
    danger: '#E66B57',
    dangerSoft: '#3A1E1C',
    warning: '#E0A83F',
    warningSoft: '#352A14',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;
