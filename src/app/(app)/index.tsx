import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeedBottomBar } from '@/components/feed-bottom-bar';
import { Icon, type IconName } from '@/components/icon';
import { Logo } from '@/components/logo';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FeedView = 'feed' | 'map';

/** The main screen: listings near you, as a feed or, later, on a map. */
export default function FeedScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<FeedView>('feed');

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <View style={styles.column}>
        <View style={styles.header}>
          <Logo />
          <View style={styles.actions}>
            <HeaderButton icon={ICONS.search} label={t('feed.search')} />
            <HeaderButton icon={ICONS.notifications} label={t('feed.notifications')} />
          </View>
        </View>

        <View role="tablist" style={styles.tabs}>
          <ViewTab label={t('tabs.feed')} selected={view === 'feed'} onPress={() => setView('feed')} />
          <ViewTab label={t('tabs.map')} selected={view === 'map'} onPress={() => setView('map')} />
        </View>

        <View style={styles.content}>
          <ThemedText themeColor="textSecondary" style={styles.note}>
            {view === 'feed' ? t('feed.body') : t('feed.mapSoon')}
          </ThemedText>
        </View>

        <FeedBottomBar />
      </View>
    </View>
  );
}

/** Search and notifications get their screens in later stages. */
function HeaderButton({ icon, label }: { icon: IconName; label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.headerButton,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} color={theme.text} size={22} />
    </Pressable>
  );
}

function ViewTab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      role="tab"
      aria-selected={selected}
      onPress={onPress}
      style={[styles.tab, { borderBottomColor: selected ? theme.accent : 'transparent' }]}>
      <ThemedText themeColor={selected ? 'text' : 'textSecondary'} style={selected && styles.tabSelected}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingTop: Spacing.three,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    borderBottomWidth: 2,
  },
  tabSelected: {
    fontWeight: 700,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
  },
  note: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
