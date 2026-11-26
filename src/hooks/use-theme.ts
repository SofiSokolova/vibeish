/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Effects } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';

  return Colors[theme];
}

/** The gradients and shadows of the current color scheme (see `Effects`). */
export function useEffects() {
  return useColorScheme() === 'dark' ? Effects.dark : Effects.light;
}
