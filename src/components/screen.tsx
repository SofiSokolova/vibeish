import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompactLayout } from '@/hooks/use-compact-layout';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  /** Shows a back button above the title, for screens that open over the feed. */
  back?: boolean;
};

/** A scrollable screen: an optional back button, a title, an optional description, then the content. */
export function Screen({ title, description, children, back = false }: ScreenProps) {
  const theme = useTheme();
  const compact = useCompactLayout();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = { ...safeAreaInsets, bottom: safeAreaInsets.bottom + Spacing.three };

  const platformPadding = Platform.select<ViewStyle>({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: compact ? Spacing.four : Spacing.six,
      paddingBottom: Spacing.four + safeAreaInsets.bottom,
    },
  });

  return (
    <ScrollView
      // Lets a tap on a button go through while the keyboard is open.
      keyboardShouldPersistTaps="handled"
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, platformPadding]}>
      <ThemedView style={styles.container}>
        {back ? <BackButton /> : null}
        <ThemedText type="subtitle">{title}</ThemedText>
        {description ? <ThemedText themeColor="textSecondary">{description}</ThemedText> : null}
        {children}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    // Full width on phones, capped and centred on wide screens. Without an explicit width,
    // wrapping rows (like the hobby chips) stretch the column past the edge of a phone screen.
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
});
