import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/i18n';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();

  return (
    <Screen title={t('profile.title')} description={t('profile.body')}>
      <ThemedText type="smallBold">{t('profile.language')}</ThemedText>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {SUPPORTED_LANGUAGES.map((language) => {
          const isSelected = language === i18n.resolvedLanguage;
          return (
            <Pressable
              key={language}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => void i18n.changeLanguage(language)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView
                type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.option}>
                <ThemedText themeColor={isSelected ? 'text' : 'textSecondary'}>
                  {LANGUAGE_NAMES[language]}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
