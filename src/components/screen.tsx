import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompactLayout } from '@/hooks/use-compact-layout';
import { useTheme } from '@/hooks/use-theme';

/** Room left for the web tab bar, which floats over the content (see app-tabs.web.tsx). */
const WEB_TOP_BAR_SPACE = 96;
const WEB_BOTTOM_BAR_SPACE = 80;

type ScreenProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

/** A scrollable tab screen: a title, an optional description, then the screen's content. */
export function Screen({ title, description, children }: ScreenProps) {
  const theme = useTheme();
  const compact = useCompactLayout();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  const platformPadding = Platform.select<ViewStyle>({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: compact
      ? { paddingTop: Spacing.four, paddingBottom: WEB_BOTTOM_BAR_SPACE + safeAreaInsets.bottom }
      : { paddingTop: WEB_TOP_BAR_SPACE, paddingBottom: Spacing.four },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, platformPadding]}>
      <ThemedView style={styles.container}>
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
