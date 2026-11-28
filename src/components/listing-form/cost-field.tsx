import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { FieldError, HintButton } from '@/components/form-controls';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CostType } from '@/lib/feed';

const COST_TYPES: CostType[] = ['free', 'split', 'paid'];

type Cost = { costType: CostType; costText: string };

type CostFieldProps = Cost & {
  onChange: (value: Cost) => void;
  error?: string | null;
};

/** Free, chipping in or paid, with the amount per person for the last two. */
export function CostField({ costType, costText, onChange, error }: CostFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <View style={styles.titleRow}>
        <ThemedText type="smallBold">{t('create.cost')}</ThemedText>
        <HintButton label={t('create.costHintLabel')} hint={t('create.costHint')} />
      </View>
      <View role="radiogroup" aria-label={t('create.cost')} style={[styles.segments, { backgroundColor: theme.backgroundElement }]}>
        {COST_TYPES.map((type) => {
          const chosen = type === costType;
          return (
            <Pressable
              key={type}
              role="radio"
              aria-checked={chosen}
              onPress={() => onChange({ costType: type, costText })}
              style={({ pressed }) => [
                styles.segment,
                chosen && { backgroundColor: theme.accent },
                pressed && styles.pressed,
              ]}>
              <ThemedText numberOfLines={1} style={[styles.segmentText, { color: chosen ? theme.onAccent : theme.textSecondary }]}>
                {t(`create.costTypes.${type}`)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
      {costType !== 'free' ? (
        <View style={styles.amountRow}>
          <TextInput
            value={costText}
            onChangeText={(text) => onChange({ costType, costText: text })}
            keyboardType="decimal-pad"
            inputMode="decimal"
            maxLength={9}
            accessibilityLabel={t('create.amount')}
            placeholder="5"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.amount,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: error ? theme.danger : theme.backgroundElement,
              },
            ]}
          />
          <ThemedText themeColor="textSecondary">{t('create.perPerson')}</ThemedText>
        </View>
      ) : null}
      <FieldError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  // The «?» is as tall as a finger; the row stays as tall as the title.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -12,
  },
  segments: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: Spacing.three,
  },
  // Longer names, like «Скидываемся», get more room than shorter ones.
  segment: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  segmentText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amount: {
    width: 110,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 18,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
