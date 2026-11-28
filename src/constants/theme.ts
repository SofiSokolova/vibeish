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
    /** What is picked in a form, such as languages or the date, shown as chips or text. */
    picked: '#00788A',
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
    picked: '#22F3FF',
    brandPink: '#FF2BD6',
    brandCyan: '#22F3FF',
    levelBeginner: '#3DFF9A',
    levelExperienced: '#FFC83D',
    levelPro: '#C77DFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/**
 * The neon look of the feed: gradients and shadows written as CSS, which React Native reads in
 * `backgroundImage` and `boxShadow` just like the web does. A gradient that stands in for a
 * border goes on an outer view, with the content on an opaque inner one.
 */
export const Effects = {
  light: {
    /** Behind the whole screen; the day design has a plain background and the orb instead. */
    screenGlow: null,
    /**
     * The soft colour cloud at the top left: four colours that fade into each other, each
     * gone well inside its square so that no edge shows.
     */
    orb: [
      'radial-gradient(circle 200px at 59% 34%, #B6FFD9 0%, #B6FFD900 100%)',
      'radial-gradient(circle 200px at 66% 59%, #C9B6FF 0%, #C9B6FF00 100%)',
      'radial-gradient(circle 200px at 34% 41%, #9AD7FF 0%, #9AD7FF00 100%)',
      'radial-gradient(circle 200px at 41% 66%, #FFB3F0 0%, #FFB3F000 100%)',
    ].join(', '),
    gridLine: '#6A2CFF22',
    /** Round buttons and chips that let the background show through. */
    glass: '#FFFFFFB3',
    glassBorder: '#FFFFFF',
    glassShadow: '0 6px 16px #14102B14',
    filterButton: { background: '#14102B', icon: '#FFFFFF' },
    /** A gradient border around an opaque chip. */
    cityChip: {
      gradientBorder: 'linear-gradient(135deg, #FF2BD6, #00B8D4)',
      border: '#00000000',
      background: '#FFFFFF',
      text: '#14102B',
    },
    card: {
      background: '#FFFFFF',
      border: 'linear-gradient(135deg, #FF2BD6, #00B8D4)',
      borderWidth: 1.5,
      shadow: '0 0 34px #FF2BD640, 0 26px 56px #14102B24',
      header: 'linear-gradient(135deg, #F1E6FF, #FFE4F2)',
      /** The icons of the time, place, people and price lines, and their text. */
      icon: '#6A2CFF',
      meta: '#4A4466',
      iconShadow: 'drop-shadow(0 8px 14px #6A2CFF40)',
      /** The card waiting underneath. */
      next: { background: '#FFFFFF80', border: '#FFFFFF', opacity: 1 },
    },
    author: { background: 'linear-gradient(135deg, #C8148F, #6A2CFF)', text: '#FFFFFF', shadow: undefined },
    /** Filled skill level dots glow at night. */
    dotGlow: false,
    nah: { background: '#FFFFFFCC', border: '#FFFFFF', shadow: '0 10px 24px #14102B1F', icon: '#14102B', label: '#14102B' },
    vibe: {
      background: 'linear-gradient(135deg, #C8148F, #6A2CFF)',
      border: '#00000000',
      shadow: '0 0 22px #FF2BD640, 0 12px 26px #6A2CFF40',
      icon: '#FFFFFF',
      label: '#6A2CFF',
    },
    sent: { text: '#16753F', background: '#FFFFFFCC', glow: undefined },
    /** The «+» in the feed's bottom bar. */
    create: { background: 'linear-gradient(135deg, #C8148F, #6A2CFF)', icon: '#FFFFFF' },
    bar: { background: '#FFFFFFCC', border: '#14102B14' },
  },
  dark: {
    screenGlow: 'radial-gradient(ellipse 90% 50% at 50% 0%, #2A0B4A 0%, #07060F 70%)',
    orb: null,
    gridLine: '#22F3FF40',
    glass: '#FFFFFF0D',
    glassBorder: '#EFEAFF40',
    glassShadow: undefined,
    filterButton: { background: '#FF2BD6', icon: '#07060F' },
    /** No gradient at night: a plain border around a see-through chip. */
    cityChip: { gradientBorder: null, border: '#22F3FF88', background: '#22F3FF14', text: '#22F3FF' },
    card: {
      background: '#0D0B1D',
      border: 'linear-gradient(#FF2BD6, #FF2BD6)',
      borderWidth: 1,
      shadow: '0 0 40px #FF2BD688, 0 30px 60px #000000CC',
      header: 'radial-gradient(circle at 16% 50%, #FF7AA233 0%, #FF7AA200 55%), linear-gradient(160deg, #2A0B4A, #120F2A)',
      icon: '#22F3FF',
      meta: '#CFC6EF',
      iconShadow: 'drop-shadow(0 8px 14px #00000099)',
      next: { background: '#0D0B1D', border: '#22F3FF44', opacity: 0.6 },
    },
    author: { background: 'linear-gradient(#22F3FF, #22F3FF)', text: '#07060F', shadow: '0 0 14px #22F3FF88' },
    dotGlow: true,
    nah: { background: '#FFFFFF0D', border: '#EFEAFF66', shadow: undefined, icon: '#EFEAFF', label: '#EFEAFF' },
    vibe: {
      background: 'linear-gradient(#3DFF9A1F, #3DFF9A1F)',
      border: '#3DFF9A',
      shadow: '0 0 24px #3DFF9A88',
      icon: '#3DFF9A',
      label: '#3DFF9A',
    },
    sent: { text: '#3DFF9A', background: '#00000000', glow: '#3DFF9A88' },
    create: { background: 'linear-gradient(135deg, #FF2BD6, #6A2CFF)', icon: '#FFFFFF' },
    bar: { background: '#07060FCC', border: '#22F3FF22' },
  },
} as const;

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
