import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CATEGORIES, type Category, type CategorySlug } from '@/constants/categories';
import { Spacing } from '@/constants/theme';

export default function CreateScreen() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<CategorySlug | null>(null);

  const groupLabel = ({ min, max }: Category['group']) =>
    min === max ? t('create.groupExact', { size: min }) : t('create.groupRange', { min, max });

  return (
    <Screen title={t('create.title')} description={t('create.body')}>
      <ThemedText type="smallBold">{t('create.chooseHobby')}</ThemedText>
      <View accessibilityRole="radiogroup" style={styles.grid}>
        {CATEGORIES.map((category) => {
          const isSelected = category.slug === selected;
          return (
            <Pressable
              key={category.slug}
              role="radio"
              aria-checked={isSelected}
              onPress={() => setSelected(category.slug)}
              style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView
                type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.chip}>
                <ThemedText>{t(`category.${category.slug}`)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {groupLabel(category.group)}
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
