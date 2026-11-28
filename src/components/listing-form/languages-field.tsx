import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Dialog } from '@/components/dialog';
import { CheckRow, FieldError, PickedValues } from '@/components/form-controls';
import { ThemedText } from '@/components/themed-text';
import { MAX_SPOKEN_LANGUAGES, SPOKEN_LANGUAGES, spokenLanguageNames } from '@/constants/languages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LanguagesFieldProps = {
  value: string[];
  /** The languages from the person's profile, which the list shows first. */
  own: readonly string[];
  /** Whether the languages are remembered for the next meetups. */
  remembered: boolean;
  onChange: (value: string[], remember: boolean) => void;
  error?: string | null;
};

/**
 * The meetup's languages as chips with a pencil. The list opens in a dialog: the person's own
 * languages first, then the rest in the app's usual order.
 */
export function LanguagesField({ value, own, remembered, onChange, error }: LanguagesFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(value);
  const [remember, setRemember] = useState(remembered);
  const ownLanguages = SPOKEN_LANGUAGES.filter((language) => own.includes(language.code));
  const otherLanguages = SPOKEN_LANGUAGES.filter((language) => !own.includes(language.code));

  function openList() {
    setPicked(value);
    setRemember(remembered);
    setOpen(true);
  }

  function toggle(code: string) {
    setPicked((current) =>
      current.includes(code)
        ? current.filter((language) => language !== code)
        : current.length < MAX_SPOKEN_LANGUAGES
          ? [...current, code]
          : current
    );
  }

  function closeList() {
    setOpen(false);
    // Kept in the list's order, whatever order they were tapped in.
    onChange(
      SPOKEN_LANGUAGES.map((language) => language.code).filter((code) => picked.includes(code)),
      remember
    );
  }

  const chips = (languages: readonly (typeof SPOKEN_LANGUAGES)[number][]) => (
    <View style={styles.options}>
      {languages.map((language) => (
        <Chip
          key={language.code}
          role="checkbox"
          label={language.name}
          selected={picked.includes(language.code)}
          onPress={() => toggle(language.code)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{t('create.languages')}</ThemedText>
      <PickedValues
        labels={spokenLanguageNames(value)}
        editLabel={t('create.changeLanguages')}
        chooseLabel={t('create.chooseLanguages')}
        onEdit={openList}
      />
      <FieldError error={error} />

      <Dialog visible={open} title={t('create.languages')} closeLabel={t('common.done')} onClose={closeList}>
        {ownLanguages.length > 0 ? (
          <>
            {chips(ownLanguages)}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </>
        ) : null}
        {chips(otherLanguages)}
        <CheckRow label={t('create.remember')} checked={remember} onChange={setRemember} />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
