import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Typed by hand: on Windows, Expo Router's typed routes list (app)/index as `/index` instead of `/`.
const FEED = '/' as Href;

/** Goes back to the previous screen, or to the feed when the screen was opened by its address. */
export function BackButton() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('nav.back')}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(FEED))}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Icon name={ICONS.back} color={theme.text} size={22} />
      <ThemedText type="smallBold">{t('nav.back')}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingRight: Spacing.two,
  },
  pressed: {
    opacity: 0.6,
  },
});
