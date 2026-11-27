import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { FeedBackdrop } from '@/components/feed-backdrop';
import { FeedBottomBar } from '@/components/feed-bottom-bar';
import { FeedFilters } from '@/components/feed-filters';
import { Icon, type IconName } from '@/components/icon';
import { Logo } from '@/components/logo';
import { SentStatus, SwipeDeck } from '@/components/swipe-deck';
import { ThemedText } from '@/components/themed-text';
import { CITIES, type CitySlug } from '@/constants/cities';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useEffects, useTheme } from '@/hooks/use-theme';
import { matchesDate, sampleListings, type DateFilter, type FeedItem, type SwipeDirection } from '@/lib/feed';
import { useMyProfile } from '@/lib/my-profile';

type FeedView = 'feed' | 'map';

/** The main screen: listings near you, as cards to swipe or, later, on a map. */
export default function FeedScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useMyProfile();
  const [view, setView] = useState<FeedView>('feed');
  const [now] = useState(() => new Date());
  // Until the feed loads real listings, development builds show the ones from the design.
  const [items] = useState<FeedItem[]>(() => (__DEV__ ? sampleListings(now) : []));
  const [chosenCity, setChosenCity] = useState<CitySlug | null>(null);
  const [date, setDate] = useState<DateFilter | null>(null);
  const [swiped, setSwiped] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  // The person's own city; when theirs is not supported yet, the first in the list, where the app starts.
  const city = chosenCity ?? profile?.homeCity ?? CITIES[0].slug;
  const left = items.filter((item) => item.city === city && !swiped.includes(item.id));
  const shown = left.filter((item) => matchesDate(item.startsAt, date, now));

  function handleSwiped(item: FeedItem, direction: SwipeDirection) {
    setSwiped((ids) => [...ids, item.id]);
    setSent(direction === 'right');
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      <FeedBackdrop />
      <View style={styles.column}>
        <View style={styles.header}>
          <Logo />
          <View style={styles.headerActions}>
            <HeaderButton icon={ICONS.search} label={t('feed.search')} />
            <HeaderButton icon={ICONS.notifications} label={t('feed.notifications')} />
          </View>
        </View>

        <View role="tablist" style={styles.tabs}>
          <ViewTab label={t('tabs.feed')} selected={view === 'feed'} onPress={() => setView('feed')} />
          <ViewTab label={t('tabs.map')} selected={view === 'map'} onPress={() => setView('map')} />
        </View>

        <FeedFilters
          city={city}
          onCityChange={(slug) => {
            setChosenCity(slug);
            setSent(false);
          }}
          date={date}
          onDateChange={(value) => {
            setDate(value);
            setSent(false);
          }}
        />

        {view === 'map' ? (
          <View style={styles.message}>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              {t('feed.mapSoon')}
            </ThemedText>
          </View>
        ) : shown.length > 0 ? (
          <View style={styles.deck}>
            <SwipeDeck items={shown} now={now} sent={sent} onSwiped={handleSwiped} />
          </View>
        ) : (
          <View style={styles.message}>
            <SentStatus visible={sent} />
            <ThemedText themeColor="textSecondary" style={styles.center}>
              {left.length > 0 ? t('feed.emptyFiltered') : t('feed.empty')}
            </ThemedText>
            <Button title={t('feed.createOwn')} onPress={() => router.push('/create')} />
          </View>
        )}

        <FeedBottomBar />
      </View>
    </View>
  );
}

/** Search and notifications get their screens in later stages. */
function HeaderButton({ icon, label }: { icon: IconName; label: string }) {
  const theme = useTheme();
  const fx = useEffects();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.headerButton,
        { backgroundColor: fx.glass, borderColor: fx.glassBorder, boxShadow: fx.glassShadow },
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
      style={[styles.tab, { borderBottomColor: selected ? theme.brandPink : 'transparent' }]}>
      <ThemedText
        themeColor={selected ? 'text' : 'textSecondary'}
        style={[styles.tabLabel, selected && styles.tabSelected]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
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
    paddingHorizontal: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  tab: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontWeight: 700,
  },
  tabSelected: {
    fontWeight: 800,
  },
  deck: {
    flex: 1,
    paddingTop: 14,
    paddingHorizontal: 22,
  },
  message: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  center: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
