import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, setAppLanguage } from '@/i18n';

/** Interface language choice. The names are never translated, so everyone finds their own. */
export function LanguagePicker({ label }: { label: string }) {
  const { i18n } = useTranslation();

  return (
    <View style={styles.group}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.options}>
        {SUPPORTED_LANGUAGES.map((language) => (
          <Chip
            key={language}
            label={LANGUAGE_NAMES[language]}
            selected={language === i18n.resolvedLanguage}
            onPress={() => setAppLanguage(language)}
          />
        ))}
      </View>
    </View>
  );
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
});
