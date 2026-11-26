/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Light is the «day» design and dark the «neon city» night design from the design canvas.
export const Colors = {
  light: {
    text: '#14102B',
    background: '#F6F3FF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E9E2FF',
    textSecondary: '#4A4466',
    /** Hairlines between areas, like above the feed's bottom bar. */
    border: '#14102B1F',
    /** The main action on a screen, with `onAccent` for its label. */
    accent: '#6A2CFF',
    onAccent: '#FFFFFF',
    danger: '#C4320A',
    /** Cards that float over the screen, like the level choice. */
    popover: '#FFFFFF',
    // The two coloured copies behind the logo.
    brandPink: '#C8148F',
    brandCyan: '#00B8D4',
    // Skill levels (see src/constants/skill-levels.ts). Dark enough to read on white and on
    // the background; red is left out because it already means an error.
    levelBeginner: '#16753F',
    levelExperienced: '#8F5B00',
    levelPro: '#6E45CC',
  },
  dark: {
    text: '#EFEAFF',
    background: '#07060F',
    backgroundElement: '#15122B',
    backgroundSelected: '#241F45',
    textSecondary: '#A99FD6',
    border: '#EFEAFF26',
    accent: '#FF2BD6',
    onAccent: '#07060F',
    danger: '#FF7A5C',
    popover: '#15122B',
    brandPink: '#FF2BD6',
    brandCyan: '#22F3FF',
    levelBeginner: '#3DFF9A',
    levelExperienced: '#FFC83D',
    levelPro: '#C77DFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * The app's typeface. The root layout loads its weights 400–800 from @expo-google-fonts/geologica
 * under this one name, so text picks a weight with `fontWeight`.
 */
export const AppFont = 'Geologica';

export const Fonts = Platform.select({
  ios: {
    sans: AppFont,
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: AppFont,
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: AppFont,
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

export const MaxContentWidth = 800;
