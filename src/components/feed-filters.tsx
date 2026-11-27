import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Dialog } from '@/components/dialog';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { CITIES, type CitySlug } from '@/constants/cities';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useEffects } from '@/hooks/use-theme';
import type { DateFilter } from '@/lib/feed';

/** Makes the 36-point chips easier to hit. */
const HIT_SLOP = 4;

type FeedFiltersProps = {
  city: CitySlug;
  onCityChange: (city: CitySlug) => void;
  date: DateFilter | null;
  onDateChange: (date: DateFilter | null) => void;
};

/** The row under the feed's tabs: all filters, the city, and two quick date choices. */
export function FeedFilters({ city, onCityChange, date, onDateChange }: FeedFiltersProps) {
  const { t } = useTranslation();
  const fx = useEffects();
  const [choosingCity, setChoosingCity] = useState(false);
  const cityName = t(`city.${city}`);
  const gradient = fx.cityChip.gradientBorder;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.row}>
        {/* The full list of filters comes in a later stage. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.filters')}
          hitSlop={HIT_SLOP}
          style={({ pressed }) => [
            styles.filters,
            { backgroundColor: fx.filterButton.background },
            pressed && styles.pressed,
          ]}>
          <Icon name={ICONS.filters} color={fx.filterButton.icon} size={18} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('feed.city', { city: cityName })}
          hitSlop={HIT_SLOP}
          onPress={() => setChoosingCity(true)}
          style={({ pressed }) => [
            styles.cityFrame,
            gradient ? { backgroundImage: gradient, padding: 1.5 } : null,
            pressed && styles.pressed,
          ]}>
          <View
            style={[
              styles.city,
              { minHeight: gradient ? 33 : 36, backgroundColor: fx.cityChip.background, borderColor: fx.cityChip.border },
            ]}>
            <Icon name={ICONS.place} color={fx.cityChip.text} size={14} />
            <ThemedText style={[styles.chipLabel, { color: fx.cityChip.text }]}>{cityName}</ThemedText>
            <Icon name={ICONS.chooseMore} color={fx.cityChip.text} size={16} />
          </View>
        </Pressable>

        <DateChip
          label={t('feed.today')}
          checked={date === 'today'}
          onPress={() => onDateChange(date === 'today' ? null : 'today')}
        />
        <DateChip
          label={t('feed.weekend')}
          checked={date === 'weekend'}
          onPress={() => onDateChange(date === 'weekend' ? null : 'weekend')}
        />
      </ScrollView>

      <Dialog
        visible={choosingCity}
        title={t('feed.cityTitle')}
        closeLabel={t('common.done')}
        onClose={() => setChoosingCity(false)}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('feed.cityHint')}
        </ThemedText>
        <View accessibilityRole="radiogroup" accessibilityLabel={t('feed.cityTitle')} style={styles.cities}>
          {CITIES.map((option) => (
            <Chip
              key={option.slug}
              label={t(`city.${option.slug}`)}
              selected={city === option.slug}
              onPress={() => {
                onCityChange(option.slug);
                setChoosingCity(false);
              }}
            />
          ))}
        </View>
      </Dialog>
    </>
  );
}

/** A date choice that turns on with a press and off with the next one. */
function DateChip({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  const fx = useEffects();
  return (
    <Pressable
      role="checkbox"
      aria-checked={checked}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        checked
          ? { backgroundColor: fx.filterButton.background, borderColor: fx.filterButton.background }
          : { backgroundColor: fx.glass, borderColor: fx.glassBorder },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={[styles.chipLabel, checked && { color: fx.filterButton.icon }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: Spacing.one,
  },
  filters: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityFrame: {
    borderRadius: 999,
  },
  city: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 700,
  },
  cities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
});
