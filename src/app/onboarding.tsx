import { useEffect, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BackHandler,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { CITIES, type CitySlug } from '@/constants/cities';
import { MAX_SPOKEN_LANGUAGES, SPOKEN_LANGUAGES } from '@/constants/languages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentLanguage } from '@/i18n';
import { useAuth } from '@/lib/auth';
import { isNetworkFailure } from '@/lib/auth-errors';
import { supabase } from '@/lib/supabase';

const STEPS = ['about', 'profile', 'city'] as const;
type Step = (typeof STEPS)[number];

const RULES = ['respect', 'friendship', 'safety', 'ai', 'report'] as const;

/** The choice for people whose city is not in the list yet. */
const OTHER_CITY = 'other';

const ADULT_AGE = 18;
const MAX_AGE = 120;

type ErrorKey =
  | 'onboarding.about.errors.invalidDate'
  | 'onboarding.about.errors.underage'
  | 'onboarding.profile.errors.name'
  | 'onboarding.profile.errors.languages'
  | 'onboarding.city.errors.city'
  | 'onboarding.city.errors.otherCity'
  | 'common.errors.network'
  | 'common.errors.generic';

/**
 * Three steps after the first sign-in: date of birth and the rules, name and languages,
 * then the city. The profile is created only at the end, by complete_onboarding().
 */
export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { markProfileComplete, signOut } = useAuth();

  const [step, setStep] = useState<Step>('about');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [languages, setLanguages] = useState<string[]>(() => [currentLanguage()]);
  const [city, setCity] = useState<CitySlug | typeof OTHER_CITY | null>(null);
  const [otherCity, setOtherCity] = useState('');
  const [error, setError] = useState<ErrorKey | null>(null);
  const [saving, setSaving] = useState(false);

  const stepNumber = STEPS.indexOf(step) + 1;

  // The Android back button goes to the previous step instead of leaving the app.
  useEffect(() => {
    if (step === 'about') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(STEPS[STEPS.indexOf(step) - 1]);
      setError(null);
      return true;
    });
    return () => subscription.remove();
  }, [step]);

  function goBack() {
    setStep(STEPS[stepNumber - 2]);
    setError(null);
  }

  function continueFromAbout() {
    const date = toIsoDate(day, month, year);
    const age = date ? ageOn(date, new Date()) : null;
    if (date === null || age === null || age > MAX_AGE) {
      setError('onboarding.about.errors.invalidDate');
      return;
    }
    if (age < ADULT_AGE) {
      setError('onboarding.about.errors.underage');
      return;
    }
    setBirthDate(date);
    setError(null);
    setStep('profile');
  }

  function continueFromProfile() {
    if (!name.trim()) {
      setError('onboarding.profile.errors.name');
      return;
    }
    if (languages.length === 0) {
      setError('onboarding.profile.errors.languages');
      return;
    }
    setError(null);
    setStep('city');
  }

  async function finish() {
    const typedCity = otherCity.trim();
    if (city === null) {
      setError('onboarding.city.errors.city');
      return;
    }
    if (city === OTHER_CITY && !typedCity) {
      setError('onboarding.city.errors.otherCity');
      return;
    }
    if (birthDate === null) {
      setStep('about');
      return;
    }

    setSaving(true);
    setError(null);
    const { error: saveError } = await supabase.rpc('complete_onboarding', {
      p_display_name: name.trim(),
      p_birth_date: birthDate,
      p_languages: languages,
      p_home_city: city === OTHER_CITY ? undefined : city,
      p_ui_language: currentLanguage(),
      p_requested_city: city === OTHER_CITY ? typedCity : undefined,
    });

    // 23505: the profile already exists, so onboarding was finished before (say, on another device).
    if (!saveError || saveError.code === '23505') {
      markProfileComplete();
      return;
    }
    setSaving(false);
    if (saveError.message.includes('must_be_adult')) {
      setError('onboarding.about.errors.underage');
    } else {
      setError(isNetworkFailure(saveError) ? 'common.errors.network' : 'common.errors.generic');
    }
  }

  function toggleLanguage(code: string) {
    setError(null);
    setLanguages((chosen) =>
      chosen.includes(code)
        ? chosen.filter((language) => language !== code)
        : chosen.length < MAX_SPOKEN_LANGUAGES
          ? [...chosen, code]
          : chosen
    );
  }

  const errorText = error ? t(error) : null;
  const nameError = error === 'onboarding.profile.errors.name' ? errorText : null;
  const otherCityError = error === 'onboarding.city.errors.otherCity' ? errorText : null;
  // Errors that belong to no single field are shown above the main button.
  const formError = nameError || otherCityError ? null : errorText;

  return (
    // A new key per step starts each step scrolled to the top.
    <Screen
      key={step}
      variant="standalone"
      title={t(`onboarding.${step}.title`)}
      description={t('onboarding.progress', { step: stepNumber, total: STEPS.length })}>
      {step === 'about' ? (
        <>
          <View style={styles.group}>
            <ThemedText type="smallBold">{t('onboarding.about.birthDate')}</ThemedText>
            <BirthDateFields
              day={day}
              month={month}
              year={year}
              onChange={(part, value) => {
                setError(null);
                if (part === 'day') setDay(value);
                else if (part === 'month') setMonth(value);
                else setYear(value);
              }}
              onSubmit={continueFromAbout}
            />
            <ThemedText type="small" themeColor="textSecondary">
              {t('onboarding.about.birthDateHint')}
            </ThemedText>
          </View>

          <View style={styles.group}>
            <ThemedText type="smallBold">{t('onboarding.about.rulesTitle')}</ThemedText>
            {RULES.map((rule) => (
              <View key={rule} style={styles.rule}>
                <ThemedText themeColor="textSecondary">•</ThemedText>
                <ThemedText style={styles.ruleText}>{t(`onboarding.about.rules.${rule}`)}</ThemedText>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {step === 'profile' ? (
        <>
          <TextField
            label={t('onboarding.profile.name')}
            hint={t('onboarding.profile.nameHint')}
            error={nameError}
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            maxLength={50}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
          />
          <View style={styles.group}>
            <ThemedText type="smallBold">{t('onboarding.profile.languages')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('onboarding.profile.languagesHint')}
            </ThemedText>
            <View style={styles.options}>
              {SPOKEN_LANGUAGES.map((language) => (
                <Chip
                  key={language.code}
                  role="checkbox"
                  label={language.name}
                  selected={languages.includes(language.code)}
                  onPress={() => toggleLanguage(language.code)}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      {step === 'city' ? (
        <>
          <ThemedText themeColor="textSecondary">{t('onboarding.city.body')}</ThemedText>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('onboarding.city.title')} style={styles.options}>
            {CITIES.map((option) => (
              <Chip
                key={option.slug}
                label={t(`city.${option.slug}`)}
                selected={city === option.slug}
                onPress={() => {
                  setCity(option.slug);
                  setError(null);
                }}
              />
            ))}
            <Chip
              label={t('onboarding.city.notListed')}
              selected={city === OTHER_CITY}
              onPress={() => {
                setCity(OTHER_CITY);
                setError(null);
              }}
            />
          </View>
          {city === OTHER_CITY ? (
            <TextField
              label={t('onboarding.city.otherCity')}
              hint={t('onboarding.city.otherCityHint')}
              error={otherCityError}
              value={otherCity}
              onChangeText={(value) => {
                setOtherCity(value);
                setError(null);
              }}
              maxLength={100}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => void finish()}
            />
          ) : null}
        </>
      ) : null}

      <View style={styles.actions}>
        {formError ? (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {formError}
          </ThemedText>
        ) : null}
        {step === 'about' ? (
          <Button title={t('onboarding.about.accept')} onPress={continueFromAbout} />
        ) : step === 'profile' ? (
          <Button title={t('common.continue')} onPress={continueFromProfile} />
        ) : (
          <Button title={t('onboarding.city.finish')} loading={saving} onPress={() => void finish()} />
        )}
        <View>
          {step !== 'about' ? (
            <Button variant="link" title={t('common.back')} disabled={saving} onPress={goBack} />
          ) : null}
          <Button variant="link" title={t('onboarding.signOut')} disabled={saving} onPress={() => void signOut()} />
        </View>
      </View>
    </Screen>
  );
}

type DatePart = 'day' | 'month' | 'year';

/** Day, month and year as three number fields, which work the same on phones and on the web. */
function BirthDateFields({
  day,
  month,
  year,
  onChange,
  onSubmit,
}: {
  day: string;
  month: string;
  year: string;
  onChange: (part: DatePart, value: string) => void;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();
  const monthRef = useRef<TextInputInstance>(null);
  const yearRef = useRef<TextInputInstance>(null);

  return (
    <View style={styles.dateRow}>
      <NumberBox
        value={day}
        placeholder={t('onboarding.about.day')}
        maxLength={2}
        style={styles.shortBox}
        onChangeText={(value) => {
          onChange('day', value);
          if (value.length === 2) monthRef.current?.focus();
        }}
        returnKeyType="next"
        onSubmitEditing={() => monthRef.current?.focus()}
      />
      <NumberBox
        ref={monthRef}
        value={month}
        placeholder={t('onboarding.about.month')}
        maxLength={2}
        style={styles.shortBox}
        onChangeText={(value) => {
          onChange('month', value);
          if (value.length === 2) yearRef.current?.focus();
        }}
        returnKeyType="next"
        onSubmitEditing={() => yearRef.current?.focus()}
      />
      <NumberBox
        ref={yearRef}
        value={year}
        placeholder={t('onboarding.about.year')}
        maxLength={4}
        style={styles.longBox}
        onChangeText={(value) => onChange('year', value)}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

/** A digits-only input, labelled by its placeholder for screen readers. */
function NumberBox({
  onChangeText,
  placeholder,
  style,
  ...props
}: TextInputProps & { ref?: Ref<TextInputInstance>; onChangeText: (value: string) => void }) {
  const theme = useTheme();

  return (
    <TextInput
      accessibilityLabel={placeholder}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      inputMode="numeric"
      keyboardType="number-pad"
      onChangeText={(value) => onChangeText(value.replace(/\D/g, ''))}
      style={[styles.box, { color: theme.text, backgroundColor: theme.backgroundElement }, style]}
      {...props}
    />
  );
}

/** The date as YYYY-MM-DD when day, month and year make a real calendar date, otherwise null. */
function toIsoDate(day: string, month: string, year: string): string | null {
  if (!day || !month || year.length !== 4) return null;
  const [d, m, y] = [Number(day), Number(month), Number(year)];
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return date.toISOString().slice(0, 10);
}

/** Full years from a YYYY-MM-DD birth date to `today`. */
function ageOn(birthDate: string, today: Date): number {
  const [y, m, d] = birthDate.split('-').map(Number);
  const month = today.getMonth() + 1;
  const hadBirthday = month > m || (month === m && today.getDate() >= d);
  return today.getFullYear() - y - (hadBirthday ? 0 : 1);
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  rule: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  ruleText: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  box: {
    minHeight: 48,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    fontSize: 16,
    textAlign: 'center',
  },
  shortBox: {
    width: 88,
  },
  longBox: {
    width: 112,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
