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
  /** `tab` leaves room for the tab bar; `standalone` is for screens without one, like sign-in. */
  variant?: 'tab' | 'standalone';
};

/** A scrollable screen: a title, an optional description, then the screen's content. */
export function Screen({ title, description, children, variant = 'tab' }: ScreenProps) {
  const theme = useTheme();
  const compact = useCompactLayout();
  const safeAreaInsets = useSafeAreaInsets();
  const hasTabBar = variant === 'tab';
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + (hasTabBar ? BottomTabInset : 0) + Spacing.three,
  };

  const webPadding: ViewStyle = !hasTabBar
    ? { paddingTop: compact ? Spacing.four : Spacing.six, paddingBottom: Spacing.four + safeAreaInsets.bottom }
    : compact
      ? { paddingTop: Spacing.four, paddingBottom: WEB_BOTTOM_BAR_SPACE + safeAreaInsets.bottom }
      : { paddingTop: WEB_TOP_BAR_SPACE, paddingBottom: Spacing.four };

  const platformPadding = Platform.select<ViewStyle>({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: webPadding,
  });

  return (
    <ScrollView
      // Lets a tap on a button go through while the keyboard is open.
      keyboardShouldPersistTaps="handled"
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
