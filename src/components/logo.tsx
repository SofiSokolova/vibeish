import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const NAME = Constants.expoConfig?.name ?? '';

/** The wordmark: the app's name over a pink and a cyan copy, shifted apart like a neon sign. */
export function Logo() {
  const theme = useTheme();
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={NAME}>
      <ThemedText aria-hidden style={[styles.word, styles.copy, styles.left, { color: theme.brandPink }]}>
        {NAME}
      </ThemedText>
      <ThemedText aria-hidden style={[styles.word, styles.copy, styles.right, { color: theme.brandCyan }]}>
        {NAME}
      </ThemedText>
      <ThemedText aria-hidden style={styles.word}>
        {NAME}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  word: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: 800,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  copy: {
    position: 'absolute',
    top: 0,
  },
  left: {
    left: -2,
  },
  right: {
    left: 2,
  },
});
