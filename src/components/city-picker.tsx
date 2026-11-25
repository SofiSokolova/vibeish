import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { TextField } from '@/components/text-field';
import { CITIES, type CitySlug } from '@/constants/cities';
import { Spacing } from '@/constants/theme';

/** The choice for people whose city is not in the list yet. */
export const OTHER_CITY = 'other';

export type CityChoice = CitySlug | typeof OTHER_CITY;

/** Every supported city as a chip, plus "my city isn't listed". */
export function CityChips({
  label,
  city,
  onChange,
}: {
  /** Names the group for screen readers. */
  label: string;
  city: CityChoice | null;
  onChange: (city: CityChoice) => void;
}) {
  const { t } = useTranslation();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
      {CITIES.map((option) => (
        <Chip
          key={option.slug}
          label={t(`city.${option.slug}`)}
          selected={city === option.slug}
          onPress={() => onChange(option.slug)}
        />
      ))}
      <Chip
        label={t('onboarding.city.notListed')}
        selected={city === OTHER_CITY}
        onPress={() => onChange(OTHER_CITY)}
      />
    </View>
  );
}

type OtherCityFieldProps = {
  value: string;
  onChangeText: (name: string) => void;
  error?: string | null;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
};

/** The name of a city that is not in the list yet. */
export function OtherCityField({ value, onChangeText, error, onSubmitEditing, autoFocus }: OtherCityFieldProps) {
  const { t } = useTranslation();

  return (
    <TextField
      label={t('onboarding.city.otherCity')}
      hint={t('onboarding.city.otherCityHint')}
      error={error}
      value={value}
      onChangeText={onChangeText}
      maxLength={100}
      autoFocus={autoFocus}
      autoCapitalize="words"
      returnKeyType="done"
      onSubmitEditing={onSubmitEditing}
    />
  );
}

type CityPickerProps = {
  label: string;
  city: CityChoice | null;
  onChangeCity: (city: CityChoice) => void;
  otherCity: string;
  onChangeOtherCity: (name: string) => void;
  otherCityError?: string | null;
  onSubmitOtherCity?: () => void;
};

/** The cities and, once "not listed" is picked, the field for the city's name. Used by onboarding. */
export function CityPicker({
  label,
  city,
  onChangeCity,
  otherCity,
  onChangeOtherCity,
  otherCityError,
  onSubmitOtherCity,
}: CityPickerProps) {
  // The name field takes the focus right after someone picks "not listed".
  const [justPickedOther, setJustPickedOther] = useState(false);

  return (
    <>
      <CityChips
        label={label}
        city={city}
        onChange={(value) => {
          setJustPickedOther(value === OTHER_CITY);
          onChangeCity(value);
        }}
      />
      {city === OTHER_CITY ? (
        <OtherCityField
          value={otherCity}
          onChangeText={onChangeOtherCity}
          error={otherCityError}
          onSubmitEditing={onSubmitOtherCity}
          autoFocus={justPickedOther}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
