import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Dialog } from '@/components/dialog';
import { FieldError } from '@/components/form-controls';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { CITIES, type CitySlug } from '@/constants/cities';
import { ICONS } from '@/constants/icons';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ListingPlace } from '@/lib/listing-form';
import { MIN_QUERY_LENGTH, searchPlaces } from '@/lib/places';

/** The search waits for this pause in typing, so it is not asked about every letter. */
const SEARCH_DELAY = 350;

/** The answer to one search: for which city and text, and what it found. */
type SearchResult = { key: string; places: ListingPlace[]; failed: boolean };

type PlaceFieldProps = {
  value: ListingPlace | null;
  /** The city the search starts in when no place is picked yet. */
  defaultCity: CitySlug;
  onChange: (place: ListingPlace) => void;
  error?: string | null;
};

/**
 * Where the meetup is: the «location block» with the address on the left and a small map on
 * the right. The address is the button that opens the search; before a place is picked it
 * says «Choose» and the map shows a question mark.
 */
export function PlaceField({ value, defaultCity, onChange, error }: PlaceFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const cityName = value ? t(`city.${value.city}`) : '';

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{t('create.where')}</ThemedText>
      <View
        style={[
          styles.block,
          { borderColor: error ? theme.danger : `${theme.picked}55`, backgroundColor: theme.backgroundElement },
        ]}>
        <Pressable
          role="button"
          aria-label={value ? t('create.placeLabel', { place: `${value.name}, ${cityName}` }) : t('create.choosePlace')}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [styles.address, pressed && styles.pressed]}>
          {value ? (
            <>
              <View style={styles.nameRow}>
                <Icon name={ICONS.place} color={theme.picked} size={18} />
                <ThemedText numberOfLines={2} style={[styles.name, { color: theme.picked }]}>
                  {value.name}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                {[value.address, cityName].filter(Boolean).join(', ')}
              </ThemedText>
            </>
          ) : (
            <ThemedText style={[styles.name, { color: theme.picked }]}>{t('create.choosePlace')}</ThemedText>
          )}
        </Pressable>
        <MapSketch known={value !== null} />
      </View>
      <FieldError error={error} />
      {/* Mounted only while open, so the search starts afresh each time. */}
      {open ? (
        <PlaceDialog
          city={value?.city ?? defaultCity}
          onClose={(place) => {
            setOpen(false);
            if (place) onChange(place);
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * A drawing that stands in for the map until the app shows real maps: streets and a pin, or
 * a question mark while no place is picked.
 */
function MapSketch({ known }: { known: boolean }) {
  const theme = useTheme();
  return (
    <View aria-hidden style={[styles.map, { borderLeftColor: `${theme.picked}33`, backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.street, styles.streetAcross, { backgroundColor: theme.border }]} />
      <View style={[styles.street, styles.streetDown, { backgroundColor: theme.border }]} />
      <View style={[styles.pin, { borderColor: known ? theme.accent : theme.textSecondary, backgroundColor: theme.background }]}>
        {known ? null : <ThemedText style={[styles.question, { color: theme.textSecondary }]}>?</ThemedText>}
      </View>
    </View>
  );
}

function PlaceDialog({ city: startCity, onClose }: { city: CitySlug; onClose: (place: ListingPlace | null) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [city, setCity] = useState(startCity);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const typedEnough = query.trim().length >= MIN_QUERY_LENGTH;
  const key = `${city}|${query.trim()}`;

  useEffect(() => {
    if (!typedEnough) return;
    const request = new AbortController();
    const timer = setTimeout(() => {
      searchPlaces(city, query, request.signal)
        .then((places) => setResult({ key, places, failed: false }))
        .catch(() => {
          if (!request.signal.aborted) setResult({ key, places: [], failed: true });
        });
    }, SEARCH_DELAY);
    // A newer search replaces this one: the pending answer is dropped.
    return () => {
      clearTimeout(timer);
      request.abort();
    };
  }, [city, query, key, typedEnough]);

  // Only the answer for what is typed now counts; until it comes, the search is running.
  const current = typedEnough && result?.key === key ? result : null;
  const searching = typedEnough && current === null;
  const places = current?.places ?? [];

  return (
    <Dialog visible title={t('create.where')} closeLabel={t('common.cancel')} onClose={() => onClose(null)}>
      <View role="radiogroup" aria-label={t('create.city')} style={styles.cities}>
        {CITIES.map(({ slug }) => (
          <Chip key={slug} label={t(`city.${slug}`)} selected={city === slug} onPress={() => setCity(slug)} />
        ))}
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('create.searchPlace')}
        accessibilityLabel={t('create.searchPlace')}
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        style={[styles.search, { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }]}
      />
      {!typedEnough ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('create.searchHint')}
        </ThemedText>
      ) : searching ? (
        <ActivityIndicator color={theme.picked} style={styles.searching} />
      ) : current?.failed ? (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {t('create.searchFailed')}
        </ThemedText>
      ) : places.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" accessibilityLiveRegion="polite">
          {t('create.noPlaces')}
        </ThemedText>
      ) : (
        <>
          <View role="list" style={styles.places}>
            {places.map((place) => (
              <Pressable
                key={`${place.name}|${place.address}`}
                role="button"
                onPress={() => onClose(place)}
                style={({ pressed }) => [styles.place, { borderColor: theme.border }, pressed && styles.pressed]}>
                <Icon name={ICONS.place} color={theme.picked} size={20} />
                <View style={styles.placeText}>
                  <ThemedText style={styles.placeName}>{place.name}</ThemedText>
                  {place.address ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {place.address}
                    </ThemedText>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </View>
          {/* OpenStreetMap's data comes with this credit (ODbL). */}
          <ThemedText type="small" themeColor="textSecondary">
            {t('create.osmCredit')}
          </ThemedText>
        </>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  block: {
    flexDirection: 'row',
    minHeight: 112,
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
  },
  address: {
    flex: 55,
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    paddingHorizontal: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 800,
  },
  map: {
    flex: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  street: {
    position: 'absolute',
  },
  streetAcross: {
    left: 0,
    right: 0,
    top: '68%',
    height: 5,
    transform: [{ rotate: '-6deg' }],
  },
  streetDown: {
    top: 0,
    bottom: 0,
    left: '28%',
    width: 5,
  },
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 800,
  },
  cities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  search: {
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
  searching: {
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  places: {
    gap: Spacing.two,
  },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 56,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  placeText: {
    flex: 1,
  },
  placeName: {
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
