import Constants from 'expo-constants';
import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TABS, type AppTab } from '@/constants/tabs';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useCompactLayout } from '@/hooks/use-compact-layout';
import { useTheme } from '@/hooks/use-theme';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

/** Web tabs: a floating bar on top for wide screens, an app-like bar at the bottom on phones. */
export default function AppTabs() {
  const { t } = useTranslation();
  const compact = useCompactLayout();

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList compact={compact}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton tab={tab} compact={compact}>
                {t(tab.label)}
              </TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// `ref` is left out of the type only: expo-router types it as a ref to the View component
// rather than to an element, which Pressable rejects. At runtime it still reaches Pressable via ...props.
type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & { tab: AppTab; compact: boolean };

export function TabButton({ children, isFocused, tab, compact, ...props }: TabButtonProps) {
  const theme = useTheme();

  if (compact) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [styles.compactButton, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: tab.sf.default, android: tab.md, web: tab.md }}
          size={24}
          tintColor={isFocused ? theme.text : theme.textSecondary}
        />
        <ThemedText
          numberOfLines={1}
          style={styles.compactLabel}
          themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </Pressable>
    );
  }

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

type CustomTabListProps = TabListProps & { compact: boolean };

export function CustomTabList({ compact, children, ...props }: CustomTabListProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  if (compact) {
    return (
      <ThemedView
        {...props}
        style={[
          styles.bottomBar,
          { borderTopColor: theme.backgroundSelected, paddingBottom: Spacing.two + insets.bottom },
        ]}>
        {children}
      </ThemedView>
    );
  }

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          {Constants.expoConfig?.name}
        </ThemedText>
        {children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  compactButton: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: Spacing.half,
  },
  compactLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
});
